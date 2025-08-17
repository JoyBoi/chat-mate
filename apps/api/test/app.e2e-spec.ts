/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSetup } from './test-setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await TestSetup.setupTestApp();
  });

  afterEach(async () => {
    await TestSetup.cleanupDatabase();
  });

  afterAll(async () => {
    await TestSetup.teardownTestApp();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
