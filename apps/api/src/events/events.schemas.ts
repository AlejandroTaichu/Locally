import { z } from 'zod';

export const joinTypeSchema = z.enum(['instant', 'approval']);

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category: z.string().trim().min(2).max(40),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  locationLabel: z.string().trim().min(2).max(120),
  startsAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), 'startsAt must be in the future'),
  capacity: z.number().int().positive().max(500).optional(),
  joinType: joinTypeSchema,
});
export type CreateEventDto = z.infer<typeof createEventSchema>;

export const listEventsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(200).optional(),
});
export type ListEventsQueryDto = z.infer<typeof listEventsQuerySchema>;
