import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

function uniqueUser() {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const phoneSuffix = suffix.replace(/\D/g, '').slice(-15);
  return {
    displayName: 'Test User',
    email: `test-${suffix}@example.com`,
    phone: `+90${phoneSuffix}`,
    password: 'Sifre1234',
  };
}

async function readOtpCode(app: INestApplication<App>, channel: 'email' | 'phone', target: string) {
  const response = await request(app.getHttpServer())
    .get('/auth/otp/debug')
    .query({ channel, target })
    .expect(200);
  return response.body.code as string;
}

describe('Auth (e2e)', () => {
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

  it('registers, verifies via OTP, and issues a usable token', async () => {
    const candidate = uniqueUser();

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);
    expect(registerRes.body.userId).toBeDefined();

    const code = await readOtpCode(app, 'email', candidate.email);

    const verifyRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ channel: 'email', target: candidate.email, code })
      .expect(201);

    expect(verifyRes.body.accessToken).toBeDefined();
    expect(verifyRes.body.user.email).toBe(candidate.email);
    expect(verifyRes.body.user.emailVerifiedAt).not.toBeNull();
    // Guards against a specific regression: verifyOtp() returns a hand-picked
    // Pick<User, ...> rather than the raw row, so newly added User fields must
    // be added there explicitly or they silently come back as undefined.
    expect(verifyRes.body.user).toHaveProperty('onboardingCompletedAt', null);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${verifyRes.body.accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(verifyRes.body.user.id);
      });
  });

  it('rejects duplicate registration with the same email/phone', async () => {
    const candidate = uniqueUser();
    await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);
    await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(409);
  });

  it('rejects verification with a wrong code', async () => {
    const candidate = uniqueUser();
    await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);

    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ channel: 'email', target: candidate.email, code: '000000' })
      .expect(400);
  });

  it('locks an OTP after five wrong verification attempts', async () => {
    const candidate = uniqueUser();
    await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);
    const correctCode = await readOtpCode(app, 'email', candidate.email);
    const wrongCode = correctCode === '000000' ? '111111' : '000000';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ channel: 'email', target: candidate.email, code: wrongCode })
        .expect(400);
    }

    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ channel: 'email', target: candidate.email, code: correctCode })
      .expect(400);
  });

  it('rate limits repeated OTP delivery requests for the same target', async () => {
    const candidate = uniqueUser();
    await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);

    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ channel: 'email', target: candidate.email })
      .expect(429);
  });

  it('rejects unauthenticated access to /users/me', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('supports login for an existing user via otp/request + otp/verify', async () => {
    const candidate = uniqueUser();
    await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);
    const firstCode = await readOtpCode(app, 'email', candidate.email);
    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ channel: 'email', target: candidate.email, code: firstCode })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ channel: 'email', target: candidate.email })
      .expect(201);
    const secondCode = await readOtpCode(app, 'email', candidate.email);

    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ channel: 'email', target: candidate.email, code: secondCode })
      .expect(201);
  });

  it('does not allow a user to grant premium access through profile updates', async () => {
    const candidate = uniqueUser();
    await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);
    const code = await readOtpCode(app, 'email', candidate.email);
    const verifyRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ channel: 'email', target: candidate.email, code })
      .expect(201);
    const token = verifyRes.body.accessToken as string;

    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ isPremium: true })
      .expect(200)
      .expect((res) => {
        expect(res.body.isPremium).toBe(false);
      });
  });

  it('deletes an account together with its organized events', async () => {
    const candidate = uniqueUser();
    await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);
    const code = await readOtpCode(app, 'email', candidate.email);
    const verifyRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ channel: 'email', target: candidate.email, code })
      .expect(201);
    const token = verifyRes.body.accessToken as string;

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Silinecek Etkinlik',
        category: 'Koşu',
        locationLat: 40.9789,
        locationLng: 29.0369,
        locationLabel: 'Moda',
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        capacity: 4,
        joinType: 'instant',
      })
      .expect(201);

    await request(app.getHttpServer()).delete('/users/me').set('Authorization', `Bearer ${token}`).expect(204);
    await request(app.getHttpServer()).get('/users/me').set('Authorization', `Bearer ${token}`).expect(404);
    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ channel: 'email', target: candidate.email })
      .expect(404);
  });
});
