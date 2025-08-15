import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ValkeyService } from './valkey.service';
import valkeyConfig from '../config/valkey.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(valkeyConfig)],
  providers: [ValkeyService],
  exports: [ValkeyService],
})
export class ValkeyModule {}
