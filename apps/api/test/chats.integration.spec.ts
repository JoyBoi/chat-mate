/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestSetup, TestDataFactory } from './test-setup';
import { TestPrismaService } from './test-prisma.service';
import { ChatType } from '@prisma/client';

describe('Chats Integration Tests', () => {
  let app: INestApplication;
  let prisma: TestPrismaService;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    app = await TestSetup.setupTestApp();
    prisma = TestSetup.getPrisma();
  });

  beforeEach(async () => {
    await TestSetup.cleanupDatabase();

    // Create authenticated user for each test
    const guestData = {
      displayName: 'Chat Test User',
      deviceId: `chat-test-device-${Date.now()}-${Math.random()}`,
    };

    const response = await request(app.getHttpServer())
      .post('/auth/guest/register')
      .send(guestData)
      .expect(201);

    authToken = response.body.data.token;
    testUser = response.body.data.user;
  });

  afterAll(async () => {
    await TestSetup.teardownTestApp();
  });

  describe('POST /chats', () => {
    it('should create a new chat successfully', async () => {
      const chatData = {
        name: 'Test Chat Room',
        type: 'group',
      };

      const response = await request(app.getHttpServer())
        .post('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chatData)
        .expect(201);

      expect(response.body).toMatchObject({
        data: expect.objectContaining({
          id: expect.any(String),
          name: chatData.name,
          type: 'GROUP',
          participants: expect.arrayContaining([
            expect.objectContaining({
              userId: testUser.id,
            }),
          ]),
        }),
      });

      // Verify chat was created in database
      const chat = await prisma.chat.findUnique({
        where: { id: response.body.data.id },
        include: { participants: true },
      });

      expect(chat).toBeTruthy();
      expect(chat?.name).toBe(chatData.name);
      expect(chat?.participants).toHaveLength(1);
    });

    it('should create a direct chat without name', async () => {
      const chatData = {
        type: 'direct' as const,
      };

      const response = await request(app.getHttpServer())
        .post('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chatData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          name: null,
          type: 'DIRECT' as const,
        }),
      });
    });

    it('should require authentication', async () => {
      const chatData = {
        name: 'Unauthorized Chat',
        type: 'group',
      };

      const response = await request(app.getHttpServer())
        .post('/chats')
        .send(chatData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        statusCode: 401,
      });
    });
  });

  describe('GET /chats', () => {
    beforeEach(async () => {
      // Create some test chats
      const chat1 = TestDataFactory.createChat({
        name: 'Chat 1',
        type: ChatType.GROUP,
      });
      const chat2 = TestDataFactory.createChat({
        id: 'chat-2-id',
        name: 'Chat 2',
        type: ChatType.DIRECT,
      });

      await prisma.chat.createMany({
        data: [chat1, chat2],
      });

      // Add user as participant to both chats
      await prisma.chatParticipant.createMany({
        data: [
          {
            id: 'participant-1',
            chatId: chat1.id,
            userId: testUser.id,
            joinedAt: new Date(),
          },
          {
            id: 'participant-2',
            chatId: chat2.id,
            userId: testUser.id,
            joinedAt: new Date(),
          },
        ],
      });
    });

    it('should return user chats', async () => {
      const response = await request(app.getHttpServer())
        .get('/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'Chat 1',
            type: 'GROUP',
          }),
          expect.objectContaining({
            name: 'Chat 2',
            type: 'DIRECT',
          }),
        ]),
      });

      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array for user with no chats', async () => {
      // Create a new user with no chats
      const guestData = {
        displayName: 'No Chats User',
        deviceId: `no-chats-device-${Date.now()}-${Math.random()}`,
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/guest/register')
        .send(guestData);

      console.log('Register response status:', registerResponse.status);
      console.log(
        'Register response body:',
        JSON.stringify(registerResponse.body, null, 2)
      );

      if (registerResponse.status !== 201 || !registerResponse.body.success) {
        throw new Error(
          `Guest registration failed: ${JSON.stringify(registerResponse.body.error) || 'Unknown error'}`
        );
      }

      const noChatsToken = registerResponse.body.data.token;

      const response = await request(app.getHttpServer())
        .get('/chats')
        .set('Authorization', `Bearer ${noChatsToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: [],
      });
    });
  });

  describe('GET /chats/:id', () => {
    let testChat: any;

    beforeEach(async () => {
      // Create a test chat
      testChat = TestDataFactory.createChat({
        name: 'Detailed Chat',
        type: ChatType.GROUP,
      });

      await prisma.chat.create({
        data: testChat,
      });

      // Add user as participant
      await prisma.chatParticipant.create({
        data: {
          id: 'detail-participant',
          chatId: testChat.id,
          userId: testUser.id,
          joinedAt: new Date(),
        },
      });
    });

    it('should return chat details for participant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chats/${testChat.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.objectContaining({
          id: testChat.id,
          name: testChat.name,
          type: testChat.type,
          participants: expect.arrayContaining([
            expect.objectContaining({
              userId: testUser.id,
            }),
          ]),
        }),
      });
    });

    it('should return 404 for non-existent chat', async () => {
      const response = await request(app.getHttpServer())
        .get('/chats/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        statusCode: 404,
      });
    });

    it('should return 403 for non-participant user', async () => {
      // Create another user
      const otherGuestData = {
        displayName: 'Other User',
        deviceId: `other-user-device-${Date.now()}-${Math.random()}`,
      };

      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/guest/register')
        .send(otherGuestData);

      if (otherUserResponse.status !== 201 || !otherUserResponse.body.success) {
        throw new Error(
          `Other user registration failed: ${JSON.stringify(otherUserResponse.body.error) || 'Unknown error'}`
        );
      }

      const otherUserToken = otherUserResponse.body.data.token;

      const response = await request(app.getHttpServer())
        .get(`/chats/${testChat.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        error: 'Forbidden',
        statusCode: 403,
      });
    });
  });

  describe('DELETE /chats/:id', () => {
    let testChat: any;

    beforeEach(async () => {
      // Create a test chat
      testChat = TestDataFactory.createChat({
        name: 'Chat to Delete',
        type: ChatType.GROUP,
      });

      await prisma.chat.create({
        data: testChat,
      });

      // Add user as participant
      await prisma.chatParticipant.create({
        data: {
          id: 'delete-participant',
          chatId: testChat.id,
          userId: testUser.id,
          joinedAt: new Date(),
        },
      });
    });

    it('should delete chat successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/chats/${testChat.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.objectContaining({
          message: expect.stringContaining('deleted'),
        }),
      });

      // Verify chat was deleted from database
      const deletedChat = await prisma.chat.findUnique({
        where: { id: testChat.id },
      });

      expect(deletedChat).toBeNull();
    });

    it('should return 404 for non-existent chat', async () => {
      const response = await request(app.getHttpServer())
        .delete('/chats/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        statusCode: 404,
      });
    });
  });
});
