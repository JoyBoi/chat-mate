import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ValkeyService } from './valkey.service';
import { ValkeyConfigService } from './valkey-config.service';
import valkeyConfig from '../config/valkey.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(valkeyConfig)],
  providers: [ValkeyService, ValkeyConfigService],
  exports: [ValkeyService, ValkeyConfigService],
})
export class ValkeyModule {}
