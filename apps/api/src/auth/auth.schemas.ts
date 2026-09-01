import { z } from 'zod';

export const otpChannelSchema = z.enum(['email', 'phone'], { message: 'Geçersiz kanal' });

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, 'Ad Soyad en az 2 karakter olmalı').max(80, 'Ad Soyad çok uzun'),
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi gir'),
  phone: z.string().trim().min(7, 'Geçerli bir telefon numarası gir').max(20, 'Telefon numarası çok uzun'),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const requestOtpSchema = z.object({
  channel: otpChannelSchema,
  target: z.string().trim().min(3, 'E-posta veya telefon numarası gir'),
});
export type RequestOtpDto = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  channel: otpChannelSchema,
  target: z.string().trim().min(3, 'E-posta veya telefon numarası gir'),
  code: z.string().trim().length(6, 'Kod 6 haneli olmalı'),
});
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
