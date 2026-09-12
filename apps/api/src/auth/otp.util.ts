import { randomInt } from 'node:crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const code = randomInt(max);
  return code.toString().padStart(OTP_LENGTH, '0');
}

export function otpExpiryDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + OTP_TTL_MINUTES * 60 * 1000);
}
