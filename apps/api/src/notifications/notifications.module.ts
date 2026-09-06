import { Module } from '@nestjs/common';
import { OtpDeliveryService } from './otp-delivery.service.js';

@Module({
  providers: [OtpDeliveryService],
  exports: [OtpDeliveryService],
})
export class NotificationsModule {}
