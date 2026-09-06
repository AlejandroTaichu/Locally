import { z } from 'zod';

export const joinTypeSchema = z.enum(['instant', 'approval'], { message: 'Geçersiz katılım tipi' });

// Mobile'daki apps/mobile/src/constants/eventCategories.ts (EVENT_CATEGORIES) ile birebir
// aynı tutulmalı — repoda paylaşılan bir paket yok (pnpm-workspace.yaml sadece apps/*),
// bu yüzden joinType gibi burada da literal olarak duplike ediliyor. Bkz. Katıl-Vault ADR 0014.
export const eventCategorySchema = z.enum([
  'Koşu',
  'Bisiklet',
  'Basketbol',
  'Halısaha',
  'Yüzme',
  'Tenis',
  'Yoga',
  'Doğa Yürüyüşü',
  'Kano/Kürek',
  'Tırmanış',
  'Dans',
  'Dil Pratiği',
  'Kitap Kulübü',
  'Satranç/Masa Oyunları',
  'Meditasyon',
  'Fotoğrafçılık',
  'Müzik',
  'El Sanatları',
  'Yemek/Mutfak',
  'Kahve/Sohbet Buluşması',
  'Girişimcilik/Networking',
  'Gönüllülük',
], { message: 'Geçersiz kategori' });

export const genderRestrictionSchema = z.enum(['male', 'female', 'all'], { message: 'Geçersiz cinsiyet kısıtı' });

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3, 'Başlık en az 3 karakter olmalı').max(120, 'Başlık çok uzun'),
    description: z.string().trim().max(1000, 'Açıklama çok uzun').optional(),
    category: eventCategorySchema,
    locationLat: z.number().min(-90).max(90, 'Geçersiz konum'),
    locationLng: z.number().min(-180).max(180, 'Geçersiz konum'),
    locationLabel: z.string().trim().min(2, 'Konum açıklaması en az 2 karakter olmalı').max(120, 'Konum açıklaması çok uzun'),
    startsAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), 'Başlangıç zamanı gelecekte olmalı'),
    capacity: z.number().int().positive().max(50, 'Kontenjan en fazla 50 olabilir'),
    joinType: joinTypeSchema,
    premiumOnlyMatching: z.boolean().optional().default(false),
    genderRestriction: genderRestrictionSchema.optional().default('all'),
    minAge: z.number().int().min(13, 'Yaş en az 13 olmalı').max(99, 'Geçersiz yaş').optional().default(13),
    maxAge: z.number().int().min(13, 'Yaş en az 13 olmalı').max(99, 'Geçersiz yaş').optional().default(99),
  })
  .refine((data) => data.minAge <= data.maxAge, {
    message: 'Min yaş, max yaştan büyük olamaz',
    path: ['minAge'],
  });
export type CreateEventDto = z.infer<typeof createEventSchema>;

export const listEventsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(200, 'Yarıçap en fazla 200 km olabilir').optional(),
});
export type ListEventsQueryDto = z.infer<typeof listEventsQuerySchema>;
