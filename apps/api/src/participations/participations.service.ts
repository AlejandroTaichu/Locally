import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { EventGenderRestriction } from '../generated/prisma/client.js';
import type { DecideParticipationDto, SubmitRatingDto } from './participations.schemas.js';

const CONFIRMED_STATUSES = ['joined', 'approved'] as const;
const FREE_MONTHLY_JOIN_LIMIT = 3;
const PREMIUM_MONTHLY_JOIN_LIMIT = 10;

const participationWithUser = {
  include: { user: { select: { id: true, displayName: true } } },
} as const;

@Injectable()
export class ParticipationsService {
  private readonly logger = new Logger(ParticipationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async request(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: { select: { email: true } } },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.organizerId === userId) {
      throw new ForbiddenException('Kendi etkinliğine katılım isteği gönderemezsin');
    }
    if (new Date(event.startsAt).getTime() <= Date.now()) {
      throw new ConflictException('Başlamış veya sona ermiş bir etkinliğe katılamazsın');
    }

    const existing = await this.prisma.participation.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing && existing.status !== 'rejected') {
      throw new ConflictException('Already requested or joined this event');
    }

    await this.assertMeetsRestrictions(event, userId);
    await this.assertMonthlyJoinLimitAvailable(userId);

    // Reddedilmiş eski istek varsa upsert onu yeniden 'pending'/'joined' durumuna taşır —
    // eventId_userId unique kısıtı yüzünden reddedilen kullanıcı aksi halde bir daha hiç isteyemezdi.
    if (event.joinType === 'instant') {
      return this.prisma.$transaction(async (tx) => {
        await this.lockEventForCapacityCheck(tx, eventId);
        await this.assertCapacityAvailable(tx, eventId, event.capacity);
        return tx.participation.upsert({
          where: { eventId_userId: { eventId, userId } },
          create: { eventId, userId, status: 'joined' },
          update: { status: 'joined', requestedAt: new Date(), decidedAt: null },
          ...participationWithUser,
        });
      });
    }

    const participation = await this.prisma.participation.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status: 'pending' },
      update: { status: 'pending', requestedAt: new Date(), decidedAt: null },
      ...participationWithUser,
    });

    // Gerçek e-posta sağlayıcısı yok — OTP ile aynı desen (bkz. ADR 0002), log ile simüle ediliyor.
    this.logger.log(
      `Katılım isteği bildirimi: ${event.organizer.email} — ${participation.user.displayName}, "${event.title}" etkinliğine katılmak istiyor`,
    );

    return participation;
  }

  async listForEvent(eventId: string) {
    return this.prisma.participation.findMany({
      where: { eventId },
      orderBy: { requestedAt: 'asc' },
      ...participationWithUser,
    });
  }

  async decide(participationId: string, organizerId: string, dto: DecideParticipationDto) {
    const participation = await this.prisma.participation.findUnique({
      where: { id: participationId },
      include: { event: true },
    });
    if (!participation) {
      throw new NotFoundException('Participation not found');
    }
    if (participation.event.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer can decide on this request');
    }
    if (participation.userId === organizerId) {
      throw new ForbiddenException('Organizer cannot decide on their own participation');
    }
    if (participation.status !== 'pending') {
      throw new ConflictException('Participation already decided');
    }

    if (dto.status === 'rejected') {
      return this.prisma.participation.update({
        where: { id: participationId },
        data: { status: 'rejected', decidedAt: new Date() },
        ...participationWithUser,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await this.lockEventForCapacityCheck(tx, participation.eventId);
      await this.assertCapacityAvailable(tx, participation.eventId, participation.event.capacity);
      return tx.participation.update({
        where: { id: participationId },
        data: { status: 'approved', decidedAt: new Date() },
        ...participationWithUser,
      });
    });
  }

  async getPendingRating(userId: string) {
    const participation = await this.prisma.participation.findFirst({
      where: {
        userId,
        status: { in: [...CONFIRMED_STATUSES] },
        rating: null,
        event: { startsAt: { lt: new Date() } },
      },
      include: { event: { select: { id: true, title: true } } },
      orderBy: { event: { startsAt: 'asc' } },
    });
    return participation;
  }

  async submitRating(participationId: string, userId: string, dto: SubmitRatingDto) {
    const participation = await this.prisma.participation.findUnique({
      where: { id: participationId },
      include: { event: true, rating: true },
    });
    if (!participation) {
      throw new NotFoundException('Participation not found');
    }
    if (participation.userId !== userId) {
      throw new ForbiddenException('Only the participant can rate this event');
    }
    if (!CONFIRMED_STATUSES.includes(participation.status as (typeof CONFIRMED_STATUSES)[number])) {
      throw new ForbiddenException('Sadece onaylanmış bir katılımı puanlayabilirsin');
    }
    if (new Date(participation.event.startsAt).getTime() >= Date.now()) {
      throw new ConflictException('Event has not happened yet');
    }
    if (participation.rating) {
      throw new ConflictException('Already rated');
    }

    return this.prisma.eventRating.create({
      data: { participationId, score: dto.score },
    });
  }

  private async assertMeetsRestrictions(
    event: {
      genderRestriction: EventGenderRestriction;
      minAge: number;
      maxAge: number;
      premiumOnlyMatching: boolean;
    },
    userId: string,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { age: true, gender: true, isPremium: true },
    });

    if (event.premiumOnlyMatching && !user.isPremium) {
      throw new ForbiddenException('Bu etkinlik yalnızca premium katılımcılara açık');
    }

    if (user.age === null || user.age < event.minAge || user.age > event.maxAge) {
      throw new ForbiddenException(`Bu etkinlik ${event.minAge}-${event.maxAge} yaş aralığına açık`);
    }
    if (event.genderRestriction !== 'all' && user.gender !== event.genderRestriction) {
      throw new ForbiddenException(
        event.genderRestriction === 'female'
          ? 'Bu etkinlik sadece kadın katılımcılara açık'
          : 'Bu etkinlik sadece erkek katılımcılara açık',
      );
    }
  }

  private async assertMonthlyJoinLimitAvailable(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { isPremium: true },
    });
    const limit = user.isPremium ? PREMIUM_MONTHLY_JOIN_LIMIT : FREE_MONTHLY_JOIN_LIMIT;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const requestCount = await this.prisma.participation.count({
      where: { userId, requestedAt: { gte: startOfMonth } },
    });
    if (requestCount >= limit) {
      throw new HttpException(
        `Bu ay için katılım hakkın doldu (${limit}/ay). Daha fazlası için premium dene.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  // Event satırını kilitler; aynı etkinlik için eşzamanlı katılım/onay istekleri artık
  // birbirini bekler ve kontenjan sayımı her zaman güncel/tutarlı veri üzerinden yapılır
  // (önceki halinde count+create/update arasında yarış durumu vardı, kontenjan aşılabiliyordu).
  private async lockEventForCapacityCheck(tx: Prisma.TransactionClient, eventId: string) {
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
  }

  private async assertCapacityAvailable(
    tx: Prisma.TransactionClient,
    eventId: string,
    capacity: number | null,
  ) {
    if (capacity === null) {
      return;
    }
    const confirmedCount = await tx.participation.count({
      where: { eventId, status: { in: [...CONFIRMED_STATUSES] } },
    });
    if (confirmedCount >= capacity) {
      throw new ConflictException('Event is full');
    }
  }
}
