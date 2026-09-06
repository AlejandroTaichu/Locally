import { Body, Controller, Delete, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  requestEmailChangeSchema,
  requestPhoneChangeSchema,
  updateMeSchema,
  verifyEmailChangeSchema,
  verifyPhoneChangeSchema,
} from './users.schemas.js';
import type {
  RequestEmailChangeDto,
  RequestPhoneChangeDto,
  UpdateMeDto,
  VerifyEmailChangeDto,
  VerifyPhoneChangeDto,
} from './users.schemas.js';

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
    return this.usersService.updateMe(userId, dto);
  }

  @Delete('me')
  @HttpCode(204)
  deleteMe(@CurrentUserId() userId: string) {
    return this.usersService.deleteMe(userId);
  }

  @Post('me/start-trial')
  startTrial(@CurrentUserId() userId: string) {
    return this.usersService.startTrial(userId);
  }

  @Post('me/email/request')
  requestEmailChange(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(requestEmailChangeSchema)) dto: RequestEmailChangeDto,
  ) {
    return this.usersService.requestEmailChange(userId, dto.email);
  }

  @Post('me/email/verify')
  verifyEmailChange(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(verifyEmailChangeSchema)) dto: VerifyEmailChangeDto,
  ) {
    return this.usersService.verifyEmailChange(userId, dto.email, dto.code);
  }

  @Post('me/phone/request')
  requestPhoneChange(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(requestPhoneChangeSchema)) dto: RequestPhoneChangeDto,
  ) {
    return this.usersService.requestPhoneChange(userId, dto.phone);
  }

  @Post('me/phone/verify')
  verifyPhoneChange(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(verifyPhoneChangeSchema)) dto: VerifyPhoneChangeDto,
  ) {
    return this.usersService.verifyPhoneChange(userId, dto.phone, dto.code);
  }
}
