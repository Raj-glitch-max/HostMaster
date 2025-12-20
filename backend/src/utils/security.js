const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Security utilities for production hardening
 */

/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .trim()
        .substring(0, 1000); // Limit length
}

/**
 * Validate password complexity - SIMPLIFIED FOR DEMO
 */
function validatePasswordStrength(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Check and handle failed login attempts - SIMPLIFIED FOR DEMO
 */
async function checkAccountLockout(userId) {
    // TODO: Add failed_login_attempts and account_locked_until columns
    // For now, return unlocked
    return { locked: false };

    /* ORIGINAL CODE - REQUIRES ADDITIONAL DB COLUMNS
    const result = await query(
        `SELECT failed_login_attempts, account_locked_until 
     FROM users WHERE id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        return { locked: false };
    }

    const user = result.rows[0];
    const lockedUntil = user.account_locked_until;

    // Check if account is currently locked
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
        const minutesRemaining = Math.ceil((new Date(lockedUntil) - new Date()) / 60000);
        return {
            locked: true,
            minutesRemaining
        };
    }

    // Reset if lockout period expired
    if (lockedUntil && new Date(lockedUntil) <= new Date()) {
        await query(
            `UPDATE users 
       SET failed_login_attempts = 0, account_locked_until = NULL 
       WHERE id = $1`,
            [userId]
        );
    }

    return { locked: false };
    */
}

/**
 * Record failed login attempt - SIMPLIFIED FOR DEMO
 */
async function recordFailedLogin(userId) {
    // TODO: Add columns for tracking
    logger.warn('Failed login attempt', { userId });
    return { locked: false, attempts: 0 };

    /* ORIGINAL CODE - REQUIRES ADDITIONAL DB COLUMNS
    const result = await query(
        `UPDATE users 
     SET failed_login_attempts = failed_login_attempts + 1,
         account_locked_until = CASE 
           WHEN failed_login_attempts + 1 >= 5 
           THEN NOW() + INTERVAL '30 minutes'
           ELSE NULL
         END
     WHERE id = $1
     RETURNING failed_login_attempts, account_locked_until`,
        [userId]
    );

    const attempts = result.rows[0].failed_login_attempts;

    if (attempts >= 5) {
        logger.warn('Account locked due to failed login attempts', { userId, attempts });
        return { locked: true, attempts };
    }

    return { locked: false, attempts };
    */
}

/**
 * Reset failed login attempts on successful login - SIMPLIFIED
 */
async function resetFailedLogins(userId) {
    // No-op for now - would require additional columns
    logger.info('Login successful', { userId });

    /* ORIGINAL CODE
    await query(
        `UPDATE users 
     SET failed_login_attempts = 0, 
         account_locked_until = NULL,
         last_login_at = NOW()
     WHERE id = $1`,
        [userId]
    );
    */
}

/**
 * Audit log for security events - SIMPLIFIED
 */
async function auditLog(data) {
    const { userId, action, ipAddress } = data;
    // Just log to Winston for now - would need audit_logs table
    logger.info('Audit event', { userId, action, ipAddress });

    /* ORIGINAL CODE - REQUIRES audit_logs TABLE
    const { userId, action, resourceType, resourceId, ipAddress, userAgent, metadata } = data;

    try {
        await query(
            `INSERT INTO audit_logs 
       (user_id, action, resource_type, resource_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                userId || null,
                action,
                resourceType || null,
                resourceId || null,
                ipAddress || null,
                userAgent || null,
                JSON.stringify(metadata || {})
            ]
        );
    } catch (error) {
        logger.error('Audit log failed', { error: error.message, data });
    }
    */
}

/**
 * Validate environment variables on startup
 */
function validateEnvironment() {
    const required = [
        'DB_HOST',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'JWT_SECRET',
        'REDIS_HOST'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET.length < 32) {
        logger.warn('JWT_SECRET is too short, should be at least 32 characters');
    }

    if (process.env.JWT_SECRET === 'local_development_secret') {
        logger.warn('Using default JWT_SECRET in production is insecure!');
    }

    logger.info('Environment variables validated');
}

/**
 * Extract IP address from request
 */
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;
}

module.exports = {
    sanitizeInput,
    validatePasswordStrength,
    checkAccountLockout,
    recordFailedLogin,
    resetFailedLogins,
    auditLog,
    validateEnvironment,
    getClientIp
};
