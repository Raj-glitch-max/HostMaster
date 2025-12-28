const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/recommendations
 * @desc    Get cost optimization recommendations for user
 */
router.get('/', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            `SELECT r.*, ar.resource_name, ar.resource_type, ar.instance_type, ar.region
             FROM recommendations r
             LEFT JOIN aws_resources ar ON r.resource_id = ar.id
             WHERE r.user_id = $1 AND r.status = 'pending'
             ORDER BY r.savings DESC`,
            [userId]
        );

        const recommendations = result.rows.map(rec => ({
            id: rec.id,
            type: rec.type,
            title: rec.title,
            description: rec.description,
            action: rec.action,
            currentCost: parseFloat(rec.current_cost),
            recommendedCost: parseFloat(rec.recommended_cost),
            savings: parseFloat(rec.savings),
            confidenceScore: parseFloat(rec.confidence_score),
            resourceName: rec.resource_name,
            resourceType: rec.resource_type,
            instanceType: rec.instance_type,
            region: rec.region,
            createdAt: rec.created_at
        }));

        const totalSavings = recommendations.reduce((sum, rec) => sum + rec.savings, 0);

        res.json({
            recommendations,
            totalSavings: totalSavings.toFixed(2),
            count: recommendations.length
        });

    } catch (error) {
        logger.error('Error fetching recommendations', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

/**
 * @route   PATCH /api/v1/recommendations/:id/dismiss
 * @desc    Dismiss a recommendation
 */
router.patch('/:id/dismiss', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await query(
            `UPDATE recommendations 
             SET status = 'dismissed'
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.json({ message: 'Recommendation dismissed' });

    } catch (error) {
        logger.error('Error dismissing recommendation', { error: error.message });
        res.status(500).json({ error: 'Failed to dismiss recommendation' });
    }
});

/**
 * @route   PATCH /api/v1/recommendations/:id/accept
 * @desc    Mark recommendation as accepted
 */
router.patch('/:id/accept', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await query(
            `UPDATE recommendations 
             SET status = 'applied', applied_at = NOW()
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.json({ message: 'Recommendation accepted' });

    } catch (error) {
        logger.error('Error accepting recommendation', { error: error.message });
        res.status(500).json({ error: 'Failed to accept recommendation' });
    }
});

module.exports = router;
