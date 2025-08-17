import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createSuccessResponse } from '@chat-mate/utils';

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);

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

    return createSuccessResponse(bots);
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
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    });

    return createSuccessResponse(bots);
  }

  async getFeaturedBots() {
    const bots = await this.prisma.botPersonality.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        avatar: true,
        category: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return createSuccessResponse(bots);
  }

  async getNonFeaturedBots() {
    const bots = await this.prisma.botPersonality.findMany({
      where: {
        isActive: true,
        isFeatured: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        avatar: true,
        category: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return createSuccessResponse(bots);
  }

  @Cron(CronExpression.EVERY_WEEK)
  async rotateFeaturedBots() {
    this.logger.log('Starting weekly bot rotation...');

    try {
      const weekStart = this.getWeekStart(new Date());

      // Check if rotation already exists for this week
      const existingRotation = await this.prisma.featuredBotRotation.findUnique(
        {
          where: { weekStart },
        }
      );

      if (existingRotation) {
        this.logger.log('Rotation already exists for this week');
        return;
      }

      // Get all active bots
      const allBots = await this.prisma.botPersonality.findMany({
        where: { isActive: true },
        select: { id: true, name: true, category: true },
      });

      if (allBots.length === 0) {
        this.logger.warn('No active bots found for rotation');
        return;
      }

      // Select 7-9 bots ensuring category diversity
      const selectedBots = this.selectDiverseBots(allBots, 8);
      const selectedBotIds = selectedBots.map(bot => bot.id);

      // Update featured status
      await this.prisma.$transaction([
        // Reset all bots to non-featured
        this.prisma.botPersonality.updateMany({
          data: { isFeatured: false },
        }),
        // Set selected bots as featured
        this.prisma.botPersonality.updateMany({
          where: { id: { in: selectedBotIds } },
          data: { isFeatured: true },
        }),
        // Record the rotation
        this.prisma.featuredBotRotation.create({
          data: {
            weekStart,
            botIds: selectedBotIds,
          },
        }),
      ]);

      this.logger.log(
        `Featured bots rotated: ${selectedBots.map(b => b.name).join(', ')}`
      );
    } catch (error) {
      this.logger.error('Failed to rotate featured bots:', error);
    }
  }

  async manualRotateFeaturedBots() {
    this.logger.log('Manual bot rotation triggered...');
    await this.rotateFeaturedBots();
  }

  private selectDiverseBots(
    bots: Array<{ id: string; name: string; category: string | null }>,
    count: number
  ) {
    // Group bots by category
    const categories = new Map<string, typeof bots>();

    bots.forEach(bot => {
      const category = bot.category || 'GENERAL';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(bot);
    });

    const selected: typeof bots = [];
    const categoryKeys = Array.from(categories.keys());

    // First pass: select one from each category
    categoryKeys.forEach(category => {
      const categoryBots = categories.get(category)!;
      const randomBot =
        categoryBots[Math.floor(Math.random() * categoryBots.length)];
      selected.push(randomBot);
    });

    // Second pass: fill remaining slots randomly
    const remaining = bots.filter(bot => !selected.some(s => s.id === bot.id));
    while (selected.length < count && remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      selected.push(remaining.splice(randomIndex, 1)[0]);
    }

    return selected.slice(0, count);
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }
}
