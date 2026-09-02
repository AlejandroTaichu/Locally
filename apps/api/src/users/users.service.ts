import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateMeDto } from './users.schemas.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateMe(id: string, dto: UpdateMeDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.isPremium !== undefined ? { isPremium: dto.isPremium } : {}),
        ...(dto.onboardingCompleted !== undefined ? { onboardingCompletedAt: new Date() } : {}),
      },
    });
  }
}
