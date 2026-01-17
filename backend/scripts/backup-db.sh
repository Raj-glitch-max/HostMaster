#!/bin/bash
#
# PostgreSQL Automated Backup Script for HostMaster
# 
# Features:
# - Daily automated backups
# - S3 upload with encryption
# - Local retention (7 days)
# - S3 retention (30 days)
# - Slack/email notifications
# - Backup verification
#
# Usage:
#   chmod +x scripts/backup-db.sh
#   ./scripts/backup-db.sh
#
# Cron (daily at 2 AM):
#   0 2 * * * /path/to/hostmaster/backend/scripts/backup-db.sh

set -euo pipefail  # Exit on error, undefined var, pipe failure

# ============================================
# Configuration (from environment or defaults)
# ============================================

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-hostmaster_prod}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/hostmaster}"
S3_BUCKET="${S3_BUCKET:-hostmaster-backups}"
S3_PREFIX="${S3_PREFIX:-database}"

RETENTION_DAYS_LOCAL=7
RETENTION_DAYS_S3=30

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="hostmaster_db_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Slack webhook for notifications (optional)
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

# ============================================
# Functions
# ============================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

send_slack_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"🔄 HostMaster DB Backup $status\n\`\`\`\n$message\n\`\`\`\"}" \
            2>/dev/null || true
    fi
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check pg_dump
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump not found. Install postgresql-client"
        exit 1
    fi
    
    # Check AWS CLI (optional for S3)
    if ! command -v aws &> /dev/null; then
        log "⚠️  AWS CLI not found. S3 upload will be skipped"
        USE_S3=false
    else
        USE_S3=true
    fi
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    log "✅ Prerequisites OK"
}

create_backup() {
    log "Starting database backup..."
    log "Database: $DB_NAME on $DB_HOST:$DB_PORT"
    
    # Set password environment variable
    export PGPASSWORD="$DB_PASSWORD"
    
    # Run pg_dump with compression
    if pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-acl \
        --verbose \
        2>&1 | gzip > "$BACKUP_PATH"; then
        
        log "✅ Backup created: $BACKUP_PATH"
        
        # Get backup size
        BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
        log "Backup size: $BACKUP_SIZE"
        
        # Verify backup is not empty
        if [ ! -s "$BACKUP_PATH" ]; then
            error "Backup file is empty!"
            return 1
        fi
        
        # Test backup integrity
        if ! gzip -t "$BACKUP_PATH" 2>/dev/null; then
            error "Backup file is corrupted!"
            return 1
        fi
        
        log "✅ Backup verified"
        return 0
    else
        error "Backup failed!"
        return 1
    fi
    
    unset PGPASSWORD
}

upload_to_s3() {
    if [ "$USE_S3" = false ]; then
        log "⚠️  Skipping S3 upload (AWS CLI not installed)"
        return 0
    fi
    
    log "Uploading to S3..."
    
    S3_KEY="${S3_PREFIX}/${BACKUP_FILE}"
    
    if aws s3 cp "$BACKUP_PATH" "s3://${S3_BUCKET}/${S3_KEY}" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256 \
        --metadata "db-name=$DB_NAME,timestamp=$TIMESTAMP"; then
        
        log "✅ Uploaded to s3://${S3_BUCKET}/${S3_KEY}"
        
        # Set lifecycle policy (if not already set)
        aws s3api put-bucket-lifecycle-configuration \
            --bucket "$S3_BUCKET" \
            --lifecycle-configuration file://<(cat <<EOF
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Prefix": "${S3_PREFIX}/",
      "Expiration": {
        "Days": ${RETENTION_DAYS_S3}
      }
    }
  ]
}
EOF
) 2>/dev/null || log "⚠️  Could not set lifecycle policy (may already exist)"
        
        return 0
    else
        error "S3 upload failed!"
        return 1
    fi
}

cleanup_old_backups() {
    log "Cleaning up old backups (keeping last $RETENTION_DAYS_LOCAL days)..."
    
    # Delete local backups older than RETENTION_DAYS_LOCAL
    find "$BACKUP_DIR" -name "hostmaster_db_*.sql.gz" -type f -mtime "+$RETENTION_DAYS_LOCAL" -delete
    
    REMAINING=$(find "$BACKUP_DIR" -name "hostmaster_db_*.sql.gz" -type f | wc -l)
    log "✅ Local backups remaining: $REMAINING"
}

# ============================================
# Main Execution
# ============================================

main() {
    log "========================================="
    log "HostMaster Database Backup Started"
    log "========================================="
    
    START_TIME=$(date +%s)
    
    # Run backup process
    check_prerequisites
    
    if create_backup; then
        upload_to_s3
        cleanup_old_backups
        
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        
        BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
        SUCCESS_MSG="✅ Backup completed successfully\nFile: $BACKUP_FILE\nSize: $BACKUP_SIZE\nDuration: ${DURATION}s"
        
        log "$SUCCESS_MSG"
        send_slack_notification "SUCCESS" "$SUCCESS_MSG"
        
        exit 0
    else
        ERROR_MSG="❌ Backup failed\nDatabase: $DB_NAME\nTimestamp: $TIMESTAMP"
        
        error "$ERROR_MSG"
        send_slack_notification "FAILED" "$ERROR_MSG"
        
        exit 1
    fi
}

# Run main function
main "$@"
