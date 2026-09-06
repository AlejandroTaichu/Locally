import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

async function main() {
  const [weeklyEvents, recentParticipations, totalUsers, trialUsers] = await Promise.all([
    prisma.event.findMany({
      where: { startsAt: { gte: weekAgo, lte: now } },
      select: {
        id: true,
        capacity: true,
        participations: {
          where: { status: { in: ['joined', 'approved'] } },
          select: { id: true },
        },
      },
    }),
    prisma.participation.findMany({
      where: {
        status: { in: ['joined', 'approved'] },
        event: { startsAt: { gte: monthAgo, lte: now } },
      },
      select: { userId: true },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { premiumTrialEndsAt: { not: null } } }),
  ]);

  const eventsWithCapacity = weeklyEvents.filter((event) => event.capacity !== null);
  const filledEvents = eventsWithCapacity.filter((event) => event.participations.length >= event.capacity!);
  const participationCounts = new Map<string, number>();
  for (const participation of recentParticipations) {
    participationCounts.set(participation.userId, (participationCounts.get(participation.userId) ?? 0) + 1);
  }
  const participatingUsers = participationCounts.size;
  const returningUsers = [...participationCounts.values()].filter((count) => count >= 2).length;

  console.log(
    JSON.stringify(
      {
        generatedAt: now.toISOString(),
        windows: { weekly: { from: weekAgo.toISOString(), to: now.toISOString() }, monthlyFrom: monthAgo.toISOString() },
        weeklyActiveEvents: weeklyEvents.length,
        eventFillRate: eventsWithCapacity.length === 0 ? null : filledEvents.length / eventsWithCapacity.length,
        returningParticipantRate: participatingUsers === 0 ? null : returningUsers / participatingUsers,
        premiumTrialInterestRate: totalUsers === 0 ? null : trialUsers / totalUsers,
        counts: { filledEvents: filledEvents.length, eventsWithCapacity: eventsWithCapacity.length, returningUsers, participatingUsers, trialUsers, totalUsers },
        unavailable: ['organicReferralRate'],
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
