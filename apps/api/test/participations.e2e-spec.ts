import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Client } from 'pg';
import { AppModule } from '../src/app.module.js';

const MODA = { lat: 40.9789, lng: 29.0369 };

function uniqueUser(label: string) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const phoneSuffix = suffix.replace(/\D/g, '').slice(-15);
  return {
    displayName: label,
    email: `${label.toLowerCase()}-${suffix}@example.com`,
    phone: `+90${phoneSuffix}`,
    password: 'Sifre1234',
  };
}

function futureIso(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

async function registerVerifiedUser(app: INestApplication<App>, label: string, age = 25): Promise<string> {
  const candidate = uniqueUser(label);
  await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);
  const { body: otp } = await request(app.getHttpServer())
    .get('/auth/otp/debug')
    .query({ channel: 'email', target: candidate.email })
    .expect(200);
  const { body } = await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ channel: 'email', target: candidate.email, code: otp.code })
    .expect(201);
  const token = body.accessToken as string;

  // assertMeetsRestrictions requires a non-null age — a freshly registered user has none.
  await request(app.getHttpServer())
    .patch('/users/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ age })
    .expect(200);

  return token;
}

async function createEvent(
  app: INestApplication<App>,
  organizerToken: string,
  overrides: { title?: string; capacity?: number; joinType?: 'instant' | 'approval' } = {},
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/events')
    .set('Authorization', `Bearer ${organizerToken}`)
    .send({
      title: overrides.title ?? 'Katılım Testi Etkinliği',
      category: 'Koşu',
      locationLat: MODA.lat,
      locationLng: MODA.lng,
      locationLabel: 'Moda Sahili',
      startsAt: futureIso(24),
      capacity: overrides.capacity ?? 10,
      joinType: overrides.joinType ?? 'instant',
    })
    .expect(201);
  return res.body.id as string;
}

async function updateEventForTest(eventId: string, values: { startsAt?: Date; premiumOnlyMatching?: boolean }) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    if (values.startsAt) {
      const result = await client.query<{ startsAt: Date }>(
        'UPDATE "Event" SET "startsAt" = $1 WHERE id = $2 RETURNING "startsAt"',
        [values.startsAt, eventId],
      );
      expect(result.rowCount).toBe(1);
      expect(new Date(result.rows[0].startsAt).getTime()).toBe(values.startsAt.getTime());
    }
    if (values.premiumOnlyMatching !== undefined) {
      await client.query('UPDATE "Event" SET "premiumOnlyMatching" = $1 WHERE id = $2', [
        values.premiumOnlyMatching,
        eventId,
      ]);
    }
  } finally {
    await client.end();
  }
}

describe('Participations (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('joins an instant event immediately with status "joined"', async () => {
    const organizerToken = await registerVerifiedUser(app, 'Organizer');
    const participantToken = await registerVerifiedUser(app, 'Participant');
    const eventId = await createEvent(app, organizerToken, { joinType: 'instant' });

    const res = await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(201);

    expect(res.body.status).toBe('joined');
  });

  it('requests an approval event as pending, then the organizer approves it', async () => {
    const organizerToken = await registerVerifiedUser(app, 'Organizer');
    const participantToken = await registerVerifiedUser(app, 'Participant');
    const eventId = await createEvent(app, organizerToken, { joinType: 'approval' });

    const requestRes = await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(201);
    expect(requestRes.body.status).toBe('pending');

    const decideRes = await request(app.getHttpServer())
      .patch(`/participations/${requestRes.body.id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ status: 'approved' })
      .expect(200);
    expect(decideRes.body.status).toBe('approved');
  });

  it("rejects a duplicate request while a prior request is still pending", async () => {
    const organizerToken = await registerVerifiedUser(app, 'Organizer');
    const participantToken = await registerVerifiedUser(app, 'Participant');
    const eventId = await createEvent(app, organizerToken, { joinType: 'approval' });

    await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(409);
  });

  // Regression guard: request() used to have no check at all here, so an organizer
  // could create a pending Participation on their own event and later approve it
  // via decide() — decide() only verified "is the decider the organizer", never
  // "is the decided-upon participant someone other than the organizer".
  it('blocks an organizer from requesting to join their own event', async () => {
    const organizerToken = await registerVerifiedUser(app, 'Organizer');
    const eventId = await createEvent(app, organizerToken, { joinType: 'instant' });

    await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(403);
  });

  it('blocks participation after an event has started', async () => {
    const organizerToken = await registerVerifiedUser(app, 'Organizer');
    const participantToken = await registerVerifiedUser(app, 'Participant');
    const eventId = await createEvent(app, organizerToken);
    await updateEventForTest(eventId, { startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) });
    const eventResponse = await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(200);
    expect(new Date(eventResponse.body.startsAt).getTime()).toBeLessThan(Date.now());

    await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(409);
  });

  it('blocks free users from joining a premium-only event through the API', async () => {
    const organizerToken = await registerVerifiedUser(app, 'Organizer');
    const participantToken = await registerVerifiedUser(app, 'Participant');
    const eventId = await createEvent(app, organizerToken);
    await updateEventForTest(eventId, { premiumOnlyMatching: true });

    await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(403);
  });

  it('blocks ratings from pending participants', async () => {
    const organizerToken = await registerVerifiedUser(app, 'Organizer');
    const participantToken = await registerVerifiedUser(app, 'Participant');
    const eventId = await createEvent(app, organizerToken, { joinType: 'approval' });
    const participation = await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(201);
    await updateEventForTest(eventId, { startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) });

    await request(app.getHttpServer())
      .post(`/participations/${participation.body.id}/rating`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ score: 5 })
      .expect(403);
  });

  // Regression guard: the unique [eventId, userId] constraint used to permanently block
  // a rejected user from ever requesting the same event again (request() treated any
  // existing row, rejected or not, as "already requested"). The fix upserts a rejected
  // row back to pending/joined instead of always inserting.
  it('allows a previously rejected user to request the same event again', async () => {
    const organizerToken = await registerVerifiedUser(app, 'Organizer');
    const participantToken = await registerVerifiedUser(app, 'Participant');
    const eventId = await createEvent(app, organizerToken, { joinType: 'approval' });

    const firstRequest = await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/participations/${firstRequest.body.id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ status: 'rejected' })
      .expect(200);

    const secondRequest = await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(201);

    expect(secondRequest.body.id).toBe(firstRequest.body.id);
    expect(secondRequest.body.status).toBe('pending');
  });

  // Regression guard for the capacity race: assertCapacityAvailable used to run a plain
  // count() with no lock/transaction, so two concurrent approvals on a near-full event
  // could both read "capacity available" before either write landed. The fix wraps the
  // count + update in a transaction that first takes a `SELECT ... FOR UPDATE` lock on
  // the Event row.
  //
  // A naive "fire two decide() calls with Promise.all and assert one wins" test turned out
  // NOT to reliably reproduce the race on a fast local Postgres (verified manually: it
  // passed 5/5 times even with the lock temporarily removed from the source) — the two
  // requests just don't reliably interleave at the exact right instant. So instead this
  // test proves the lock deterministically: it opens a second, independent DB connection,
  // manually takes `FOR UPDATE` on the same Event row and holds it, then asserts that the
  // app's own decide()-approval call blocks until that external lock is released. Without
  // the fix, decide() takes no such lock and would resolve immediately regardless.
  it('blocks decide()-approval behind an externally held lock on the same event row', async () => {
    const organizerToken = await registerVerifiedUser(app, 'Organizer');
    const participantToken = await registerVerifiedUser(app, 'Participant');
    const eventId = await createEvent(app, organizerToken, { joinType: 'approval', capacity: 1 });

    const pendingRequest = await request(app.getHttpServer())
      .post(`/events/${eventId}/participations`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(201);

    const lockHolder = new Client({ connectionString: process.env.DATABASE_URL });
    await lockHolder.connect();
    await lockHolder.query('BEGIN');
    await lockHolder.query('SELECT id FROM "Event" WHERE id = $1 FOR UPDATE', [eventId]);

    try {
      let decided = false;
      const decidePromise = request(app.getHttpServer())
        .patch(`/participations/${pendingRequest.body.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'approved' })
        .then((res) => {
          decided = true;
          return res;
        });

      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(decided).toBe(false);

      await lockHolder.query('COMMIT');
      const res = await decidePromise;

      expect(decided).toBe(true);
      expect(res.status).toBe(200);
    } finally {
      await lockHolder.end();
    }
  });
});
