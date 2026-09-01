import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { createEventSchema, listEventsQuerySchema } from './events.schemas.js';
import type { CreateEventDto, ListEventsQueryDto } from './events.schemas.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@CurrentUserId() organizerId: string, @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventDto) {
    return this.eventsService.create(organizerId, dto);
  }

  @Get()
  list(@CurrentUserId() userId: string, @Query(new ZodValidationPipe(listEventsQuerySchema)) query: ListEventsQueryDto) {
    return this.eventsService.list(userId, query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.eventsService.getById(id);
  }
}
