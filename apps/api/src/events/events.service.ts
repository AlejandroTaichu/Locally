import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { haversineDistanceKm } from './geo.util.js';
import type { CreateEventDto, ListEventsQueryDto } from './events.schemas.js';

const DEFAULT_RADIUS_KM = 15;
const MAX_EVENTS_PER_ORGANIZER_PER_DAY = 5;
const SPAM_WINDOW_MS = 24 * 60 * 60 * 1000;

const CONFIRMED_PARTICIPATION_STATUSES = ['joined', 'approved'] as const;

const eventWithOrganizer = {
  include: {
    organizer: { select: { id: true, displayName: true } },
    _count: {
      select: { participations: { where: { status: { in: [...CONFIRMED_PARTICIPATION_STATUSES] } } } },
    },
  },
};

function toEventDto<T extends { _count: { participations: number } }>(event: T) {
  const { _count, ...rest } = event;
  return { ...rest, participantCount: _count.participations };
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // EventRating -> Participation -> Event -> organizerId iki join uzağında; Prisma bu derinlikte
  // tek sorguda gruplama desteklemiyor, o yüzden ham skorlar tek sorguda çekilip JS'te
  // gruplanıyor (repo genelinde raw SQL kullanılmıyor, MVP ölçeğinde performans sorunu değil).
  private async attachOrganizerRatings<T extends { organizer: { id: string } }>(events: T[]) {
    const organizerIds = [...new Set(events.map((e) => e.organizer.id))];
    if (organizerIds.length === 0) {
      return events;
    }

    const ratings = await this.prisma.eventRating.findMany({
      where: { participation: { event: { organizerId: { in: organizerIds } } } },
      select: { score: true, participation: { select: { event: { select: { organizerId: true } } } } },
    });

    const byOrganizer = new Map<string, number[]>();
    for (const rating of ratings) {
      const organizerId = rating.participation.event.organizerId;
      const scores = byOrganizer.get(organizerId) ?? [];
      scores.push(rating.score);
      byOrganizer.set(organizerId, scores);
    }

    return events.map((event) => {
      const scores = byOrganizer.get(event.organizer.id);
      const averageRating = scores ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
      return { ...event, organizer: { ...event.organizer, averageRating, ratingCount: scores?.length ?? 0 } };
    });
  }

  async create(organizerId: string, dto: CreateEventDto) {
    if (dto.premiumOnlyMatching) {
      const organizer = await this.prisma.user.findUniqueOrThrow({
        where: { id: organizerId },
        select: { isPremium: true },
      });
      if (!organizer.isPremium) {
        throw new ForbiddenException('Sadece premium organizatörler premium-only etkinlik oluşturabilir');
      }
    }

    const recentEventCount = await this.prisma.event.count({
      where: { organizerId, createdAt: { gte: new Date(Date.now() - SPAM_WINDOW_MS) } },
    });
    if (recentEventCount >= MAX_EVENTS_PER_ORGANIZER_PER_DAY) {
      throw new HttpException('Çok fazla etkinlik oluşturdun, lütfen daha sonra tekrar dene', HttpStatus.TOO_MANY_REQUESTS);
    }

    const event = await this.prisma.event.create({
      data: {
        organizerId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationLabel: dto.locationLabel,
        startsAt: dto.startsAt,
        capacity: dto.capacity,
        joinType: dto.joinType,
        premiumOnlyMatching: dto.premiumOnlyMatching,
        genderRestriction: dto.genderRestriction,
        minAge: dto.minAge,
        maxAge: dto.maxAge,
      },
      ...eventWithOrganizer,
    });
    const [withRating] = await this.attachOrganizerRatings([toEventDto(event)]);
    return withRating;
  }

  async list(userId: string, query: ListEventsQueryDto) {
    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { isPremium: true },
    });

    const rawEvents = await this.prisma.event.findMany({
      where: {
        startsAt: { gte: new Date() },
        ...(requester.isPremium ? {} : { premiumOnlyMatching: false }),
      },
      orderBy: { startsAt: 'asc' },
      ...eventWithOrganizer,
    });
    const events = await this.attachOrganizerRatings(rawEvents.map(toEventDto));

    // Premium users see every matching event globally — no radius filter.
    if (requester.isPremium) {
      return events;
    }

    if (query.lat === undefined || query.lng === undefined) {
      return events;
    }

    const radiusKm = query.radiusKm ?? DEFAULT_RADIUS_KM;
    return events
      .map((event) => ({
        ...event,
        distanceKm: haversineDistanceKm(query.lat!, query.lng!, event.locationLat, event.locationLng),
      }))
      .filter((event) => event.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async listMine(userId: string) {
    const [organizedRaw, participations] = await Promise.all([
      this.prisma.event.findMany({
        where: { organizerId: userId },
        orderBy: { startsAt: 'asc' },
        ...eventWithOrganizer,
      }),
      this.prisma.participation.findMany({
        where: { userId },
        orderBy: { event: { startsAt: 'asc' } },
        include: { event: { include: eventWithOrganizer.include } },
      }),
    ]);

    const organizedEvents = await this.attachOrganizerRatings(organizedRaw.map(toEventDto));
    const participantEvents = await this.attachOrganizerRatings(participations.map((p) => toEventDto(p.event)));

    const organized = organizedEvents.map((event) => ({ event, role: 'organizer' as const }));
    const participating = participantEvents.map((event, index) => ({
      event,
      role: 'participant' as const,
      participationStatus: participations[index].status,
    }));

    return [...organized, ...participating].sort(
      (a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime(),
    );
  }

  async getById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id }, ...eventWithOrganizer });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    const [withRating] = await this.attachOrganizerRatings([toEventDto(event)]);
    return withRating;
  }
}
