import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Throttling (e2e)', () => {
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

  it('throttles repeated requests to auth endpoints from the same client', async () => {
    for (let i = 0; i < 20; i += 1) {
      await request(app.getHttpServer())
        .post('/auth/otp/request')
        .send({ channel: 'email', target: `no-such-user-${i}@example.com` })
        .expect(404);
    }

    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ channel: 'email', target: 'no-such-user-21@example.com' })
      .expect(429);
  });
});
