import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { TestPrismaService } from './test-prisma.service';
import { ChatType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

export class TestSetup {
  private static app: INestApplication;
  private static prisma: TestPrismaService;
  private static moduleRef: TestingModule;

  static async setupTestApp(): Promise<INestApplication> {
    if (this.app) {
      return this.app;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useClass(TestPrismaService)
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string): string | number | undefined => {
          const config: Record<string, string | number> = {
            DATABASE_URL: 'file:./test/test.db',
            DIRECT_URL: 'file:./test/test.db',
            SUPABASE_URL: 'https://test.supabase.co',
            SUPABASE_ANON_KEY: 'test-anon-key',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
            JWT_SECRET: 'test-jwt-secret',
            JWT_EXPIRES_IN: '1h',
            PORT: 3002,
            NODE_ENV: 'test',
            VALKEY_HOST: 'localhost',
            VALKEY_PORT: 6380, // Different port for test
            VALKEY_PASSWORD: '',
            VALKEY_DB: 1, // Different DB for test
          };
          return config[key];
        },
      })
      .compile();

    this.moduleRef = moduleFixture;
    this.app = moduleFixture.createNestApplication();
    this.prisma = this.app.get<TestPrismaService>(PrismaService);

    await this.app.init();
    return this.app;
  }

  static async cleanupDatabase(): Promise<void> {
    if (!this.prisma) {
      return;
    }

    // Clean up in reverse order of dependencies
    await this.prisma.message.deleteMany();
    await this.prisma.chatParticipant.deleteMany();
    await this.prisma.chat.deleteMany();
    await this.prisma.userProfile.deleteMany();
    await this.prisma.user.deleteMany();
    // await this.prisma.bot.deleteMany(); // Uncomment when bot model exists

    // Clear guest sessions if app is available
    if (this.app) {
      try {
        const guestAuthService: unknown = this.app.get('GuestAuthService', {
          strict: false,
        });
        if (
          guestAuthService &&
          typeof guestAuthService === 'object' &&
          'clearAllSessions' in guestAuthService &&
          typeof (guestAuthService as { clearAllSessions: unknown })
            .clearAllSessions === 'function'
        ) {
          (
            guestAuthService as { clearAllSessions: () => void }
          ).clearAllSessions();
        }
      } catch {
        // GuestAuthService might not be available in test context
        // This is expected when AuthModule is conditionally excluded
      }
    }
  }

  static async teardownTestApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
    if (this.moduleRef) {
      await this.moduleRef.close();
    }
  }

  static getApp(): INestApplication {
    return this.app;
  }

  static getPrisma(): TestPrismaService {
    return this.prisma;
  }
}

// Test data factories
export const TestDataFactory = {
  createUser: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createUserProfile: (
    userId: string,
    overrides: Partial<Record<string, unknown>> = {}
  ) => ({
    id: 'test-profile-id',
    userId,
    displayName: 'Test User',
    avatar: null,
    bio: 'Test bio',
    preferences: {} as Record<string, unknown>,
    ...overrides,
  }),

  createChat: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'test-chat-id',
    name: 'Test Chat',
    type: ChatType.DIRECT,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createMessage: (
    chatId: string,
    senderId: string,
    overrides: Partial<Record<string, unknown>> = {}
  ) => ({
    id: 'test-message-id',
    chatId,
    senderId,
    content: 'Test message content',
    type: 'TEXT',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  createBot: (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'test-bot-id',
    name: 'Test Bot',
    description: 'A test bot',
    personality: 'friendly',
    avatar: null,
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};
