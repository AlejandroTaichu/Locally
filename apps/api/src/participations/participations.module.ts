import { Module } from '@nestjs/common';
import { ParticipationsService } from './participations.service.js';
import { ParticipationsController } from './participations.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  providers: [ParticipationsService],
  controllers: [ParticipationsController],
})
export class ParticipationsModule {}
