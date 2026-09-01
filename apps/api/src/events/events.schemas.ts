import { z } from 'zod';

export const joinTypeSchema = z.enum(['instant', 'approval'], { message: 'Geçersiz katılım tipi' });

export const createEventSchema = z.object({
  title: z.string().trim().min(3, 'Başlık en az 3 karakter olmalı').max(120, 'Başlık çok uzun'),
  category: z.string().trim().min(2, 'Kategori en az 2 karakter olmalı').max(40, 'Kategori çok uzun'),
  locationLat: z.number().min(-90).max(90, 'Geçersiz konum'),
  locationLng: z.number().min(-180).max(180, 'Geçersiz konum'),
  locationLabel: z.string().trim().min(2, 'Konum açıklaması en az 2 karakter olmalı').max(120, 'Konum açıklaması çok uzun'),
  startsAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), 'Başlangıç zamanı gelecekte olmalı'),
  capacity: z.number().int().positive().max(500, 'Kontenjan en fazla 500 olabilir').optional(),
  joinType: joinTypeSchema,
  premiumOnlyMatching: z.boolean().optional().default(false),
});
export type CreateEventDto = z.infer<typeof createEventSchema>;

export const listEventsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(200, 'Yarıçap en fazla 200 km olabilir').optional(),
});
export type ListEventsQueryDto = z.infer<typeof listEventsQuerySchema>;
