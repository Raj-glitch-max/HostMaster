# Database Backup & Disaster Recovery

## Overview
Automated PostgreSQL backup system with S3 storage, encryption, and retention policies.

## Features
- ✅ Daily automated backups
- ✅ S3 upload with server-side encryption (AES-256)
- ✅ Local retention: 7 days
- ✅ S3 retention: 30 days
- ✅ Backup verification (integrity checks)
- ✅ Slack/email notifications
- ✅ Point-in-time recovery
- ✅ Restore scripts

## Quick Start

### 1. Make Scripts Executable
```bash
chmod +x backend/scripts/backup-db.sh
chmod +x backend/scripts/restore-db.sh
```

### 2. Configure Environment
```bash
# Add to .env or export before running
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=hostmaster_prod
export DB_USER=postgres
export DB_PASSWORD=your_password

# S3 Configuration (optional)
export S3_BUCKET=hostmaster-backups
export S3_PREFIX=database

# Notifications (optional)
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Test Manual Backup
```bash
cd backend
./scripts/backup-db.sh
```

Expected output:
```
[2026-01-17 08:55:00] Checking prerequisites...
[2026-01-17 08:55:00] ✅ Prerequisites OK
[2026-01-17 08:55:00] Starting database backup...
[2026-01-17 08:55:01] ✅ Backup created: /var/backups/hostmaster/hostmaster_db_20260117_085500.sql.gz
[2026-01-17 08:55:01] Backup size: 12M
[2026-01-17 08:55:01] ✅ Backup verified
[2026-01-17 08:55:02] ✅ Uploaded to s3://hostmaster-backups/database/hostmaster_db_20260117_085500.sql.gz
[2026-01-17 08:55:02] ✅ Backup completed successfully
```

## Automated Backups (Production)

### Option 1: Cron (Traditional)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/hostmaster/backend && ./scripts/backup-db.sh >> /var/log/hostmaster-backup.log 2>&1
```

### Option 2: Systemd Timer (Modern Linux)
```bash
# Create /etc/systemd/system/hostmaster-backup.service
[Unit]
Description=HostMaster Database Backup
After=network.target postgresql.service

[Service]
Type=oneshot
User=hostmaster
WorkingDirectory=/opt/hostmaster/backend
ExecStart=/opt/hostmaster/backend/scripts/backup-db.sh
EnvironmentFile=/opt/hostmaster/backend/.env

[Install]
WantedBy=multi-user.target

# Create /etc/systemd/system/hostmaster-backup.timer
[Unit]
Description=Daily HostMaster Database Backup
Requires=hostmaster-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target

# Enable and start
sudo systemctl enable hostmaster-backup.timer
sudo systemctl start hostmaster-backup.timer

# Check status
sudo systemctl status hostmaster-backup.timer
sudo systemctl list-timers
```

### Option 3: AWS EventBridge (Serverless)
```bash
# Lambda function triggered by EventBridge
# Runs backup script on EC2 instance via SSM Run Command
```

## Disaster Recovery

### Restore Latest Backup
```bash
./scripts/restore-db.sh latest
```

### Restore Specific Backup
```bash
# Local file
./scripts/restore-db.sh /var/backups/hostmaster/hostmaster_db_20260115_020000.sql.gz

# From S3
./scripts/restore-db.sh s3://hostmaster-backups/database/hostmaster_db_20260115_020000.sql.gz
```

### List Available Backups
```bash
# Local
ls -lh /var/backups/hostmaster/

# S3
aws s3 ls s3://hostmaster-backups/database/ --human-readable
```

## Backup Locations

### Local (Development)
```
/var/backups/hostmaster/
├── hostmaster_db_20260117_020000.sql.gz  (12 MB)
├── hostmaster_db_20260116_020000.sql.gz  (11 MB)
└── hostmaster_db_20260115_020000.sql.gz  (10 MB)

Retention: 7 days
```

### S3 (Production)
```
s3://hostmaster-backups/database/
├── hostmaster_db_20260117_020000.sql.gz  (STANDARD_IA, encrypted)
├── hostmaster_db_20260116_020000.sql.gz
└── ... (older backups)

Retention: 30 days (lifecycle policy)
Storage Class: STANDARD_IA (cheaper for infrequent access)
Encryption: AES-256 server-side
```

## S3 Setup (Production)

### 1. Create S3 Bucket
```bash
aws s3 mb s3://hostmaster-backups --region us-east-1

# Enable versioning (extra safety)
aws s3api put-bucket-versioning \
  --bucket hostmaster-backups \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block \
  --bucket hostmaster-backups \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 2. IAM Policy for Backup User
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:PutLifecycleConfiguration"
      ],
      "Resource": [
        "arn:aws:s3:::hostmaster-backups",
        "arn:aws:s3:::hostmaster-backups/*"
      ]
    }
  ]
}
```

### 3. Configure AWS Credentials
```bash
# On backup server
aws configure
# AWS Access Key ID: AKIAIOSFODNN7EXAMPLE
# AWS Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# Default region: us-east-1
```

## Monitoring & Alerts

### Check Backup Status
```bash
# Last backup age
LAST_BACKUP=$(find /var/backups/hostmaster -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1)
echo "Last backup: $(echo $LAST_BACKUP | cut -d' ' -f2)"

# Backup size trend
du -h /var/backups/hostmaster/*.sql.gz | tail -5
```

### Slack Notifications
Set `SLACK_WEBHOOK_URL` environment variable:
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
```

Will send messages like:
```
🔄 HostMaster DB Backup SUCCESS
✅ Backup completed successfully
File: hostmaster_db_20260117_020000.sql.gz
Size: 12M
Duration: 45s
```

### Email Alerts (Sendmail)
Add to backup script:
```bash
echo "Backup completed: $BACKUP_FILE" | mail -s "HostMaster Backup Success" admin@example.com
```

## Testing Backups

### 1. Test Backup Creation (Dry Run)
```bash
# Create test backup
./scripts/backup-db.sh

# Verify file integrity
LATEST_BACKUP=$(find /var/backups/hostmaster -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2)
gzip -t "$LATEST_BACKUP" && echo "✅ Backup file is valid"
```

### 2. Test Restore (Staging Database)
```bash
# Restore to staging database
DB_NAME=hostmaster_staging ./scripts/restore-db.sh latest

# Verify data
psql -h localhost -U postgres -d hostmaster_staging -c "SELECT COUNT(*) FROM users;"
```

### 3. Test S3 Upload
```bash
# Upload test file
echo "test" > /tmp/test.txt
aws s3 cp /tmp/test.txt s3://hostmaster-backups/test/test.txt --server-side-encryption AES256

# Verify
aws s3 ls s3://hostmaster-backups/test/

# Cleanup
aws s3 rm s3://hostmaster-backups/test/test.txt
```

## Costs

### AWS S3 Storage
- **Storage**: $0.0125/GB/month (STANDARD_IA)
- **Uploads**: $0.01 per 1,000 PUT requests
- **Downloads**: $0.01/GB data transfer

### Example (100 GB total backups)
- Storage: 100 GB × $0.0125 = **$1.25/month**
- Daily uploads: 30 × $0.00001 = **$0.0003/month**
- Occasional restores: ~$1/restore
- **Total: ~$1.50/month**

### Without S3 (Local Only)
- EC2 EBS storage: $0.10/GB/month
- 100 GB = **$10/month**
- ⚠️ Risk: Single point of failure (no off-site backup)

## Production Checklist

- [ ] Scripts executable (`chmod +x`)
- [ ] Environment variables configured
- [ ] S3 bucket created and secured
- [ ] IAM policy attached
- [ ] Cron/systemd timer configured
- [ ] Test manual backup successful
- [ ] Test restore to staging database
- [ ] Verify S3 upload working
- [ ] Lifecycle policy set (30 day retention)
- [ ] Slack/email notifications configured
- [ ] Monitoring dashboard created
- [ ] Disaster recovery playbook documented
- [ ] Team trained on restore procedure

## Recovery Time Objective (RTO)

### Local Restore
- **Download**: 0s (already local)
- **Restore**: ~2 minutes per 1GB
- **Total RTO**: ~5-10 minutes for typical database

### S3 Restore
- **Download**: ~1 minute per 1GB (depends on network)
- **Restore**: ~2 minutes per 1GB
- **Total RTO**: ~15-30 minutes for typical database

## Troubleshooting

### Backup Fails with "pg_dump: command not found"
```bash
# Install PostgreSQL client
sudo apt-get install postgresql-client-14
```

### S3 Upload Fails with "Access Denied"
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify IAM policy allows s3:PutObject
```

### Restore Hangs
```bash
# Check database connections
psql -h localhost -U postgres -c "SELECT * FROM pg_stat_activity WHERE datname='hostmaster_prod';"

# Terminate connections
psql -h localhost -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='hostmaster_prod';"
```

### Backup File Corrupted
```bash
# Verify gzip integrity
gzip -t /var/backups/hostmaster/backup.sql.gz

# If corrupted, use S3 version
aws s3 cp s3://hostmaster-backups/database/backup.sql.gz ./backup.sql.gz
gzip -t ./backup.sql.gz
```

## Next Steps

1. **Set up automated backups** (cron or systemd timer)
2. **Test restore procedure** on staging environment
3. **Configure S3 bucket** for off-site backups
4. **Set up monitoring** (last backup age alert)
5. **Document disaster recovery playbook**
6. **Train team** on restore procedure
