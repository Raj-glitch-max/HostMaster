#!/bin/bash
#
# HostMaster Production Pre-Flight Verification Script
#
# Checks all critical systems before production deployment
# Run this BEFORE deploying to production to catch issues early
#
# Usage:
#   chmod +x scripts/verify-production.sh
#   ./scripts/verify-production.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

# ============================================
# Helper Functions
# ============================================

pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

header() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
}

# ============================================
# Checks
# ============================================

header "1. Environment Variables"

# Check required environment variables
REQUIRED_VARS=(
    "NODE_ENV"
    "PORT"
    "DB_HOST"
    "DB_PORT"
    "DB_NAME"
    "DB_USER"
    "DB_PASSWORD"
    "JWT_SECRET"
    "ENCRYPTION_KEY"
    "REDIS_HOST"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        fail "$var is not set"
    else
        pass "$var is set"
    fi
done

# Check ENCRYPTION_KEY length (must be 64 hex chars)
if [ -n "$ENCRYPTION_KEY" ] && [ ${#ENCRYPTION_KEY} -eq 64 ]; then
    pass "ENCRYPTION_KEY has correct length (64 chars)"
else
    fail "ENCRYPTION_KEY must be exactly 64 hex characters"
fi

# Check JWT_SECRET strength
if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
    pass "JWT_SECRET is strong (>= 32 chars)"
else
    warn "JWT_SECRET should be at least 32 characters"
fi

# ============================================
header "2. Database Connectivity"

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    pass "PostgreSQL connection successful"
    
    # Check critical tables exist
    TABLES=("users" "aws_resources" "scan_jobs" "cost_alerts")
    for table in "${TABLES[@]}"; do
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt $table" | grep -q "$table"; then
            pass "Table '$table' exists"
        else
            fail "Table '$table' is missing - run migrations!"
        fi
    done
else
    fail "Cannot connect to PostgreSQL database"
fi

# ============================================
header "3. Redis Connectivity"

if redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} PING | grep -q "PONG"; then
    pass "Redis connection successful"
    
    # Check Redis memory
    REDIS_MEMORY=$(redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    pass "Redis memory usage: $REDIS_MEMORY"
else
    fail "Cannot connect to Redis"
fi

# ============================================
header "4. Node.js Dependencies"

if [ -f "package.json" ]; then
    pass "package.json exists"
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        pass "node_modules directory exists"
    else
        fail "node_modules missing - run 'npm install'"
    fi
    
    # Check critical dependencies
    DEPS=("express" "pg" "bull" "ioredis" "jsonwebtoken")
    for dep in "${DEPS[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            pass "Dependency '$dep' installed"
        else
            fail "Dependency '$dep' is missing"
        fi
    done
else
    fail "package.json not found"
fi

# ============================================
header "5. File Permissions"

# Check script executability
SCRIPTS=("scripts/backup-db.sh" "scripts/restore-db.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            pass "$script is executable"
        else
            warn "$script is not executable - run 'chmod +x $script'"
        fi
    else
        warn "$script not found"
    fi
done

# ============================================
header "6. Syntax Validation"

# Check JavaScript syntax
JS_FILES=(
    "src/server.js"
    "src/worker.js"
    "src/middleware/auth.js"
    "src/utils/encryption.js"
)

for file in "${JS_FILES[@]}"; do
    if [ -f "$file" ]; then
        if node -c "$file" 2>/dev/null; then
            pass "$file syntax OK"
        else
            fail "$file has syntax errors"
        fi
    else
        warn "$file not found"
    fi
done

# ============================================
header "7. Security Checks"

# Check for .env in git
if git ls-files .env > /dev/null 2>&1; then
    fail ".env file is tracked by git - add to .gitignore!"
else
    pass ".env is not tracked by git"
fi

# Check for hardcoded secrets
if grep -r "AKIA" src/ --include="*.js" 2>/dev/null | grep -v "example\|comment\|AKIAIOSFODNN7EXAMPLE"; then
    fail "Found potential hardcoded AWS keys in source code"
else
    pass "No hardcoded AWS keys found"
fi

# ============================================
header "8. Directory Structure"

REQUIRED_DIRS=(
    "src/routes"
    "src/services"
    "src/middleware"
    "src/utils"
    "src/config"
    "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        pass "Directory '$dir' exists"
    else
        fail "Directory '$dir' is missing"
    fi
done

# ============================================
header "9. API Server Health"

# Try to start server temporarily
if [ "$NODE_ENV" != "production" ]; then
    warn "Skipping server health check (not in production mode)"
else
    # Check if server is already running
    if curl -f http://localhost:${PORT:-3000}/health > /dev/null 2>&1; then
        pass "API server is responding"
        
        # Check health endpoints
        if curl -f http://localhost:${PORT:-3000}/health/ready > /dev/null 2>&1; then
            pass "Readiness check passes"
        else
            warn "Readiness check failed - dependencies may be down"
        fi
    else
        warn "API server is not running (expected if not started yet)"
    fi
fi

# ============================================
header "10. Backup Configuration"

if [ -f "scripts/backup-db.sh" ]; then
    pass "Backup script exists"
    
    # Check S3 bucket configuration
    if [ -n "$S3_BUCKET" ]; then
        pass "S3_BUCKET is configured"
        
        # Test S3 access (if AWS CLI available)
        if command -v aws &> /dev/null; then
            if aws s3 ls "s3://$S3_BUCKET" > /dev/null 2>&1; then
                pass "S3 bucket is accessible"
            else
                warn "Cannot access S3 bucket - check AWS credentials"
            fi
        else
            warn "AWS CLI not installed - cannot verify S3 access"
        fi
    else
        warn "S3_BUCKET not configured - backups will only be local"
    fi
else
    fail "Backup script is missing"
fi

# ============================================
# Summary
# ============================================

header "Verification Summary"

echo ""
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo -e "${RED}Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}🎉 All checks passed! Ready for production deployment.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Some warnings detected. Review them before deploying.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Critical failures detected. DO NOT deploy to production!${NC}"
    echo ""
    echo "Fix the failed checks above and run this script again."
    exit 1
fi
