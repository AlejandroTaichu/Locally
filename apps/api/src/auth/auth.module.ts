import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { OtpChallengeService } from './otp-challenge.service.js';

@Module({
  imports: [
    NotificationsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  providers: [AuthService, JwtAuthGuard, OtpChallengeService],
  controllers: [AuthController],
  exports: [JwtModule, JwtAuthGuard, OtpChallengeService],
})
export class AuthModule {}
