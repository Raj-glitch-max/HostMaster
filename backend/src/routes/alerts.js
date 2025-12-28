const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/alerts
 * @desc    Get alerts for user
 */
router.get('/', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const { unreadOnly } = req.query;

        let sql = `SELECT id, type, title, message, severity, is_read, created_at
                   FROM alerts
                   WHERE user_id = $1`;

        if (unreadOnly === 'true') {
            sql += ` AND is_read = FALSE`;
        }

        sql += ` ORDER BY created_at DESC LIMIT 50`;

        const result = await query(sql, [userId]);

        const alerts = result.rows.map(alert => ({
            id: alert.id,
            type: alert.type,
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
            isRead: alert.is_read,
            createdAt: alert.created_at
        }));

        const unreadCount = alerts.filter(a => !a.isRead).length;

        res.json({
            alerts,
            unreadCount,
            total: alerts.length
        });

    } catch (error) {
        logger.error('Error fetching alerts', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

/**
 * @route   PATCH /api/v1/alerts/:id/read
 * @desc    Mark alert as read
 */
router.patch('/:id/read', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await query(
            `UPDATE alerts 
             SET is_read = TRUE
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.json({ message: 'Alert marked as read' });

    } catch (error) {
        logger.error('Error marking alert as read', { error: error.message });
        res.status(500).json({ error: 'Failed to mark alert as read' });
    }
});

/**
 * @route   DELETE /api/v1/alerts/:id
 * @desc    Delete an alert
 */
router.delete('/:id', verifyJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await query(
            `DELETE FROM alerts 
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.json({ message: 'Alert deleted' });

    } catch (error) {
        logger.error('Error deleting alert', { error: error.message });
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});

module.exports = router;
