import { z } from 'zod';

export const decideParticipationSchema = z.object({
  status: z.enum(['approved', 'rejected'], { message: 'Durum "approved" veya "rejected" olmalı' }),
});
export type DecideParticipationDto = z.infer<typeof decideParticipationSchema>;
