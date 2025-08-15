import { registerAs } from '@nestjs/config';

export default registerAs('valkey', () => ({
  host: process.env.VALKEY_HOST || 'localhost',
  port: parseInt(process.env.VALKEY_PORT || '6379', 10),
  password: process.env.VALKEY_PASSWORD || undefined,
  db: parseInt(process.env.VALKEY_DB || '0', 10),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
}));
