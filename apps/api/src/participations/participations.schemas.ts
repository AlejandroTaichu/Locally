import { z } from 'zod';

export const decideParticipationSchema = z.object({
  status: z.enum(['approved', 'rejected'], { message: 'Durum "approved" veya "rejected" olmalı' }),
});
export type DecideParticipationDto = z.infer<typeof decideParticipationSchema>;

export const submitRatingSchema = z.object({
  score: z.number().int().min(1, 'Puan en az 1 olmalı').max(5, 'Puan en fazla 5 olmalı'),
});
export type SubmitRatingDto = z.infer<typeof submitRatingSchema>;
