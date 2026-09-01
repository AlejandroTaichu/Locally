import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { updateMeSchema } from './users.schemas.js';
import type { UpdateMeDto } from './users.schemas.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUserId() userId: string) {
    return this.usersService.getById(userId);
  }

  @Patch('me')
  updateMe(@CurrentUserId() userId: string, @Body(new ZodValidationPipe(updateMeSchema)) dto: UpdateMeDto) {
    return this.usersService.updateDisplayName(userId, dto);
  }
}
