import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { OtpChannel, User } from '../generated/prisma/client.js';
import { generateOtpCode, otpExpiryDate } from './otp.util.js';
import type { RegisterDto, RequestOtpDto, VerifyOtpDto } from './auth.schemas.js';

function normalizeTarget(channel: OtpChannel, target: string): string {
  return channel === 'email' ? target.trim().toLowerCase() : target.trim();
}

export interface AuthResult {
  accessToken: string;
  user: Pick<
    User,
    'id' | 'displayName' | 'email' | 'phone' | 'isPremium' | 'emailVerifiedAt' | 'phoneVerifiedAt' | 'onboardingCompletedAt'
  >;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ userId: string }> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existing) {
      throw new ConflictException('A user with this email or phone already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        displayName: dto.displayName,
        email: dto.email,
        phone: dto.phone,
      },
    });

    await this.issueOtp('email', user.email);

    return { userId: user.id };
  }

  async requestOtp(dto: RequestOtpDto): Promise<{ ok: true }> {
    const target = normalizeTarget(dto.channel, dto.target);
    const user = await this.findUserByChannelTarget(dto.channel, target);
    if (!user) {
      throw new NotFoundException('No account found for this email/phone');
    }

    await this.issueOtp(dto.channel, target);
    return { ok: true };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResult> {
    const target = normalizeTarget(dto.channel, dto.target);

    const otp = await this.prisma.otpCode.findFirst({
      where: { channel: dto.channel, target, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.code !== dto.code || otp.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    const user = await this.findUserByChannelTarget(dto.channel, target);
    if (!user) {
      throw new NotFoundException('No account found for this email/phone');
    }

    await this.prisma.$transaction([
      this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: user.id },
        data:
          dto.channel === 'email'
            ? { emailVerifiedAt: user.emailVerifiedAt ?? new Date() }
            : { phoneVerifiedAt: user.phoneVerifiedAt ?? new Date() },
      }),
    ]);

    const refreshedUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const accessToken = await this.jwtService.signAsync({ sub: refreshedUser.id });

    return {
      accessToken,
      user: {
        id: refreshedUser.id,
        displayName: refreshedUser.displayName,
        email: refreshedUser.email,
        phone: refreshedUser.phone,
        isPremium: refreshedUser.isPremium,
        emailVerifiedAt: refreshedUser.emailVerifiedAt,
        phoneVerifiedAt: refreshedUser.phoneVerifiedAt,
        onboardingCompletedAt: refreshedUser.onboardingCompletedAt,
      },
    };
  }

  /** Test-only helper — never exposed unless ENABLE_TEST_ENDPOINTS=true. See TestEndpointsGuard. */
  async getLatestOtpCode(channel: OtpChannel, target: string): Promise<{ code: string } | null> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { channel, target: normalizeTarget(channel, target), consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return otp ? { code: otp.code } : null;
  }

  private findUserByChannelTarget(channel: OtpChannel, target: string) {
    return this.prisma.user.findUnique({
      where: channel === 'email' ? { email: target } : { phone: target },
    });
  }

  private async issueOtp(channel: OtpChannel, target: string): Promise<void> {
    const code = generateOtpCode();
    await this.prisma.otpCode.create({
      data: { channel, target, code, expiresAt: otpExpiryDate() },
    });

    // No real SMS/email provider yet — simulate delivery via logs (see ADR 0002).
    this.logger.log(`OTP for ${channel}:${target} = ${code}`);
  }
}
