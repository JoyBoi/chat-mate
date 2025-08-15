import { Controller, Get } from '@nestjs/common';
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
}
