import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BotsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllBots() {
    const bots = await this.prisma.botPersonality.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        avatar: true,
        category: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: bots,
    };
  }

  async getActiveBots() {
    const bots = await this.prisma.botPersonality.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        avatar: true,
        category: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      data: bots,
    };
  }
}
