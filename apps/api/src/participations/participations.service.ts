import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { DecideParticipationDto } from './participations.schemas.js';

const CONFIRMED_STATUSES = ['joined', 'approved'] as const;

const participationWithUser = {
  include: { user: { select: { id: true, displayName: true } } },
} as const;

@Injectable()
export class ParticipationsService {
  constructor(private readonly prisma: PrismaService) {}

  async request(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.prisma.participation.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) {
      throw new ConflictException('Already requested or joined this event');
    }

    if (event.joinType === 'instant') {
      await this.assertCapacityAvailable(eventId, event.capacity);
      return this.prisma.participation.create({
        data: { eventId, userId, status: 'joined' },
        ...participationWithUser,
      });
    }

    return this.prisma.participation.create({
      data: { eventId, userId, status: 'pending' },
      ...participationWithUser,
    });
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
