const { query } = require('../config/database');
const { addAlertJob } = require('./queue');
const logger = require('../utils/logger');

class AlertSystem {
    /**
     * Check and trigger alerts based on user budget and thresholds
     */
    async checkAlerts(userId) {
        try {
            // Get user's alert settings
            const userSettings = await query(
                `SELECT tier, budget, alert_email, alert_slack, alert_sms 
         FROM users WHERE id = $1`,
                [userId]
            );

            if (userSettings.rows.length === 0) return;

            const settings = userSettings.rows[0];
            const budget = parseFloat(settings.budget || 0);

            // Get current month costs
            const currentMonth = new Date().toISOString().substring(0, 7);
            const costResult = await query(
                `SELECT total_cost FROM cost_history 
         WHERE user_id = $1 AND month = $2`,
                [userId, currentMonth]
            );

            const currentCost = parseFloat(costResult.rows[0]?.total_cost || 0);

            // Calculate percentage over budget
            if (budget > 0) {
                const percentOver = ((currentCost - budget) / budget) * 100;

                // CRITICAL: 30%+ over budget
                if (percentOver >= 30) {
                    await this.sendAlert({
                        userId,
                        level: 'CRITICAL',
                        channels: this.getChannels(settings, 'CRITICAL'),
                        title: '🚨 CRITICAL: Budget Exceeded by 30%+',
                        message: `Your AWS spending is $${currentCost.toFixed(2)}, which is ${percentOver.toFixed(1)}% over your budget of $${budget.toFixed(2)}.`,
                        data: { currentCost, budget, percentOver }
                    });
                }
                // WARNING: 10-30% over budget
                else if (percentOver >= 10) {
                    // Only send if haven't alerted in last 6 hours
                    const recentAlert = await this.getRecentAlert(userId, 'WARNING', 6);
                    if (!recentAlert) {
                        await this.sendAlert({
                            userId,
                            level: 'WARNING',
                            channels: this.getChannels(settings, 'WARNING'),
                            title: '⚠️ WARNING: Budget Exceeded',
                            message: `Your AWS spending is $${currentCost.toFixed(2)}, ${percentOver.toFixed(1)}% over budget.`,
                            data: { currentCost, budget, percentOver }
                        });
                    }
                }
            }

            // Check for expensive resources
            await this.checkExpensiveResources(userId, settings);
        } catch (error) {
            logger.error('Error checking alerts', { error: error.message, userId });
        }
    }

    /**
     * Check for single expensive resources
     */
    async checkExpensiveResources(userId, settings) {
        const tier = settings.tier || 'free';

        // Thresholds based on tier
        const thresholds = {
            free: { critical: 100, warning: 50 },
            professional: { critical: 500, warning: 200 },
            enterprise: { critical: 2000, warning: 1000 }
        };

        const threshold = thresholds[tier];

        // Find expensive resources
        const expensiveResources = await query(
            `SELECT resource_id, resource_name, resource_type, monthly_cost
       FROM aws_resources
       WHERE user_id = $1 AND monthly_cost >= $2
       ORDER BY monthly_cost DESC
       LIMIT 5`,
            [userId, threshold.critical]
        );

        for (const resource of expensiveResources.rows) {
            const cost = parseFloat(resource.monthly_cost);

            await this.sendAlert({
                userId,
                level: 'CRITICAL',
                channels: this.getChannels(settings, 'CRITICAL'),
                title: `💸 Expensive Resource Detected`,
                message: `Resource ${resource.resource_name} (${resource.resource_type}) costs $${cost.toFixed(2)}/month`,
                data: { resourceId: resource.resource_id, cost }
            });
        }
    }

    /**
     * Send alert via appropriate channels
     */
    async sendAlert(alertData) {
        const { userId, level, channels, title, message, data } = alertData;

        // Save alert to database
        await query(
            `INSERT INTO alerts (user_id, alert_type, title, message, severity, is_read)
       VALUES ($1, $2, $3, $4, $5, false)`,
            [userId, 'cost_alert', title, message, level.toLowerCase()]
        );

        // Queue alert for delivery
        for (const channel of channels) {
            await addAlertJob(userId, {
                channel,
                level,
                title,
                message,
                data
            });
        }

        logger.info('Alert sent', { userId, level, channels, title });
    }

    /**
     * Get alert channels based on user settings and alert level
     */
    getChannels(settings, level) {
        const channels = ['dashboard']; // Always show in dashboard

        if (level === 'CRITICAL') {
            if (settings.alert_email) channels.push('email');
            if (settings.alert_slack) channels.push('slack');
            if (settings.alert_sms) channels.push('sms');
        } else if (level === 'WARNING') {
            if (settings.alert_email) channels.push('email');
            if (settings.alert_slack) channels.push('slack');
        }
        // INFO level: dashboard only

        return channels;
    }

    /**
     * Check if user was recently alerted
     */
    async getRecentAlert(userId, level, hours) {
        const result = await query(
            `SELECT id FROM alerts
       WHERE user_id = $1 
       AND severity = $2
       AND created_at > NOW() - INTERVAL '${hours} hours'
       LIMIT 1`,
            [userId, level.toLowerCase()]
        );

        return result.rows.length > 0;
    }

    /**
     * Mark alert as read
     */
    async markAsRead(alertId, userId) {
        await query(
            `UPDATE alerts SET is_read = true WHERE id = $1 AND user_id = $2`,
            [alertId, userId]
        );
    }

    /**
     * Get unread alerts for user
     */
    async getUnreadAlerts(userId) {
        const result = await query(
            `SELECT id, alert_type, title, message, severity, created_at
       FROM alerts
       WHERE user_id = $1 AND is_read = false
       ORDER BY created_at DESC
       LIMIT 20`,
            [userId]
        );

        return result.rows;
    }
}

module.exports = new AlertSystem();
