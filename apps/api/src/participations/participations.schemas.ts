import { z } from 'zod';

export const decideParticipationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});
export type DecideParticipationDto = z.infer<typeof decideParticipationSchema>;
