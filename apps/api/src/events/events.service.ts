import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { haversineDistanceKm } from './geo.util.js';
import type { CreateEventDto, ListEventsQueryDto } from './events.schemas.js';

const DEFAULT_RADIUS_KM = 15;

const eventWithOrganizer = {
  include: { organizer: { select: { id: true, displayName: true } } },
} as const;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizerId: string, dto: CreateEventDto) {
    if (dto.premiumOnlyMatching) {
      const organizer = await this.prisma.user.findUniqueOrThrow({
        where: { id: organizerId },
        select: { isPremium: true },
      });
      if (!organizer.isPremium) {
        throw new ForbiddenException('Only premium organizers can create premium-only events');
      }
    }

    return this.prisma.event.create({
      data: {
        organizerId,
        title: dto.title,
        category: dto.category,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationLabel: dto.locationLabel,
        startsAt: dto.startsAt,
        capacity: dto.capacity,
        joinType: dto.joinType,
        premiumOnlyMatching: dto.premiumOnlyMatching,
      },
      ...eventWithOrganizer,
    });
  }

  async list(userId: string, query: ListEventsQueryDto) {
    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { isPremium: true },
    });

    const events = await this.prisma.event.findMany({
      where: {
        startsAt: { gte: new Date() },
        ...(requester.isPremium ? {} : { premiumOnlyMatching: false }),
      },
      orderBy: { startsAt: 'asc' },
      ...eventWithOrganizer,
    });

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

  async getById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id }, ...eventWithOrganizer });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }
}
