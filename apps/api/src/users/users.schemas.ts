import { z } from 'zod';

export const updateMeSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  isPremium: z.boolean().optional(),
});
export type UpdateMeDto = z.infer<typeof updateMeSchema>;
