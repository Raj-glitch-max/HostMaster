const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { cache } = require('../config/redis');
const recommendationEngine = require('../services/recommendationEngine');
const alertSystem = require('../services/alertSystem');
const { verifyJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/costs
 * @desc    Get cost analysis - WITH CACHING AND ALERTS
 * @access  Private (requires JWT)
 */
router.get('/', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id; // ✅ FIXED: From JWT

        logger.info('Fetching cost analysis', { userId });

        // Check cache first
        const cacheKey = `costs:${userId}`;
        const cached = await cache.getAccountCost(userId);
        if (cached) {
            logger.info('Serving costs from cache', { userId });
            return res.json(cached);
        }

        // Get current month costs from database
        const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

        const costResult = await query(
            `SELECT total_cost, cost_by_service, cost_by_region
       FROM cost_history
       WHERE user_id = $1 AND month = $2`,
            [userId, currentMonth]
        );

        let currentMonthData = {
            total: 0,
            byService: {},
            byRegion: {}
        };

        if (costResult.rows.length > 0) {
            const row = costResult.rows[0];
            currentMonthData = {
                total: parseFloat(row.total_cost),
                byService: row.cost_by_service,
                byRegion: row.cost_by_region
            };
        } else {
            // Fallback: Calculate from resources
            const resourceResult = await query(
                `SELECT resource_type, SUM(monthly_cost) as total
         FROM aws_resources
         WHERE user_id = $1 AND state = 'running'
         GROUP BY resource_type`,
                [userId]
            );

            resourceResult.rows.forEach(row => {
                const cost = parseFloat(row.total);
                currentMonthData.byService[row.resource_type.toUpperCase()] = cost;
                currentMonthData.total += cost;
            });
            currentMonthData.byRegion['us-east-1'] = currentMonthData.total;
        }

        // Get recommendations
        const recommendations = await recommendationEngine.getRecommendations(userId);

        // Calculate forecast (simple: +5% per month)
        const nextMonth = currentMonthData.total * 1.05;
        const threeMonths = currentMonthData.total * 3 * 1.05;

        const response = {
            currentMonth: currentMonthData,
            forecast: {
                nextMonth: parseFloat(nextMonth.toFixed(2)),
                threeMonths: parseFloat(threeMonths.toFixed(2))
            },
            recommendations: recommendations.map(r => ({
                id: r.id,
                type: r.type,
                resource: r.resource_name,
                action: r.action,
                currentCost: parseFloat(r.current_cost),
                recommendedCost: parseFloat(r.recommended_cost),
                savings: parseFloat(r.savings),
                confidenceScore: parseFloat(r.confidence_score)
            }))
        };

        // Cache for 1 hour
        await cache.setAccountCost(userId, response);

        // Check for alerts (async, don't wait)
        alertSystem.checkAlerts(userId).catch(err => {
            logger.error('Alert check failed', { error: err.message, userId });
        });

        res.json(response);
    } catch (error) {
        logger.error('Error fetching costs', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to fetch cost data' });
    }
});

/**
 * @route   POST /api/v1/costs/generate-recommendations
 * @desc    Generate recommendations - REAL ML ENGINE
 * @access  Private (requires JWT)
 */
router.post('/generate-recommendations', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id; // ✅ FIXED: From JWT

        logger.info('Generating recommendations', { userId });

        const recommendations = await recommendationEngine.generateRecommendations(userId);

        // Invalidate costs cache
        await cache.invalidateUser(userId);

        res.json({
            message: 'Recommendations generated',
            count: recommendations.length,
            totalSavings: recommendations.reduce((sum, r) => sum + parseFloat(r.savings), 0).toFixed(2),
            recommendations: recommendations.map(r => ({
                type: r.type,
                action: r.action,
                savings: parseFloat(r.savings)
            }))
        });
    } catch (error) {
        logger.error('Error generating recommendations', { error: error.message });
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

/**
 * @route   GET /api/v1/costs/alerts
 * @desc    Get unread alerts
 * @access  Private (requires JWT)
 */
router.get('/alerts', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id; // ✅ FIXED: From JWT

        const alerts = await alertSystem.getUnreadAlerts(userId);

        res.json({ alerts });
    } catch (error) {
        logger.error('Error fetching alerts', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

/**
 * @route   POST /api/v1/costs/alerts/:id/read
 * @desc    Mark alert as read
 * @access  Private (requires JWT)
 */
router.post('/alerts/:id/read', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id; // ✅ FIXED: From JWT
        const { id } = req.params;

        await alertSystem.markAsRead(id, userId);

        res.json({ message: 'Alert marked as read' });
    } catch (error) {
        logger.error('Error marking alert as read', { error: error.message });
        res.status(500).json({ error: 'Failed to mark alert as read' });
    }
});

module.exports = router;
