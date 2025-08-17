import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './generated/client';

@Injectable()
export class TestPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          url: 'file:./test/test.db',
        },
      },
    });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    // Clean all tables in reverse order to handle foreign key constraints
    await this.message.deleteMany();
    await this.chatParticipant.deleteMany();
    await this.chat.deleteMany();
    await this.userProfile.deleteMany();
    await this.user.deleteMany();
  }
}
