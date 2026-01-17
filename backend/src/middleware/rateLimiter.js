const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redis } = require('../config/redis');
const { cache } = require('../config/redis');

/**
 * Rate limiting by user tier
 */
const TIER_LIMITS = {
    free: {
        apiCallsPerDay: 100,
        scansPerDay: 1,
        maxAccounts: 1
    },
    professional: {
        apiCallsPerDay: 10000,
        scansPerDay: 360, // Every 4 hours = 6/day * 60 days
        maxAccounts: 5
    },
    enterprise: {
        apiCallsPerDay: 100000,
        scansPerDay: 1440, // Hourly = 24/day * 60 days
        maxAccounts: 999
    }
};

/**
 * Global API rate limiter (prevents DDoS)
 */
const globalLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:global:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Tier-based rate limiter middleware
 */
const tierRateLimiter = async (req, res, next) => {
    try {
        const user = req.user; // Assume auth middleware sets this
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const tier = user.tier || 'free';
        const limits = TIER_LIMITS[tier];

        // Check daily API usage
        const usage = await cache.getAPIUsage(user.id);

        if (usage >= limits.apiCallsPerDay) {
            return res.status(429).json({
                error: 'Daily API limit exceeded',
                tier,
                limit: limits.apiCallsPerDay,
                used: usage,
                upgradeUrl: '/pricing'
            });
        }

        // Increment usage
        await cache.incrementAPIUsage(user.id);

        // Add usage info to response headers
        res.setHeader('X-RateLimit-Limit', limits.apiCallsPerDay);
        res.setHeader('X-RateLimit-Remaining', limits.apiCallsPerDay - usage - 1);
        res.setHeader('X-RateLimit-Tier', tier);

        next();
    } catch (error) {
        console.error('Rate limiter error:', error);
        next(); // Fail open (don't block if Redis is down)
    }
};

/**
 * Scan-specific rate limiter
 */
const scanRateLimiter = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const tier = user.tier || 'free';
        const limits = TIER_LIMITS[tier];

        // Check scan usage today
        const key = `scan:usage:${user.id}:${new Date().toDateString()}`;
        const scanCount = parseInt(await redis.get(key) || '0');

        if (scanCount >= limits.scansPerDay) {
            return res.status(429).json({
                error: 'Daily scan limit exceeded',
                tier,
                limit: limits.scansPerDay,
                used: scanCount,
                upgradeUrl: '/pricing'
            });
        }

        // Increment scan count
        await redis.incr(key);
        await redis.expire(key, 86400); // 24 hours

        next();
    } catch (error) {
        console.error('Scan rate limiter error:', error);
        next();
    }
};

/**
 * Check if user can add more accounts
 */
const checkAccountLimit = async (userId, currentCount) => {
    const user = await query('SELECT tier FROM users WHERE id = $1', [userId]);
    const tier = user.rows[0]?.tier || 'free';
    const limit = TIER_LIMITS[tier].maxAccounts;

    return {
        allowed: currentCount < limit,
        limit,
        current: currentCount,
        tier
    };
};

module.exports = {
    globalLimiter,
    tierRateLimiter,
    scanRateLimiter,
    checkAccountLimit,
    TIER_LIMITS
};
