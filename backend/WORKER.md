# HostMaster Worker Process

## Overview
The Bull worker processes AWS scan jobs and alert delivery jobs asynchronously.

## Architecture

### Queue System
- **Scan Queue**: Processes AWS resource scans
- **Alert Queue**: Processes cost alerts delivery

### Worker Flow
```
API receives scan request
  ↓
Encrypts AWS credentials
  ↓
Adds job to Bull queue (Redis)
  ↓
Worker picks up job
  ↓
Decrypts credentials
  ↓
Scans AWS (EC2, RDS, Cost Explorer)
  ↓
Stores results in PostgreSQL
  ↓
Generates recommendations
  ↓
Checks for alerts
  ↓
Invalidates cache
```

## Running Workers

### Development (Inline with API)
```bash
npm run dev
# Workers start automatically in development mode
```

### Production (Separate Processes)

#### Option 1: PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start all processes (API + Worker)
pm2 start ecosystem.config.js

# Monitor
pm2 logs
pm2 monit

# Stop
pm2 stop all
```

#### Option 2: Manual
```bash
# Terminal 1 - API server
npm start

# Terminal 2 - Worker process
START_WORKERS=true npm run worker
```

### Docker
```bash
# API container (no workers)
docker run -e NODE_ENV=production -e START_WORKERS=false hostmaster-api

# Worker container (only workers)
docker run -e NODE_ENV=production hostmaster-worker npm run worker
```

## Scaling Workers

### Horizontal Scaling
```bash
# Scale to 3 worker instances
pm2 scale hostmaster-worker 3

# Or manually
START_WORKERS=true npm run worker  # Process 1
START_WORKERS=true npm run worker  # Process 2
START_WORKERS=true npm run worker  # Process 3
```

### When to Scale
- **Queue Length > 100**: Add worker
- **Job Wait Time > 5min**: Add worker
- **Worker CPU > 80%**: Add worker
- **Cost**: ~$20/mo per worker on AWS t3.small

## Monitoring

### Queue Stats
```bash
# Via Redis CLI
redis-cli
LLEN bull:scan:wait       # Jobs waiting
LLEN bull:scan:active     # Jobs processing
LLEN bull:scan:completed  # Completed jobs
LLEN bull:scan:failed     # Failed jobs
```

### Worker Health
```bash
pm2 logs hostmaster-worker
pm2 monit
```

### Production Monitoring
- **Datadog**: Track queue length, job duration
- **Sentry**: Error tracking
- **CloudWatch**: Worker CPU/memory

## Error Handling

### Failed Jobs
- Automatic retry (3 attempts)
- Exponential backoff
- Dead letter queue after 3 failures
- Error logged to PostgreSQL `scan_jobs.errors`

### Worker Crashes
- PM2 auto-restart
- Max 10 restarts in 1 minute
- Alerts sent to Slack/email

## Resource Usage

### Per Worker Instance
- **CPU**: 0.5 vCPU (peaks during AWS scans)
- **Memory**: 200-500 MB
- **Network**: ~50 KB/s during scans

### Cloud Costs (AWS t3.small)
- **1 worker**: ~$15/mo
- **3 workers**: ~$45/mo
- **Auto-scaling group**: $30-100/mo

## Security

### Credential Handling
✅ Encrypted in Redis (AES-256-GCM)
✅ Decrypted only in worker memory
✅ Never logged
✅ Cleared after scan completion

### Environment Variables
Required in worker process:
```bash
ENCRYPTION_KEY=<64-hex-chars>
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## Troubleshooting

### Workers Not Processing
1. Check Redis connection: `redis-cli PING`
2. Check worker logs: `pm2 logs hostmaster-worker`
3. Verify ENCRYPTION_KEY is set
4. Check queue: `redis-cli LLEN bull:scan:wait`

### Slow Processing
1. Scale workers: `pm2 scale hostmaster-worker 3`
2. Check AWS API throttling
3. Monitor database query performance

### Memory Leaks
1. Check `pm2 monit`
2. Workers auto-restart at 1GB memory
3. Review worker code for unclosed connections

## Production Checklist

- [ ] PM2 installed and configured
- [ ] `ecosystem.config.js` reviewed
- [ ] Separate worker instances from API
- [ ] ENCRYPTION_KEY set in environment
- [ ] Redis password protected
- [ ] Worker logs monitored
- [ ] Auto-scaling configured (optional)
- [ ] Dead letter queue alerts set up
- [ ] Datadog/Sentry integrated
