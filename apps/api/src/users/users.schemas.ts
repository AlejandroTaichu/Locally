import { z } from 'zod';

export const updateMeSchema = z.object({
  displayName: z.string().trim().min(2, 'Ad Soyad en az 2 karakter olmalı').max(80, 'Ad Soyad çok uzun').optional(),
  onboardingCompleted: z.literal(true).optional(),
  age: z.number().int().min(13, 'Yaş en az 13 olmalı').max(100, 'Geçersiz yaş').optional(),
  bio: z.string().trim().max(280, 'Bio çok uzun').optional(),
  interests: z.array(z.string().trim().min(1)).max(3, 'En fazla 3 ilgi alanı seçebilirsin').optional(),
  homeLocationLat: z.number().min(-90).max(90, 'Geçersiz konum').optional(),
  homeLocationLng: z.number().min(-180).max(180, 'Geçersiz konum').optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, 'Kullanıcı adı 3-20 karakter, sadece küçük harf/rakam/alt çizgi içerebilir')
    .optional(),
  gender: z.enum(['male', 'female'], { message: 'Geçersiz cinsiyet' }).optional(),
  notifyEventReminders: z.boolean().optional(),
  notifyNewParticipants: z.boolean().optional(),
  notifyRecommendations: z.boolean().optional(),
});
export type UpdateMeDto = z.infer<typeof updateMeSchema>;

export const requestEmailChangeSchema = z.object({
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi gir'),
});
export type RequestEmailChangeDto = z.infer<typeof requestEmailChangeSchema>;

export const verifyEmailChangeSchema = requestEmailChangeSchema.extend({
  code: z.string().trim().length(6, 'Kod 6 haneli olmalı'),
});
export type VerifyEmailChangeDto = z.infer<typeof verifyEmailChangeSchema>;

export const requestPhoneChangeSchema = z.object({
  phone: z.string().trim().min(7, 'Geçerli bir telefon numarası gir').max(20, 'Telefon numarası çok uzun'),
});
export type RequestPhoneChangeDto = z.infer<typeof requestPhoneChangeSchema>;

export const verifyPhoneChangeSchema = requestPhoneChangeSchema.extend({
  code: z.string().trim().length(6, 'Kod 6 haneli olmalı'),
});
export type VerifyPhoneChangeDto = z.infer<typeof verifyPhoneChangeSchema>;
