import { z } from 'zod';

export const updateMeSchema = z.object({
  displayName: z.string().trim().min(2, 'Ad Soyad en az 2 karakter olmalı').max(80, 'Ad Soyad çok uzun').optional(),
  isPremium: z.boolean().optional(),
  onboardingCompleted: z.literal(true).optional(),
});
export type UpdateMeDto = z.infer<typeof updateMeSchema>;
