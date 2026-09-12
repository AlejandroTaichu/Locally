import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { OtpChannel, User } from '../generated/prisma/client.js';
import type { LoginDto, RegisterDto, RequestOtpDto, ResetPasswordDto, VerifyOtpDto } from './auth.schemas.js';
import { OtpChallengeService } from './otp-challenge.service.js';
import { hashPassword, verifyPassword } from './password.util.js';

function normalizeTarget(channel: OtpChannel, target: string): string {
  return channel === 'email' ? target.trim().toLowerCase() : target.trim();
}

export interface AuthResult {
  accessToken: string;
  user: Pick<
    User,
    | 'id'
    | 'displayName'
    | 'email'
    | 'phone'
    | 'isPremium'
    | 'emailVerifiedAt'
    | 'phoneVerifiedAt'
    | 'onboardingCompletedAt'
    | 'age'
    | 'bio'
    | 'interests'
    | 'homeLocationLat'
    | 'homeLocationLng'
    | 'username'
    | 'premiumTrialEndsAt'
    | 'gender'
  >;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpChallenge: OtpChallengeService,
  ) {}

  async register(dto: RegisterDto): Promise<{ userId: string }> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existing) {
      throw new ConflictException('A user with this email or phone already exists');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        displayName: dto.displayName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
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

    const otp = await this.otpChallenge.validate(dto.channel, target, dto.code);

    const user = await this.findUserByChannelTarget(dto.channel, target);
    if (!user) {
      throw new NotFoundException('No account found for this email/phone');
    }

    await this.otpChallenge.consume(otp.id);
    await this.prisma.user.update({
      where: { id: user.id },
      data:
        dto.channel === 'email'
          ? { emailVerifiedAt: user.emailVerifiedAt ?? new Date() }
          : { phoneVerifiedAt: user.phoneVerifiedAt ?? new Date() },
    });

    const refreshedUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return this.toAuthResult(refreshedUser);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Önce hesabını e-postana gelen kodla doğrulaman gerekiyor');
    }

    return this.toAuthResult(user);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const otp = await this.otpChallenge.validate('email', email, dto.code);

    const user = await this.findUserByChannelTarget('email', email);
    if (!user) {
      throw new NotFoundException('No account found for this email/phone');
    }

    await this.otpChallenge.consume(otp.id);
    const passwordHash = await hashPassword(dto.newPassword);
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        // Invalidates every token issued before the reset — closes the
        // window where a compromised account's old sessions stay valid.
        sessionVersion: { increment: 1 },
      },
    });

    return this.toAuthResult(updatedUser);
  }

  private async toAuthResult(user: User): Promise<AuthResult> {
    const accessToken = await this.jwtService.signAsync({ sub: user.id, sessionVersion: user.sessionVersion });
    return {
      accessToken,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        isPremium: user.isPremium,
        emailVerifiedAt: user.emailVerifiedAt,
        phoneVerifiedAt: user.phoneVerifiedAt,
        onboardingCompletedAt: user.onboardingCompletedAt,
        age: user.age,
        bio: user.bio,
        interests: user.interests,
        homeLocationLat: user.homeLocationLat,
        homeLocationLng: user.homeLocationLng,
        username: user.username,
        premiumTrialEndsAt: user.premiumTrialEndsAt,
        gender: user.gender,
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
    await this.otpChallenge.issue(channel, target);
  }
}
