import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ParticipationsService } from './participations.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { decideParticipationSchema, submitRatingSchema } from './participations.schemas.js';
import type { DecideParticipationDto, SubmitRatingDto } from './participations.schemas.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class ParticipationsController {
  constructor(private readonly participationsService: ParticipationsService) {}

  @Post('events/:eventId/participations')
  request(@Param('eventId') eventId: string, @CurrentUserId() userId: string) {
    return this.participationsService.request(eventId, userId);
  }

  @Get('events/:eventId/participations')
  listForEvent(@Param('eventId') eventId: string) {
    return this.participationsService.listForEvent(eventId);
  }

  @Patch('participations/:id')
  decide(
    @Param('id') id: string,
    @CurrentUserId() organizerId: string,
    @Body(new ZodValidationPipe(decideParticipationSchema)) dto: DecideParticipationDto,
  ) {
    return this.participationsService.decide(id, organizerId, dto);
  }

  @Get('participations/pending-rating')
  getPendingRating(@CurrentUserId() userId: string) {
    return this.participationsService.getPendingRating(userId);
  }

  @Post('participations/:id/rating')
  submitRating(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(submitRatingSchema)) dto: SubmitRatingDto,
  ) {
    return this.participationsService.submitRating(id, userId, dto);
  }
}
