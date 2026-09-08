import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { OtpChannel } from '../generated/prisma/client.js';
import { generateOtpCode, otpExpiryDate } from '../auth/otp.util.js';
import type { UpdateMeDto } from './users.schemas.js';
import { OtpDeliveryService } from '../notifications/otp-delivery.service.js';

const TARGET_TAKEN_MESSAGE: Record<OtpChannel, string> = {
  email: 'Bu e-posta adresi zaten kullanımda',
  phone: 'Bu telefon numarası zaten kullanımda',
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpDelivery: OtpDeliveryService,
  ) {}

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Gerçek abonelik faturalandırması yok (bkz. ADR 0002) — cron/job altyapısı kurmak yerine,
    // deneme süresi burada "tembel" (lazy) olarak, her okuma anında kontrol edilip sona
    // erdirilir. Bu proje genelinde tercih edilen altyapısız/pragmatik desen.
    if (user.isPremium && user.premiumTrialEndsAt && user.premiumTrialEndsAt < new Date()) {
      return this.prisma.user.update({ where: { id }, data: { isPremium: false } });
    }

    return user;
  }

  async startTrial(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    if (user.isPremium || user.premiumTrialEndsAt !== null) {
      throw new ConflictException('Deneme hakkını zaten kullandın');
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    return this.prisma.user.update({
      where: { id },
      data: { isPremium: true, premiumTrialEndsAt: trialEndsAt },
    });
  }

  async updateMe(id: string, dto: UpdateMeDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
          ...(dto.isPremium !== undefined ? { isPremium: dto.isPremium } : {}),
          ...(dto.onboardingCompleted !== undefined ? { onboardingCompletedAt: new Date() } : {}),
          ...(dto.age !== undefined ? { age: dto.age } : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
          ...(dto.interests !== undefined ? { interests: dto.interests } : {}),
          ...(dto.homeLocationLat !== undefined ? { homeLocationLat: dto.homeLocationLat } : {}),
          ...(dto.homeLocationLng !== undefined ? { homeLocationLng: dto.homeLocationLng } : {}),
          ...(dto.username !== undefined ? { username: dto.username } : {}),
          ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
          ...(dto.notifyEventReminders !== undefined ? { notifyEventReminders: dto.notifyEventReminders } : {}),
          ...(dto.notifyNewParticipants !== undefined ? { notifyNewParticipants: dto.notifyNewParticipants } : {}),
          ...(dto.notifyRecommendations !== undefined ? { notifyRecommendations: dto.notifyRecommendations } : {}),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Bu kullanıcı adı zaten alınmış');
      }
      throw error;
    }
  }

  async deleteMe(id: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUniqueOrThrow({ where: { id } });
      const organizedEvents = await transaction.event.findMany({ where: { organizerId: id }, select: { id: true } });
      const organizedEventIds = organizedEvents.map((event) => event.id);
      const participations = await transaction.participation.findMany({
        where: {
          OR: [{ userId: id }, ...(organizedEventIds.length > 0 ? [{ eventId: { in: organizedEventIds } }] : [])],
        },
        select: { id: true },
      });
      const participationIds = participations.map((participation) => participation.id);

      if (participationIds.length > 0) {
        await transaction.eventRating.deleteMany({ where: { participationId: { in: participationIds } } });
        await transaction.participation.deleteMany({ where: { id: { in: participationIds } } });
      }
      if (organizedEventIds.length > 0) {
        await transaction.event.deleteMany({ where: { id: { in: organizedEventIds } } });
      }
      await transaction.otpCode.deleteMany({
        where: {
          OR: [
            { channel: 'email', target: user.email },
            { channel: 'phone', target: user.phone },
          ],
        },
      });
      await transaction.user.delete({ where: { id } });
    });
  }

  requestEmailChange(userId: string, email: string) {
    return this.requestTargetChange('email', userId, email);
  }

  verifyEmailChange(userId: string, email: string, code: string) {
    return this.verifyTargetChange('email', userId, email, code);
  }

  requestPhoneChange(userId: string, phone: string) {
    return this.requestTargetChange('phone', userId, phone);
  }

  verifyPhoneChange(userId: string, phone: string, code: string) {
    return this.verifyTargetChange('phone', userId, phone, code);
  }

  private async requestTargetChange(channel: OtpChannel, userId: string, target: string): Promise<{ ok: true }> {
    const current = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if ((channel === 'email' ? current.email : current.phone) === target) {
      throw new ConflictException(channel === 'email' ? 'Bu zaten mevcut e-posta adresin' : 'Bu zaten mevcut telefon numaran');
    }

    const existing = await this.findUserByTarget(channel, target);
    if (existing) {
      throw new ConflictException(TARGET_TAKEN_MESSAGE[channel]);
    }

    const code = generateOtpCode();
    const otp = await this.prisma.otpCode.create({ data: { channel, target, code, expiresAt: otpExpiryDate() } });
    try {
      await this.otpDelivery.send(channel, target, code);
    } catch (error) {
      await this.prisma.otpCode.delete({ where: { id: otp.id } }).catch(() => undefined);
      throw error;
    }

    return { ok: true };
  }

  private async verifyTargetChange(channel: OtpChannel, userId: string, target: string, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { channel, target, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.code !== code || otp.expiresAt < new Date()) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş kod');
    }

    const existing = await this.findUserByTarget(channel, target);
    if (existing && existing.id !== userId) {
      throw new ConflictException(TARGET_TAKEN_MESSAGE[channel]);
    }

    await this.prisma.$transaction([
      this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
      this.prisma.user.update({
        where: { id: userId },
        data:
          channel === 'email'
            ? { email: target, emailVerifiedAt: new Date() }
            : { phone: target, phoneVerifiedAt: new Date() },
      }),
    ]);

    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  private findUserByTarget(channel: OtpChannel, target: string) {
    return this.prisma.user.findUnique({ where: channel === 'email' ? { email: target } : { phone: target } });
  }
}
