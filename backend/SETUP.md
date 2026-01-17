# HostMaster Production Setup Guide

## Prerequisites

Before running HostMaster in production, ensure these services are available:

### Required Services

1. **PostgreSQL** (Database)
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Linux  
   sudo apt install postgresql-14
   sudo systemctl start postgresql
   
   # Docker
   docker run -d --name hostmaster-postgres \
     -e POSTGRES_PASSWORD=yourpass \
     -e POSTGRES_DB=hostmaster \
     -p 5432:5432 postgres:14
   ```

2. **Redis** (Queue & Cache)
   ```bash
   # macOS
   brew installredis
   brew services start redis
   
   # Linux
   sudo apt install redis-server
   sudo systemctl start redis
   
   # Docker
   docker run -d --name hostmaster-redis \
     -p 6379:6379 redis:7-alpine
   ```

3. **Node.js 20+**
   ```bash
   node --version  # Should be >= 20.0.0
   ```

### Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostmaster
DB_USER=postgres
DB_PASSWORD=yourpassword

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=<64-char-random-string>
JWT_EXPIRE=7d

# Encryption (CRITICAL!)
ENCRYPTION_KEY=<64-hex-chars>

# AWS (for Cost Explorer)
AWS_REGION=us-east-1

# Alerts (optional for development)
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@hostmaster.com

# Monitoring (optional)
SENTRY_DSN=https://...@sentry.io/...
```

Generate secrets:
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Installation

```bash
# Backend
cd backend
npm install

# Database setup
psql -U postgres -c "CREATE DATABASE hostmaster;"
# Run migrations if you have them
# npm run migrate
```

---

## Running Locally

### Option 1: All-in-One (Development)
```bash
cd backend
npm run dev
# This starts both API and workers
```

### Option 2: Separate Processes (Production-like)
```bash
# Terminal 1: API Server
cd backend
npm run start

# Terminal 2: Worker Process
cd backend
npm run worker
```

### Option 3: PM2 (Production)
```bash
cd backend
pm2 start ecosystem.config.js
pm2 logs
```

---

## Verification Checklist

Before deploying to production, verify:

- [ ] PostgreSQL is running and accessible
- [ ] Redis is running and accessible
- [ ] All environment variables are set
- [ ] Encryption key is 64 hex characters
- [ ] JWT secret is strong (32+ characters)
- [ ] Database tables exist (run migrations)
- [ ] Health endpoint works: `curl http://localhost:3000/health`
- [ ] Metrics endpoint works: `curl http://localhost:3000/metrics`

---

## Testing

```bash
# Unit tests
npm test

# Integration tests (requires Redis + PostgreSQL)
npm test -- --testPathPattern=integration

# Worker test (requires Redis)
node scripts/test-workers.js

# Load test
npm install -g artillery
artillery quick --count 10 --num 50 http://localhost:3000/health
```

---

## Common Issues

### "Redis connection failed"
**Cause**: Redis not running  
**Fix**:
```bash
# Check if Redis is running
redis-cli ping  # Should return "PONG"

# Start Redis
brew services start redis  # macOS
sudo systemctl start redis # Linux
```

### "Database connection failed"
**Cause**: PostgreSQL not running or wrong credentials  
**Fix**:
```bash
# Check PostgreSQL
psql -U postgres -c "SELECT 1"

# Check connection details in .env match PostgreSQL
```

### "Workers not processing jobs"
**Cause**: Worker process not started  
**Fix**:
```bash
# Start worker
npm run worker:dev

# Check worker logs
pm2 logs hostmaster-worker  # if using PM2
```

### "Encryption key error"
**Cause**: ENCRYPTION_KEY not set or wrong length  
**Fix**:
```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
echo "ENCRYPTION_KEY=<generated-key>" >> .env
```

---

## Production Deployment

See [DEPLOYMENT.md](file:///home/raj/Documents/PROJECTS/HostMaster/DEPLOYMENT.md) for detailed production deployment instructions.

Quick reference:
1. Set up AWS RDS (PostgreSQL)
2. Set up AWS ElastiCache (Redis)
3. Deploy code to EC2 with PM2
4. Configure Nginx reverse proxy
5. Set up SSL with Let's Encrypt
6. Configure automated backups
7. Set up monitoring (Prometheus + Grafana)

---

## Development Workflow

```bash
# 1. Start services
docker-compose up -d  # If using Docker

# 2. Start development server
npm run dev

# 3. Make changes (hot reload enabled)

# 4. Run tests
npm test

# 5. Before committing
npm run lint
npm test
git add .
git commit -m "Your message"
git push

# Git hooks will run tests automatically
```

---

## Next Steps

1. Read [hostmaster_honest_assessment.md](file:///home/raj/Documents/PROJECTS/HostMaster/docs/hostmaster_honest_assessment.md) to understand current state
2. Follow [action_plan_to_launch.md](file:///home/raj/Documents/PROJECTS/HostMaster/docs/action_plan_to_launch.md) to complete remaining work
3. Deploy using [DEPLOYMENT.md](file:///home/raj/Documents/PROJECTS/HostMaster/DEPLOYMENT.md)

**For now, Redis and PostgreSQL not running is OK - we'll focus on code improvements that don't require them.**
