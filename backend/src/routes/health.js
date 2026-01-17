const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { cache } = require('../config/redis');
const { scanQueue, alertQueue } = require('../services/queue');
const logger = require('../utils/logger');

/**
 * Health Check Routes for Production Monitoring
 * 
 * Endpoints:
 * - GET /health - Simple liveness check
 * - GET /health/ready - Readiness check (dependencies)
 * - GET /health/detailed - Detailed system status
 */

/**
 * @route   GET /health
 * @desc    Basic liveness probe (Kubernetes/Docker)
 * @access  Public
 */
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

/**
 * @route   GET /health/ready
 * @desc    Readiness probe - checks all dependencies
 * @access  Public
 */
router.get('/ready', async (req, res) => {
    const checks = {
        database: false,
        redis: false,
        queues: false
    };

    let allHealthy = true;

    try {
        // Check PostgreSQL connection
        const dbResult = await query('SELECT 1 as test');
        checks.database = dbResult.rows[0].test === 1;
    } catch (error) {
        logger.error('Database health check failed', { error: error.message });
        checks.database = false;
        allHealthy = false;
    }

    try {
        // Check Redis connection
        const redis = cache.client;
        const pingResult = await redis.ping();
        checks.redis = pingResult === 'PONG';
    } catch (error) {
        logger.error('Redis health check failed', { error: error.message });
        checks.redis = false;
        allHealthy = false;
    }

    try {
        // Check Bull queues
        const scanQueueStatus = await scanQueue.getJobCounts();
        const alertQueueStatus = await alertQueue.getJobCounts();

        checks.queues = {
            scan: scanQueueStatus,
            alert: alertQueueStatus,
            healthy: true
        };
    } catch (error) {
        logger.error('Queue health check failed', { error: error.message });
        checks.queues = { healthy: false, error: error.message };
        allHealthy = false;
    }

    const status = allHealthy ? 200 : 503;

    res.status(status).json({
        status: allHealthy ? 'ready' : 'not_ready',
        checks,
        timestamp: new Date().toISOString()
    });
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health status for dashboards
 * @access  Public (but should be protected in production)
 */
router.get('/detailed', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };

        // System metrics
        health.system = {
            memory: {
                used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
                total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
                unit: 'MB'
            },
            cpu: process.cpuUsage(),
            pid: process.pid,
            platform: process.platform,
            nodeVersion: process.version
        };

        // Database health
        try {
            const dbStart = Date.now();
            const dbResult = await query('SELECT COUNT(*) as user_count FROM users');
            const dbLatency = Date.now() - dbStart;

            health.database = {
                status: 'connected',
                latency: `${dbLatency}ms`,
                userCount: parseInt(dbResult.rows[0].user_count)
            };
        } catch (error) {
            health.database = {
                status: 'error',
                error: error.message
            };
            health.status = 'degraded';
        }

        // Redis health
        try {
            const redis = cache.client;
            const redisStart = Date.now();
            await redis.ping();
            const redisLatency = Date.now() - redisStart;

            const redisInfo = await redis.info('memory');
            const memoryMatch = redisInfo.match(/used_memory_human:(.+)/);

            health.redis = {
                status: 'connected',
                latency: `${redisLatency}ms`,
                memoryUsed: memoryMatch ? memoryMatch[1].trim() : 'unknown'
            };
        } catch (error) {
            health.redis = {
                status: 'error',
                error: error.message
            };
            health.status = 'degraded';
        }

        // Queue health
        try {
            const [scanCounts, alertCounts] = await Promise.all([
                scanQueue.getJobCounts(),
                alertQueue.getJobCounts()
            ]);

            health.queues = {
                scan: scanCounts,
                alert: alertCounts
            };

            // Warn if too many jobs waiting
            if (scanCounts.waiting > 50) {
                health.warnings = health.warnings || [];
                health.warnings.push(`High scan queue: ${scanCounts.waiting} jobs waiting`);
            }

            if (scanCounts.failed > 10) {
                health.warnings = health.warnings || [];
                health.warnings.push(`Many failed scans: ${scanCounts.failed} jobs failed`);
            }
        } catch (error) {
            health.queues = {
                status: 'error',
                error: error.message
            };
            health.status = 'degraded';
        }

        res.json(health);
    } catch (error) {
        logger.error('Detailed health check failed', { error: error.message });
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
