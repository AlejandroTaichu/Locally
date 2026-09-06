import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OtpDeliveryService } from './otp-delivery.service.js';

function serviceWith(values: Record<string, string | undefined>) {
  const config = {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService;
  return new OtpDeliveryService(config);
}

describe('OtpDeliveryService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects console delivery in production', () => {
    const service = serviceWith({ NODE_ENV: 'production', OTP_DELIVERY_MODE: 'console' });
    expect(() => service.onModuleInit()).toThrow('OTP_DELIVERY_MODE=providers is required in production');
  });

  it('sends email OTPs through Resend without exposing the API key in the body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const service = serviceWith({
      OTP_DELIVERY_MODE: 'providers',
      RESEND_API_KEY: 'resend-secret',
      OTP_FROM_EMAIL: 'Katıl <giris@katil.example>',
    });

    await service.send('email', 'user@example.com', '123456');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer resend-secret' });
    expect(String(init.body)).toContain('123456');
    expect(String(init.body)).not.toContain('resend-secret');
  });

  it('sends phone OTPs through the Twilio Messages API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const service = serviceWith({
      OTP_DELIVERY_MODE: 'providers',
      TWILIO_ACCOUNT_SID: 'AC123',
      TWILIO_AUTH_TOKEN: 'twilio-secret',
      TWILIO_FROM_NUMBER: '+15551234567',
    });

    await service.send('phone', '+905551234567', '654321');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/Accounts/AC123/Messages.json');
    expect(String(init.body)).toContain('To=%2B905551234567');
    expect(String(init.body)).toContain('From=%2B15551234567');
    expect(String(init.body)).toContain('654321');
  });

  it('returns a retryable service error when a provider rejects delivery', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 429 })));
    const service = serviceWith({
      OTP_DELIVERY_MODE: 'providers',
      RESEND_API_KEY: 'resend-secret',
      OTP_FROM_EMAIL: 'Katıl <giris@katil.example>',
    });

    await expect(service.send('email', 'user@example.com', '123456')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
