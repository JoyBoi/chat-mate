/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSetup } from './test-setup';
import { TestPrismaService } from './test-prisma.service';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let prisma: TestPrismaService;

  beforeAll(async () => {
    app = await TestSetup.setupTestApp();
    prisma = TestSetup.getPrisma();
  });

  beforeEach(async () => {
    await TestSetup.cleanupDatabase();
  });

  afterAll(async () => {
    await TestSetup.teardownTestApp();
  });

  describe('Guest Auth', () => {
    describe('POST /auth/guest/register', () => {
      it('should create a guest user successfully', async () => {
        const guestData = {
          displayName: 'Guest User',
          deviceId: `test-device-${Date.now()}-${Math.random()}`,
        };

        const response = await request(app.getHttpServer())
          .post('/auth/guest/register')
          .send(guestData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: expect.objectContaining({
              id: expect.any(String),
              displayName: 'Guest User',
              type: 'guest',
            }),
            profile: expect.objectContaining({
              displayName: guestData.displayName,
            }),
            token: expect.any(String),
          },
        });

        // Verify user was created in database
        const user = await prisma.user.findUnique({
          where: { id: response.body.data.user.id },
          include: { profile: true },
        });

        expect(user).toBeTruthy();
        expect(user?.profile?.displayName).toBe(guestData.displayName);
      });

      it('should return 400 for invalid guest data', async () => {
        const invalidData = {
          displayName: '', // Empty display name
          deviceId: '',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/guest/register')
          .send(invalidData)
          .expect(400);

        console.log('=== RESPONSE BODY DEBUG ===');
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(response.body, null, 2));
        console.log('Headers:', response.headers);
        console.log('=== END DEBUG ===');
        expect(response.body).toMatchObject({
          error: expect.any(String),
          statusCode: 400,
        });
      });

      it('should handle duplicate device IDs gracefully', async () => {
        const deviceId = `duplicate-device-${Date.now()}-${Math.random()}`;
        const guestData = {
          displayName: 'Guest User 1',
          deviceId,
        };

        // Create first guest user
        await request(app.getHttpServer())
          .post('/auth/guest/register')
          .send(guestData)
          .expect(201);

        // Try to create another with same device ID
        const duplicateData = {
          displayName: 'Guest User 2',
          deviceId,
        };

        const response = await request(app.getHttpServer())
          .post('/auth/guest/register')
          .send(duplicateData)
          .expect(409);

        expect(response.body).toMatchObject({
          error: expect.stringContaining('already exists'),
          statusCode: 409,
        });
      });
    });

    describe('POST /auth/guest/login', () => {
      it('should login existing guest user', async () => {
        // First create a guest user
        const deviceId = `existing-device-${Date.now()}-${Math.random()}`;
        const guestData = {
          displayName: 'Existing Guest',
          deviceId,
        };

        const registerResponse = await request(app.getHttpServer())
          .post('/auth/guest/register')
          .send(guestData)
          .expect(201);

        const userId = registerResponse.body.data.user.id;

        // Now login with the same device ID
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/guest/login')
          .send({ deviceId: guestData.deviceId })
          .expect(200);

        expect(loginResponse.body).toMatchObject({
          success: true,
          data: {
            user: expect.objectContaining({
              id: userId,
            }),
            token: expect.any(String),
          },
        });
      });

      it('should return 404 for non-existent device ID', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/guest/login')
          .send({
            deviceId: `non-existent-device-${Date.now()}-${Math.random()}`,
          })
          .expect(404);

        expect(response.body).toMatchObject({
          error: expect.stringContaining('not found'),
          statusCode: 404,
        });
      });
    });
  });

  describe('JWT Authentication', () => {
    let authToken: string;
    let testUser: any;

    beforeEach(async () => {
      // Create a test user and get auth token
      const guestData = {
        displayName: 'Test Auth User',
        deviceId: `auth-test-device-${Date.now()}-${Math.random()}`,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/guest/register')
        .send(guestData)
        .expect(201);

      authToken = response.body.data.token;
      testUser = response.body.data.user;
    });

    it('should access protected routes with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: testUser.id,
        }),
      });
    });

    it('should reject requests without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        statusCode: 401,
      });
    });
  });
});
