const Redis = require('ioredis');
const logger = require('../utils/logger');

// Redis client for caching
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3
});

redis.on('connect', () => {
    logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
});

/**
 * Cache utilities with TTL
 */
class Cache {
    /**
     * Get account cost from cache (1 hour TTL)
     */
    async getAccountCost(accountId) {
        const key = `account:${accountId}:cost`;
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }

    async setAccountCost(accountId, cost) {
        const key = `account:${accountId}:cost`;
        await redis.setex(key, 3600, JSON.stringify(cost)); // 1 hour
    }

    /**
     * Get user dashboard (30 min TTL)
     */
    async getUserDashboard(userId) {
        const key = `user:${userId}:dashboard`;
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }

    async setUserDashboard(userId, data) {
        const key = `user:${userId}:dashboard`;
        await redis.setex(key, 1800, JSON.stringify(data)); // 30 minutes
    }

    /**
     * Invalidate cache for account
     */
    async invalidateAccount(accountId) {
        const pattern = `account:${accountId}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }

    /**
     * Invalidate cache for user
     */
    async invalidateUser(userId) {
        const pattern = `user:${userId}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }

    /**
     * Track API usage for rate limiting
     */
    async incrementAPIUsage(userId) {
        const key = `rate:${userId}:${new Date().toDateString()}`;
        const count = await redis.incr(key);
        await redis.expire(key, 86400); // Expire after 24 hours
        return count;
    }

    async getAPIUsage(userId) {
        const key = `rate:${userId}:${new Date().toDateString()}`;
        const count = await redis.get(key);
        return parseInt(count || '0');
    }
}

module.exports = {
    redis,
    cache: new Cache()
};
