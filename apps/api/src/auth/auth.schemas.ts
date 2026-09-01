import { z } from 'zod';

export const otpChannelSchema = z.enum(['email', 'phone']);

export const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(7).max(20),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const requestOtpSchema = z.object({
  channel: otpChannelSchema,
  target: z.string().trim().min(3),
});
export type RequestOtpDto = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  channel: otpChannelSchema,
  target: z.string().trim().min(3),
  code: z.string().trim().length(6),
});
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
