#!/bin/bash
#
# PostgreSQL Database Restore Script for HostMaster
#
# Usage:
#   ./scripts/restore-db.sh <backup-file>
#   ./scripts/restore-db.sh s3://bucket/path/to/backup.sql.gz
#   ./scripts/restore-db.sh latest  # Restore latest local backup
#

set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-hostmaster_prod}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

BACKUP_FILE="$1"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

# Find latest backup if requested
if [ "$BACKUP_FILE" = "latest" ]; then
    BACKUP_DIR="${BACKUP_DIR:-/var/backups/hostmaster}"
    BACKUP_FILE=$(find "$BACKUP_DIR" -name "hostmaster_db_*.sql.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    
    if [ -z "$BACKUP_FILE" ]; then
        error "No backups found in $BACKUP_DIR"
        exit 1
    fi
    
    log "Latest backup: $BACKUP_FILE"
fi

# Download from S3 if needed
if [[ "$BACKUP_FILE" == s3://* ]]; then
    log "Downloading from S3..."
    TEMP_FILE="/tmp/hostmaster_restore_$(date +%s).sql.gz"
    aws s3 cp "$BACKUP_FILE" "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log "========================================="
log "HostMaster Database Restore"
log "========================================="
log "Backup file: $BACKUP_FILE"
log "Target database: $DB_NAME on $DB_HOST:$DB_PORT"
log ""
read -p "⚠️  This will OVERWRITE the database. Continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    log "Restore cancelled"
    exit 0
fi

export PGPASSWORD="$DB_PASSWORD"

log "Dropping existing database..."
dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true

log "Creating new database..."
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"

log "Restoring from backup..."
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

unset PGPASSWORD

log "✅ Restore completed successfully"

# Cleanup temp file
if [[ "${BACKUP_FILE}" == /tmp/* ]]; then
    rm -f "$BACKUP_FILE"
fi
