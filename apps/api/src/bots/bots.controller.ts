import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BotsService } from './bots.service';

@ApiTags('bots')
@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bot personalities' })
  async getAllBots() {
    return await this.botsService.getAllBots();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active bot personalities' })
  async getActiveBots() {
    return await this.botsService.getActiveBots();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured bot personalities' })
  async getFeaturedBots() {
    return await this.botsService.getFeaturedBots();
  }

  @Get('non-featured')
  @ApiOperation({ summary: 'Get non-featured bot personalities' })
  async getNonFeaturedBots() {
    return await this.botsService.getNonFeaturedBots();
  }

  @Post('rotate-featured')
  @ApiOperation({ summary: 'Manually rotate featured bots' })
  async manualRotateFeaturedBots() {
    return await this.botsService.manualRotateFeaturedBots();
  }
}
