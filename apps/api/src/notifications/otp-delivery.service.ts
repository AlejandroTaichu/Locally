import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OtpChannel } from '../generated/prisma/client.js';

type OtpDeliveryMode = 'console' | 'providers';

@Injectable()
export class OtpDeliveryService implements OnModuleInit {
  private readonly logger = new Logger(OtpDeliveryService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const mode = this.deliveryMode();
    if (this.config.get('NODE_ENV') === 'production' && mode !== 'providers') {
      throw new Error('OTP_DELIVERY_MODE=providers is required in production');
    }
  }

  async send(channel: OtpChannel, target: string, code: string): Promise<void> {
    if (this.deliveryMode() === 'console') {
      this.logger.log(`OTP for ${channel}:${target} = ${code}`);
      return;
    }

    if (channel === 'email') {
      await this.sendEmail(target, code);
    } else {
      await this.sendSms(target, code);
    }

    this.logger.log(`OTP queued through ${channel} provider`);
  }

  private deliveryMode(): OtpDeliveryMode {
    const mode = this.config.get<string>('OTP_DELIVERY_MODE') ?? 'console';
    if (mode !== 'console' && mode !== 'providers') {
      throw new Error('OTP_DELIVERY_MODE must be either console or providers');
    }
    return mode;
  }

  private async sendEmail(target: string, code: string): Promise<void> {
    const apiKey = this.required('RESEND_API_KEY');
    const from = this.required('OTP_FROM_EMAIL');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `otp-email-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        from,
        to: [target],
        subject: 'Katıl doğrulama kodun',
        text: `Katıl doğrulama kodun: ${code}. Kod 5 dakika geçerlidir.`,
      }),
    });
    await this.ensureAccepted(response, 'email');
  }

  private async sendSms(target: string, code: string): Promise<void> {
    const accountSid = this.required('TWILIO_ACCOUNT_SID');
    const authToken = this.required('TWILIO_AUTH_TOKEN');
    const fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER');
    const messagingServiceSid = this.config.get<string>('TWILIO_MESSAGING_SERVICE_SID');
    if (!fromNumber && !messagingServiceSid) {
      throw new Error('TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID is required');
    }

    const body = new URLSearchParams({
      To: target,
      Body: `Katıl doğrulama kodun: ${code}. Kod 5 dakika geçerlidir.`,
      ...(messagingServiceSid ? { MessagingServiceSid: messagingServiceSid } : { From: fromNumber! }),
    });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    await this.ensureAccepted(response, 'sms');
  }

  private required(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`${key} is required when OTP_DELIVERY_MODE=providers`);
    }
    return value;
  }

  private async ensureAccepted(response: Response, provider: string): Promise<void> {
    if (!response.ok) {
      this.logger.error(`${provider} OTP provider rejected the request with status ${response.status}`);
      throw new ServiceUnavailableException('Doğrulama kodu şu anda gönderilemiyor, lütfen tekrar dene');
    }
  }
}
