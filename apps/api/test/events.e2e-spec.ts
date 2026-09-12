import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

const MODA = { lat: 40.9789, lng: 29.0369 };
const ANKARA = { lat: 39.9208, lng: 32.8541 };

function uniqueUser() {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const phoneSuffix = suffix.replace(/\D/g, '').slice(-15);
  return {
    displayName: 'Event Organizer',
    email: `organizer-${suffix}@example.com`,
    phone: `+90${phoneSuffix}`,
    password: 'Sifre1234',
  };
}

async function registerAndGetToken(app: INestApplication<App>) {
  const candidate = uniqueUser();
  await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);
  const { body: otp } = await request(app.getHttpServer())
    .get('/auth/otp/debug')
    .query({ channel: 'email', target: candidate.email })
    .expect(200);
  const { body } = await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ channel: 'email', target: candidate.email, code: otp.code })
    .expect(201);
  return body.accessToken as string;
}

function futureIso(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

describe('Events (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    token = await registerAndGetToken(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates an event and returns it with the organizer attached', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '2ye2 Basketbol',
        category: 'Basketbol',
        locationLat: MODA.lat,
        locationLng: MODA.lng,
        locationLabel: 'Moda Sahili',
        startsAt: futureIso(24),
        capacity: 4,
        joinType: 'instant',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.organizer.id).toBeDefined();
  });

  it('rejects events with a startsAt in the past', async () => {
    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Past Event',
        category: 'Koşu',
        locationLat: MODA.lat,
        locationLng: MODA.lng,
        locationLabel: 'Moda',
        startsAt: '2020-01-01T00:00:00.000Z',
        joinType: 'instant',
      })
      .expect(400);
  });

  it('rejects unauthenticated event creation', async () => {
    await request(app.getHttpServer())
      .post('/events')
      .send({
        title: 'No Auth',
        category: 'Koşu',
        locationLat: MODA.lat,
        locationLng: MODA.lng,
        locationLabel: 'Moda',
        startsAt: futureIso(24),
        joinType: 'instant',
      })
      .expect(401);
  });

  it('filters the list by radius around a given point', async () => {
    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Moda Kosu',
        category: 'Koşu',
        locationLat: MODA.lat,
        locationLng: MODA.lng,
        locationLabel: 'Moda Sahili',
        startsAt: futureIso(24),
        capacity: 10,
        joinType: 'instant',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Ankara Kosu',
        category: 'Koşu',
        locationLat: ANKARA.lat,
        locationLng: ANKARA.lng,
        locationLabel: 'Kizilay',
        startsAt: futureIso(24),
        capacity: 10,
        joinType: 'instant',
      })
      .expect(201);

    const nearbyRes = await request(app.getHttpServer())
      .get('/events')
      .query({ lat: MODA.lat, lng: MODA.lng, radiusKm: 15 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const titles = nearbyRes.body.map((event: { title: string }) => event.title);
    expect(titles).toContain('Moda Kosu');
    expect(titles).not.toContain('Ankara Kosu');
  });

  it('fetches a single event by id', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Detail Test',
        category: 'Koşu',
        locationLat: MODA.lat,
        locationLng: MODA.lng,
        locationLabel: 'Moda',
        startsAt: futureIso(24),
        capacity: 10,
        joinType: 'approval',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/events/${createRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.title).toBe('Detail Test');
      });
  });
});
