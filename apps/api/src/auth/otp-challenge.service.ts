import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { OtpChannel, OtpCode } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { OtpDeliveryService } from '../notifications/otp-delivery.service.js';
import { generateOtpCode, otpExpiryDate } from './otp.util.js';

const RESEND_COOLDOWN_MS = 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_FAILED_ATTEMPTS = 5;
const INVALID_CODE_MESSAGE = 'Geçersiz veya süresi dolmuş kod';

@Injectable()
export class OtpChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: OtpDeliveryService,
  ) {}

  async issue(channel: OtpChannel, target: string): Promise<void> {
    const now = new Date();
    const [latestPending, recentCount] = await Promise.all([
      this.prisma.otpCode.findFirst({
        where: { channel, target, consumedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.otpCode.count({
        where: { channel, target, createdAt: { gte: new Date(now.getTime() - SEND_WINDOW_MS) } },
      }),
    ]);

    if (latestPending && latestPending.createdAt.getTime() > now.getTime() - RESEND_COOLDOWN_MS) {
      throw new HttpException('Yeni kod istemeden önce bir dakika bekle', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (recentCount >= MAX_SENDS_PER_WINDOW) {
      throw new HttpException('Çok fazla kod istedin, lütfen daha sonra tekrar dene', HttpStatus.TOO_MANY_REQUESTS);
    }

    const otp = await this.prisma.otpCode.create({
      data: { channel, target, code: generateOtpCode(), expiresAt: otpExpiryDate(now) },
    });
    try {
      await this.delivery.send(channel, target, otp.code);
    } catch (error) {
      await this.prisma.otpCode.delete({ where: { id: otp.id } }).catch(() => undefined);
      throw error;
    }
  }

  async validate(channel: OtpChannel, target: string, code: string): Promise<OtpCode> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { channel, target, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || new Date(otp.expiresAt).getTime() < Date.now() || otp.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }
    if (otp.code !== code) {
      await this.prisma.otpCode.updateMany({
        where: { id: otp.id, consumedAt: null, failedAttempts: { lt: MAX_FAILED_ATTEMPTS } },
        data: { failedAttempts: { increment: 1 } },
      });
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    return otp;
  }

  async consume(id: string): Promise<void> {
    const result = await this.prisma.otpCode.updateMany({
      where: {
        id,
        consumedAt: null,
        expiresAt: { gte: new Date() },
        failedAttempts: { lt: MAX_FAILED_ATTEMPTS },
      },
      data: { consumedAt: new Date() },
    });
    if (result.count !== 1) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }
  }
}
