// Founder-run seed script: creates a starter organizer and a handful of
// Kadıköy/Bostancı events, per Büyüme-Stratejisi's "haftada 3-5 event" plan.
// Run with: pnpm --filter api run seed
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const FOUNDER = {
  displayName: 'Katıl Kurucu',
  email: 'kurucu@katil.app',
  phone: '+905550000000',
};

interface SeedEvent {
  title: string;
  category: string;
  locationLat: number;
  locationLng: number;
  locationLabel: string;
  daysFromNow: number;
  hour: number;
  capacity?: number;
  joinType: 'instant' | 'approval';
}

const SEED_EVENTS: SeedEvent[] = [
  {
    title: 'Cumartesi Sabahı Basketbolu',
    category: 'Basketbol',
    locationLat: 40.9789,
    locationLng: 29.0369,
    locationLabel: 'Moda Sahili Basketbol Sahası',
    daysFromNow: 2,
    hour: 10,
    capacity: 8,
    joinType: 'instant',
  },
  {
    title: 'Bostancı Sahil Koşusu',
    category: 'Koşu',
    locationLat: 40.9614,
    locationLng: 29.0928,
    locationLabel: 'Bostancı Sahil Yolu',
    daysFromNow: 1,
    hour: 7,
    joinType: 'instant',
  },
  {
    title: 'Perşembe Akşamı Halısaha',
    category: 'Halısaha',
    locationLat: 40.9756,
    locationLng: 29.0553,
    locationLabel: 'Kadıköy Halısaha Tesisi',
    daysFromNow: 4,
    hour: 20,
    capacity: 10,
    joinType: 'approval',
  },
  {
    title: 'Moda Kültür Merkezi Masa Oyunları Gecesi',
    category: 'Masa Oyunu',
    locationLat: 40.9838,
    locationLng: 29.0297,
    locationLabel: 'Moda Kültür Merkezi',
    daysFromNow: 3,
    hour: 19,
    capacity: 12,
    joinType: 'approval',
  },
  {
    title: 'Bostancı Bisiklet Turu',
    category: 'Bisiklet',
    locationLat: 40.9601,
    locationLng: 29.094,
    locationLabel: 'Bostancı - Maltepe Sahil Yolu',
    daysFromNow: 5,
    hour: 9,
    joinType: 'instant',
  },
];

async function main() {
  const founder = await prisma.user.upsert({
    where: { email: FOUNDER.email },
    update: {},
    create: { ...FOUNDER, isPremium: true, emailVerifiedAt: new Date(), phoneVerifiedAt: new Date() },
  });
  console.log(`Kurucu kullanıcı: ${founder.displayName} (${founder.id})`);

  let created = 0;
  for (const seedEvent of SEED_EVENTS) {
    const existing = await prisma.event.findFirst({
      where: { organizerId: founder.id, title: seedEvent.title },
    });
    if (existing) {
      console.log(`  = ${seedEvent.title} (zaten var, atlandı)`);
      continue;
    }

    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + seedEvent.daysFromNow);
    startsAt.setHours(seedEvent.hour, 0, 0, 0);

    const event = await prisma.event.create({
      data: {
        organizerId: founder.id,
        title: seedEvent.title,
        category: seedEvent.category,
        locationLat: seedEvent.locationLat,
        locationLng: seedEvent.locationLng,
        locationLabel: seedEvent.locationLabel,
        startsAt,
        capacity: seedEvent.capacity,
        joinType: seedEvent.joinType,
      },
    });
    console.log(`  + ${event.title} — ${startsAt.toLocaleString('tr-TR')}`);
    created += 1;
  }

  console.log(`\n${created} yeni etkinlik oluşturuldu (${SEED_EVENTS.length - created} zaten mevcuttu).`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
