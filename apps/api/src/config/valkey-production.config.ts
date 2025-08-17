import { registerAs } from '@nestjs/config';

/**
 * Production-ready Valkey configuration for BullMQ
 * Based on BullMQ documentation and Valkey best practices
 *
 * Key requirements for BullMQ:
 * - maxmemory-policy must be 'noeviction'
 * - maxRetriesPerRequest must be null for workers
 * - AOF persistence recommended for job durability
 * - Proper connection pooling and retry strategies
 */
export default registerAs('valkeyProduction', () => ({
  // Basic connection settings
  host: process.env.VALKEY_HOST || 'localhost',
  port: parseInt(process.env.VALKEY_PORT || '6379', 10),
  password: process.env.VALKEY_PASSWORD || undefined,
  db: parseInt(process.env.VALKEY_DB || '0', 10),

  // BullMQ specific requirements
  maxRetriesPerRequest: null, // Critical for workers - prevents breaking on Redis disconnections
  enableOfflineQueue: false, // Disable for Queue instances, enable for Workers
  lazyConnect: true, // Connect only when needed

  // Connection optimization
  family: 4, // Use IPv4
  keepAlive: true,
  connectTimeout: parseInt(process.env.VALKEY_CONNECT_TIMEOUT || '10000', 10),
  commandTimeout: parseInt(process.env.VALKEY_COMMAND_TIMEOUT || '5000', 10),

  // Retry and failover settings
  retryDelayOnFailover: parseInt(process.env.VALKEY_RETRY_DELAY || '100', 10),
  enableReadyCheck: false,
  maxLoadingTimeout: parseInt(
    process.env.VALKEY_MAX_LOADING_TIMEOUT || '5000',
    10
  ),

  // Connection pool settings
  retryStrategy: (times: number) => {
    // Exponential backoff with min 1s, max 20s
    return Math.max(Math.min(Math.exp(times), 20000), 1000);
  },
  // Production memory and persistence settings (applied via Redis CONFIG)
  productionSettings: {
    // Memory management - CRITICAL for BullMQ
    'maxmemory-policy': 'noeviction', // Prevents key eviction that breaks BullMQ
    maxmemory: process.env.VALKEY_MAX_MEMORY || '256mb',

    // Persistence settings for job durability
    appendonly: 'yes', // Enable AOF
    appendfsync: 'everysec', // Flush to disk every second
    'auto-aof-rewrite-percentage': '100',
    'auto-aof-rewrite-min-size': '64mb',

    // Snapshot settings (RDB)
    save: process.env.VALKEY_SAVE_POLICY || '3600 1 300 100 60 10000',

    // Connection limits
    maxclients: parseInt(process.env.VALKEY_MAX_CLIENTS || '10000', 10),
    'tcp-keepalive': parseInt(process.env.VALKEY_TCP_KEEPALIVE || '30', 10),

    // Security
    'protected-mode': process.env.NODE_ENV === 'production' ? 'yes' : 'no',

    // Performance tuning
    hz: '10', // Background task frequency
    'tcp-backlog': '511',
    timeout: '300', // Client idle timeout
  },

  // TLS settings for production
  tls:
    process.env.VALKEY_TLS_ENABLED === 'true'
      ? {
          cert: process.env.VALKEY_TLS_CERT,
          key: process.env.VALKEY_TLS_KEY,
          ca: process.env.VALKEY_TLS_CA,
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        }
      : undefined,
}));
