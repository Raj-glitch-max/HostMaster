# 🚀 HostMaster Production Deployment Guide

## Pre-Deployment Checklist

### ✅ Required Before Deployment

- [ ] All 5 critical blockers fixed (JWT, Encryption, Workers, Backups, Monitoring)
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Pre-flight verification script passes
- [ ] SSL/TLS certificates obtained
- [ ] DNS configured
- [ ] Monitoring stack deployed
- [ ] Backup system tested
- [ ] Load testing completed
- [ ] Security scan completed

---

## Step-by-Step Deployment

### Step 1: Pre-Flight Verification

```bash
cd /path/to/HostMaster/backend

# Make verification script executable
chmod +x scripts/verify-production.sh

# Run verification (must pass before deploying!)
./scripts/verify-production.sh
```

Expected output:
```
========================================
Verification Summary
========================================

Passed: 45
Warnings: 2
Failed: 0

🎉 All checks passed! Ready for production deployment.
```

If any **FAILED** checks, fix them before proceeding!

---

### Step 2: Choose Deployment Option

#### **Option A: AWS EC2 (Recommended for MVP)**

**Cost**: ~$116/month  
**Scalability**: Manual (PM2 + scaling groups)  
**Complexity**: Medium

**Pros**:
- Full control
- Predictable costs
- Easy debugging
- Works with existing AWS setup

**Cons**:
- Manual scaling
- More DevOps work

---

#### **Option B: Docker + AWS ECS Fargate**

**Cost**: ~$90/month (2 API + 1 Worker)  
**Scalability**: Auto-scaling built-in  
**Complexity**: Medium-High

**Pros**:
- Serverless containers
- Auto-scaling
- No server management
- Easy rollbacks

**Cons**:
- Slightly more expensive per GB
- Learning curve

---

#### **Option C: Kubernetes (EKS)**

**Cost**: ~$170/month (cluster + nodes)  
**Scalability**: Full orchestration  
**Complexity**: High

**Pros**:
- Production-grade orchestration
- Auto-healing
- Rolling deployments
- Best for enterprise

**Cons**:
- Expensive for MVP
- Complex setup
- Overkill for <1000 users

---

### Step 3A: Deploy to EC2 (Manual Method)

#### 3A.1: Launch EC2 Instance

```bash
# Launch Ubuntu instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxx \
  --subnet-id subnet-xxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=hostmaster-api}]'
```

#### 3A.2: SSH and Install Dependencies

```bash
# SSH to instance
ssh -i your-key.pem ubuntu@<INSTANCE-IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL client (for backups)
sudo apt install -y postgresql-client-14

# Install PM2
sudo npm install -g pm2

# Install AWS CLI (for S3 backups)
sudo apt install -y awscli
```

#### 3A.3: Clone and Setup

```bash
# Clone repository
cd /home/ubuntu
git clone https://github.com/Raj-glitch-max/HostMaster.git
cd HostMaster/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

Paste your production environment variables:
```bash
NODE_ENV=production
PORT=3000

# Database (RDS)
DB_HOST=hostmaster-prod.xxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=hostmaster_prod
DB_USER=hostmaster
DB_PASSWORD=<STRONG-PASSWORD>

# JWT
JWT_SECRET=<64-char-random-string>
JWT_EXPIRE=7d

# Encryption
ENCRYPTION_KEY=<64-hex-chars>

# Redis (ElastiCache)
REDIS_HOST=hostmaster-prod.xxxx.cache.amazonaws.com
REDIS_PORT=6379

# AWS
AWS_REGION=us-east-1

# Backups
S3_BUCKET=hostmaster-backups
S3_PREFIX=database
BACKUP_DIR=/var/backups/hostmaster

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# CORS
CORS_ORIGIN=https://app.hostmaster.com
```

#### 3A.4: Database Setup

```bash
# Run migrations (if you have migration scripts)
npm run migrate

# Or manually create tables
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/init.sql
```

#### 3A.5: Start with PM2

```bash
# Start all processes (API + Worker)
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 on system startup
pm2 startup systemd
# Run the command it outputs

# Check status
pm2 status
pm2 logs
```

#### 3A.6: Setup Backups

```bash
# Make scripts executable
chmod +x scripts/backup-db.sh scripts/restore-db.sh

# Test backup manually
./scripts/backup-db.sh

# Add to crontab
crontab -e

# Add this line (daily at 2 AM):
0 2 * * * cd /home/ubuntu/HostMaster/backend && ./scripts/backup-db.sh >> /var/log/hostmaster-backup.log 2>&1
```

#### 3A.7: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/hostmaster
```

```nginx
server {
    listen 80;
    server_name api.hostmaster.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.hostmaster.com;

    # SSL certificates (from Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.hostmaster.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.hostmaster.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running scans
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health checks (no auth required)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hostmaster /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 3A.8: Get SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.hostmaster.com

# Auto-renewal (certbot sets this up automatically)
sudo systemctl status certbot.timer
```

---

### Step 4: Post-Deployment Verification

#### 4.1: Health Checks

```bash
# From your local machine
# Liveness
curl https://api.hostmaster.com/health

# Expected:
{
  "status": "healthy",
  "timestamp": "2026-01-17T03:45:00.000Z",
  "uptime": 123.45,
  "version": "1.0.0"
}

# Readiness
curl https://api.hostmaster.com/health/ready

# Expected:
{
  "status": "ready",
  "checks": {
    "database": true,
    "redis": true,
    "queues": { "scan": {...}, "alert": {...}, "healthy": true }
  }
}
```

#### 4.2: API Test

```bash
# Register user
curl -X POST https://api.hostmaster.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPass123!",
    "name": "Test User"
  }'

# Login
curl -X POST https://api.hostmaster.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPass123!"
  }'

# Save the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get resources (should require JWT)
curl https://api.hostmaster.com/api/v1/resources \
  -H "Authorization: Bearer $TOKEN"
```

#### 4.3: Trigger AWS Scan

```bash
curl -X POST https://api.hostmaster.com/api/v1/resources/scan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accessKeyId": "AKIA...",
    "secretAccessKey": "...",
    "region": "us-east-1"
  }'

# Response:
{
  "message": "Scan queued successfully",
  "jobId": 123,
  "scanJobId": 456,
  "status": "pending"
}

# Check worker logs
ssh ubuntu@<INSTANCE-IP>
pm2 logs hostmaster-worker
```

#### 4.4: Verify Metrics

```bash
# Check Prometheus metrics
curl https://api.hostmaster.com/metrics | grep http_requests_total

# Should see:
http_requests_total{method="GET",route="/health",status_code="200"} 42
```

---

### Step 5: Setup Monitoring

#### 5.1: Deploy Prometheus

```bash
# On monitoring server (or same instance for MVP)
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# Create prometheus.yml
nano prometheus.yml
```

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'hostmaster-api'
    static_configs:
      - targets: ['api.hostmaster.com:443']
    metrics_path: '/metrics'
    scheme: https
```

```bash
# Start Prometheus
./prometheus --config.file=prometheus.yml &

# Access UI
open http://<MONITORING-IP>:9090
```

#### 5.2: Deploy Grafana

```bash
# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Access UI
open http://<MONITORING-IP>:3000
# Login: admin / admin
```

---

### Step 6: Load Testing

```bash
# Install Artillery
npm install -g artillery

# Create loadtest.yml
cat > loadtest.yml <<EOF
config:
  target: 'https://api.hostmaster.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Sustained load"

scenarios:
  - flow:
    - get:
        url: "/health"
EOF

# Run load test
artillery run loadtest.yml

# Monitor during test:
# - pm2 monit (CPU/memory)
# - Grafana dashboard
# - CloudWatch metrics
```

---

## Rollback Plan

If deployment fails:

```bash
# Stop PM2 processes
pm2 stop all

# Revert to previous git commit
git checkout <PREVIOUS-COMMIT>

# Reinstall dependencies
npm install --production

# Restart
pm2 start ecosystem.config.js
```

---

## Troubleshooting

### API not responding
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs hostmaster-api --lines 100

# Check port
sudo netstat -tlnp | grep 3000

# Restart
pm2 restart hostmaster-api
```

### Workers not processing jobs
```bash
# Check worker logs
pm2 logs hostmaster-worker

# Check Redis
redis-cli -h $REDIS_HOST PING
redis-cli -h $REDIS_HOST LLEN bull:scan:waiting

# Restart worker
pm2 restart hostmaster-worker
```

### Database connection failed
```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check security group (port 5432 open to API server)
# Check RDS status in AWS Console
```

---

## Cost Optimization

### After 1 Month

- Review CloudWatch metrics
- Right-size EC2 instances
- Consider Reserved Instances (30-40% discount)
- Implement auto-scaling

### After 100 Users

- Move to RDS Aurora Serverless
- Add read replicas
- Implement CloudFront CDN
- Use S3 for static assets

---

## Next Steps

1. ✅ Deploy to production
2. Monitor for 48 hours
3. Load test with real usage patterns
4. Optimize based on metrics
5. Deploy frontend
6. Launch marketing campaign
7. Get first 10 paying users!

**You're ready to deploy! 🚀**
