import { Body, Controller, Get, NotFoundException, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { TestEndpointsGuard } from '../common/guards/test-endpoints.guard.js';
import { registerSchema, requestOtpSchema, verifyOtpSchema, otpChannelSchema } from './auth.schemas.js';
import type { RegisterDto, RequestOtpDto, VerifyOtpDto } from './auth.schemas.js';
import { z } from 'zod';

const otpDebugQuerySchema = z.object({
  channel: otpChannelSchema,
  target: z.string().trim().min(3),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('otp/request')
  requestOtp(@Body(new ZodValidationPipe(requestOtpSchema)) dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body(new ZodValidationPipe(verifyOtpSchema)) dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Get('otp/debug')
  @UseGuards(TestEndpointsGuard)
  async debugOtp(@Query(new ZodValidationPipe(otpDebugQuerySchema)) query: z.infer<typeof otpDebugQuerySchema>) {
    const otp = await this.authService.getLatestOtpCode(query.channel, query.target);
    if (!otp) {
      throw new NotFoundException('No pending OTP for this channel/target');
    }
    return otp;
  }
}
