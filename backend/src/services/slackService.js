const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Slack Service using Incoming Webhooks
 * 
 * Features:
 * - Slack message delivery with rich formatting
 * - Retry logic for failed deliveries
 * - Block-based message design
 * - Error handling
 * 
 * Setup:
 * 1. Create Slack workspace (free)
 * 2. Add Incoming Webhooks app
 * 3. Get webhook URL
 * 4. Users can add their webhook URL in settings
 */

class SlackService {
    /**
     * Send cost alert to Slack
     */
    async sendCostAlert(webhookUrl, alert, user) {
        if (!webhookUrl) {
            logger.warn('Slack alert not sent - no webhook URL');
            return { success: false, reason: 'no_webhook' };
        }

        const message = this.formatCostAlert(alert, user);
        return await this.sendWithRetry(webhookUrl, message);
    }

    /**
     * Send test notification
     */
    async sendTestNotification(webhookUrl, userName) {
        const message = {
            text: '🎉 HostMaster Slack Integration Test',
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '🎉 Integration Successful!'
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `Hey *${userName}*! Your Slack integration is working perfectly. You'll now receive AWS cost alerts here.`
                    }
                },
                {
                    type: 'divider'
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: '🤖 Sent by *HostMaster*'
                        }
                    ]
                }
            ]
        };

        return await this.sendWithRetry(webhookUrl, message);
    }

    /**
     * Format cost alert for Slack
     */
    formatCostAlert(alert, user) {
        const severityEmojis = {
            critical: '🚨',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const severityColors = {
            critical: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };

        const emoji = severityEmojis[alert.level] || severityEmojis.info;
        const color = severityColors[alert.level] || severityColors.info;

        return {
            text: `${emoji} AWS Cost Alert: ${alert.title}`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `${emoji} ${alert.title}`
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: alert.message
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Current Cost:*\n$${alert.current_value}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Threshold:*\n$${alert.threshold}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Severity:*\n${alert.level.toUpperCase()}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Account:*\n${user.name}`
                        }
                    ]
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: '📊 View Dashboard'
                            },
                            url: `${process.env.APP_URL || 'https://app.hostmaster.com'}/dashboard`,
                            style: 'primary'
                        },
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: '⚙️ Alert Settings'
                            },
                            url: `${process.env.APP_URL || 'https://app.hostmaster.com'}/settings/alerts`
                        }
                    ]
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `🤖 Sent by *HostMaster* • ${new Date().toLocaleString()}`
                        }
                    ]
                }
            ],
            attachments: [
                {
                    color: color,
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `Exceeds threshold by *$${(alert.current_value - alert.threshold).toFixed(2)}* (${(((alert.current_value - alert.threshold) / alert.threshold) * 100).toFixed(1)}%)`
                            }
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Send message with retry logic
     */
    async sendWithRetry(webhookUrl, message, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await axios.post(webhookUrl, message, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                });

                if (response.status === 200 && response.data === 'ok') {
                    logger.info('Slack message sent successfully', {
                        attempt,
                        status: response.status
                    });

                    return {
                        success: true,
                        attempt
                    };
                } else {
                    throw new Error(`Unexpected response: ${response.data}`);
                }
            } catch (error) {
                logger.error('Slack message send failed', {
                    attempt,
                    error: error.message,
                    status: error.response?.status
                });

                // Check if webhook URL is invalid (non-retryable)
                if (error.response?.status === 404 || error.response?.status === 400) {
                    return {
                        success: false,
                        error: 'Invalid webhook URL',
                        code: error.response.status,
                        attempt
                    };
                }

                if (attempt === retries) {
                    return {
                        success: false,
                        error: error.message,
                        code: error.response?.status,
                        attempt
                    };
                }

                // Exponential backoff
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
    }

    /**
     * Validate webhook URL format
     */
    isValidWebhookUrl(url) {
        if (!url) return false;

        try {
            const parsed = new URL(url);
            return (
                parsed.protocol === 'https:' &&
                parsed.hostname === 'hooks.slack.com' &&
                parsed.pathname.startsWith('/services/')
            );
        } catch {
            return false;
        }
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new SlackService();
