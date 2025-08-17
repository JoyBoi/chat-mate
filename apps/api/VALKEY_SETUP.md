# Valkey Setup and Configuration

This document outlines the complete Valkey (Redis-compatible) setup for the ChatMate API, including production-ready configurations for BullMQ job queuing.

## Overview

Valkey is used as the primary data store for:

- **BullMQ Job Queues**: AI processing jobs (summarize, translate, bot-response)
- **Real-time Communication**: Pub/Sub for chat features
- **Session Storage**: User sessions and temporary data
- **Caching**: API response caching and rate limiting

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NestJS API    │───▶│   Valkey/Redis  │◀───│   BullMQ Jobs   │
│                 │    │                 │    │                 │
│ • Controllers   │    │ • Job Queues    │    │ • AI Processing │
│ • Services      │    │ • Pub/Sub       │    │ • Retry Logic   │
│ • Processors    │    │ • Sessions      │    │ • Error Handling│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Configuration Files

### Core Configuration

- `src/config/valkey.config.ts` - Basic Valkey connection settings
- `src/config/valkey-production.config.ts` - Production-optimized settings
- `src/valkey/valkey.service.ts` - Connection management service
- `src/valkey/valkey-config.service.ts` - Runtime configuration service
- `src/valkey/valkey.module.ts` - NestJS module configuration

### BullMQ Integration

- `src/bullmq/bullmq.module.ts` - BullMQ module with Valkey connection
- `src/bullmq/bullmq.service.ts` - Job queue management
- `src/bullmq/processors/ai-job.processor.ts` - AI job processing

## Environment Variables

### Required Variables

```bash
# Basic Connection
VALKEY_HOST="localhost"          # Valkey server host
VALKEY_PORT=6379                 # Valkey server port
VALKEY_DB=0                      # Database number (0-15)

# Authentication (recommended for production)
VALKEY_PASSWORD="your-password"   # Leave empty for no auth
```

### Production Variables

```bash
# Memory Management
VALKEY_MAX_MEMORY="256mb"         # Maximum memory usage

# Connection Timeouts
VALKEY_CONNECT_TIMEOUT="10000"    # Connection timeout (ms)
VALKEY_COMMAND_TIMEOUT="5000"     # Command timeout (ms)
VALKEY_RETRY_DELAY="100"          # Retry delay (ms)
VALKEY_MAX_LOADING_TIMEOUT="5000" # Loading timeout (ms)

# Persistence Settings
VALKEY_SAVE_POLICY="3600 1 300 100 60 10000"  # Save policy

# Connection Pool
VALKEY_MAX_CLIENTS="10000"        # Maximum client connections
VALKEY_TCP_KEEPALIVE="30"         # TCP keepalive (seconds)

# TLS (Production)
VALKEY_TLS_ENABLED="false"        # Enable TLS
VALKEY_TLS_CERT=""                # TLS certificate path
VALKEY_TLS_KEY=""                 # TLS private key path
VALKEY_TLS_CA=""                  # TLS CA certificate path
```

## Critical Production Settings

### BullMQ Compatibility

These settings are **REQUIRED** for BullMQ to function properly:

```bash
# Redis/Valkey Configuration
maxmemory-policy noeviction       # Prevents job data loss
appendonly yes                    # Enables AOF persistence
appendfsync everysec             # AOF sync frequency
```

### Performance Optimization

```bash
# Memory Management
maxmemory 256mb                   # Adjust based on available RAM

# Connection Settings
tcp-keepalive 30                  # Keep connections alive
timeout 0                         # No idle timeout

# Persistence
save 3600 1 300 100 60 10000     # Background save policy
```

## Installation and Setup

### 1. Install Valkey/Redis

**macOS (Homebrew):**

```bash
brew install valkey
# or
brew install redis
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install redis-server
```

**Docker:**

```bash
docker run -d \
  --name valkey \
  -p 6379:6379 \
  -v valkey-data:/data \
  valkey/valkey:latest
```

### 2. Configure Environment

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Update Valkey settings in `.env`:
   ```bash
   VALKEY_HOST="localhost"
   VALKEY_PORT=6379
   VALKEY_PASSWORD=""  # Set a strong password for production
   VALKEY_DB=0
   ```

### 3. Production Configuration

For production deployments, ensure these settings are applied:

1. **Memory Policy**: Set `maxmemory-policy` to `noeviction`
2. **Persistence**: Enable AOF with `appendonly yes`
3. **Security**: Use authentication and TLS
4. **Monitoring**: Enable logging and metrics

## Verification

Use the built-in verification script to test your setup:

```bash
# Run the verification script
npm run verify:valkey

# Or run directly with ts-node
npx ts-node src/scripts/verify-valkey-setup.ts
```

The script will test:

- ✅ Connection to Valkey server
- ✅ Critical configuration settings
- ✅ BullMQ compatibility
- ✅ Job queue operations
- ✅ Performance benchmarks
- ✅ Environment variables

## Monitoring and Maintenance

### Health Checks

```typescript
// Check Valkey connection
const client = valkeyService.getClient();
const pong = await client.ping(); // Should return 'PONG'

// Check memory usage
const info = await client.info('memory');
console.log(info);

// Check configuration
const config = await client.config('GET', '*');
console.log(config);
```

### Performance Monitoring

- Monitor memory usage with `INFO memory`
- Track slow queries with `SLOWLOG GET`
- Monitor connection count with `INFO clients`
- Check persistence status with `LASTSAVE`

### Backup and Recovery

```bash
# Create backup
redis-cli --rdb /path/to/backup.rdb

# Restore from backup
cp /path/to/backup.rdb /var/lib/redis/dump.rdb
sudo systemctl restart redis
```

## Troubleshooting

### Common Issues

**Connection Refused:**

```bash
# Check if Valkey is running
sudo systemctl status redis
# or
ps aux | grep redis

# Check port availability
netstat -tlnp | grep 6379
```

**Memory Issues:**

```bash
# Check memory usage
redis-cli info memory

# Clear all data (CAUTION: This deletes everything!)
redis-cli flushall
```

**BullMQ Job Failures:**

```bash
# Check maxmemory-policy
redis-cli config get maxmemory-policy

# Set correct policy
redis-cli config set maxmemory-policy noeviction
```

### Log Analysis

Check application logs for Valkey-related errors:

```bash
# Application logs
tail -f logs/application.log | grep -i valkey

# Redis/Valkey logs
tail -f /var/log/redis/redis-server.log
```

## Security Best Practices

### Authentication

```bash
# Set password in redis.conf
requirepass your-strong-password

# Or via command line
redis-cli config set requirepass your-strong-password
```

### Network Security

```bash
# Bind to specific interfaces only
bind 127.0.0.1 ::1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

### TLS Encryption

```bash
# Enable TLS in redis.conf
port 0
tls-port 6380
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
tls-ca-cert-file /path/to/ca.crt
```

## Performance Tuning

### Memory Optimization

```bash
# Set appropriate maxmemory
maxmemory 256mb

# Use efficient data structures
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
```

### Connection Pooling

```typescript
// Configure connection pool in application
const redisOptions = {
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
  family: 4,
  keepAlive: true,
  retryDelayOnFailover: 100,
};
```

### Persistence Tuning

```bash
# AOF settings for durability vs performance
appendonly yes
appendfsync everysec  # Balance between safety and performance
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

## Integration with BullMQ

The Valkey setup is specifically optimized for BullMQ job processing:

### Queue Configuration

```typescript
// Job queues
const queues = [
  'ai-jobs', // AI processing tasks
  'ai-streaming', // Streaming AI responses
];

// Job options
const defaultJobOptions = {
  removeOnComplete: 10, // Keep last 10 completed jobs
  removeOnFail: 5, // Keep last 5 failed jobs
  attempts: 3, // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2s delay
  },
};
```

### Job Processing

```typescript
// AI job types
interface AIJobData {
  type: 'summarize' | 'translate' | 'bot-response';
  content: string;
  options?: Record<string, any>;
}

// Add job to queue
const job = await bullmqService.addJob('ai-jobs', 'process-ai', jobData);

// Monitor job progress
const progress = await job.progress();
const state = await job.getState();
```

## Resources

- [Valkey Documentation](https://valkey.io/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS BullMQ Integration](https://docs.nestjs.com/techniques/queues)

## Support

For issues related to Valkey setup:

1. Check the verification script output
2. Review application logs
3. Consult the troubleshooting section
4. Check environment variable configuration
5. Verify network connectivity and firewall settings
