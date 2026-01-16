const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const recommendationEngine = require('../services/recommendationEngine');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/costs
 * @desc    Get cost analysis - REAL DATABASE
 */
router.get('/', async (req, res) => {
    try {
        const userId = 'demo-user-id'; // TODO: Get from JWT

        logger.info('Fetching cost analysis', { userId });

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

        res.json({
            currentMonth: currentMonthData,
            forecast: {
                nextMonth: parseFloat(nextMonth.toFixed(2)),
                threeMonths: parseFloat(threeMonths.toFixed(2))
            },
            recommendations: recommendations.map(r => ({
                type: r.type,
                resource: r.resource_name,
                action: r.action,
                currentCost: parseFloat(r.current_cost),
                recommendedCost: parseFloat(r.recommended_cost),
                savings: parseFloat(r.savings)
            }))
        });
    } catch (error) {
        logger.error('Error fetching costs', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch cost data' });
    }
});

/**
 * @route   POST /api/v1/costs/generate-recommendations
 * @desc    Generate recommendations - REAL ML ENGINE
 */
router.post('/generate-recommendations', async (req, res) => {
    try {
        const userId = 'demo-user-id';

        const recommendations = await recommendationEngine.generateRecommendations(userId);

        res.json({
            message: 'Recommendations generated',
            count: recommendations.length,
            totalSavings: recommendations.reduce((sum, r) => sum + parseFloat(r.savings), 0).toFixed(2)
        });
    } catch (error) {
        logger.error('Error generating recommendations', { error: error.message });
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

module.exports = router;
