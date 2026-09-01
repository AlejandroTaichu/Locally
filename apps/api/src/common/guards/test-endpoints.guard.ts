import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Hides test-support endpoints (e.g. reading a simulated OTP code) behind an
 * explicit opt-in env flag, so they can never be reachable unless a .env
 * file sets ENABLE_TEST_ENDPOINTS=true (only apps/api/.env.test does).
 */
@Injectable()
export class TestEndpointsGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (this.config.get<string>('ENABLE_TEST_ENDPOINTS') !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
