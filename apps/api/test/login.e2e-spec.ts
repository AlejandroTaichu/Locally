import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

function uniqueUser() {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const phoneSuffix = suffix.replace(/\D/g, '').slice(-15);
  return {
    displayName: 'Login Test User',
    email: `login-${suffix}@example.com`,
    phone: `+90${phoneSuffix}`,
    password: 'Sifre1234',
  };
}

async function readOtpCode(app: INestApplication<App>, target: string) {
  const response = await request(app.getHttpServer())
    .get('/auth/otp/debug')
    .query({ channel: 'email', target })
    .expect(200);
  return response.body.code as string;
}

async function registerAndVerify(app: INestApplication<App>) {
  const candidate = uniqueUser();
  await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);
  const code = await readOtpCode(app, candidate.email);
  await request(app.getHttpServer())
    .post('/auth/otp/verify')
    .send({ channel: 'email', target: candidate.email, code })
    .expect(201);
  return candidate;
}

describe('Login & password reset (e2e)', () => {
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

  it('logs in with email + password once the account is verified', async () => {
    const candidate = await registerAndVerify(app);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidate.email, password: candidate.password })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(candidate.email);
  });

  it('rejects login before the account is verified', async () => {
    const candidate = uniqueUser();
    await request(app.getHttpServer()).post('/auth/register').send(candidate).expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidate.email, password: candidate.password })
      .expect(401);
  });

  it('rejects login with the wrong password', async () => {
    const candidate = await registerAndVerify(app);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidate.email, password: 'wrong-password' })
      .expect(401);
  });

  it('rejects login for an email that does not exist', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'no-such-user@example.com', password: 'Sifre1234' })
      .expect(401);
  });

  it('resets the password via emailed OTP and logs in with the new one', async () => {
    const candidate = await registerAndVerify(app);

    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ channel: 'email', target: candidate.email })
      .expect(201);
    const resetCode = await readOtpCode(app, candidate.email);

    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ email: candidate.email, code: resetCode, newPassword: 'YeniSifre1234' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidate.email, password: candidate.password })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidate.email, password: 'YeniSifre1234' })
      .expect(201);
  });

  it('invalidates tokens issued before a password reset', async () => {
    const candidate = await registerAndVerify(app);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: candidate.email, password: candidate.password })
      .expect(201);
    const oldToken = loginRes.body.accessToken as string;

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${oldToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ channel: 'email', target: candidate.email })
      .expect(201);
    const resetCode = await readOtpCode(app, candidate.email);
    const resetRes = await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ email: candidate.email, code: resetCode, newPassword: 'YeniSifre1234' })
      .expect(201);
    const newToken = resetRes.body.accessToken as string;

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${oldToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200);
  });
});
