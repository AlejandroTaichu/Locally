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

    const existing = await this.prisma.participation.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) {
      throw new ConflictException('Already requested or joined this event');
    }

    await this.assertMeetsRestrictions(event, userId);
    await this.assertMonthlyJoinLimitAvailable(userId);

    if (event.joinType === 'instant') {
      await this.assertCapacityAvailable(eventId, event.capacity);
      return this.prisma.participation.create({
        data: { eventId, userId, status: 'joined' },
        ...participationWithUser,
      });
    }

    const participation = await this.prisma.participation.create({
      data: { eventId, userId, status: 'pending' },
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
    if (participation.status !== 'pending') {
      throw new ConflictException('Participation already decided');
    }

    if (dto.status === 'approved') {
      await this.assertCapacityAvailable(participation.eventId, participation.event.capacity);
    }

    return this.prisma.participation.update({
      where: { id: participationId },
      data: { status: dto.status, decidedAt: new Date() },
      ...participationWithUser,
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
    if (participation.event.startsAt >= new Date()) {
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
    event: { genderRestriction: EventGenderRestriction; minAge: number; maxAge: number },
    userId: string,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { age: true, gender: true },
    });

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

  private async assertCapacityAvailable(eventId: string, capacity: number | null) {
    if (capacity === null) {
      return;
    }
    const confirmedCount = await this.prisma.participation.count({
      where: { eventId, status: { in: [...CONFIRMED_STATUSES] } },
    });
    if (confirmedCount >= capacity) {
      throw new ConflictException('Event is full');
    }
  }
}
