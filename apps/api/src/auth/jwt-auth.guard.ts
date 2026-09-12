import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

interface JwtPayload {
  sub: string;
  sessionVersion: number;
}

export type AuthenticatedRequest = Request & { userId: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length);
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // A user whose password was reset (or session otherwise revoked) has a
    // higher sessionVersion than any token issued beforehand — reject those.
    // A missing user is left to the controller/service layer (e.g. a 404 on
    // an already-deleted account), not turned into a 401 here.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { sessionVersion: true },
    });
    if (user && user.sessionVersion !== payload.sessionVersion) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.userId = payload.sub;
    return true;
  }
}
