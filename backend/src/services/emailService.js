const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

/**
 * Email Service using SendGrid
 * 
 * Features:
 * - Email delivery with retries
 * - Template support
 * - Delivery status tracking
 * - Error handling
 * 
 * Setup:
 * 1. Sign up for SendGrid (free tier: 100 emails/day)
 * 2. Get API key from Settings → API Keys
 * 3. Add to .env:  
 *    SENDGRID_API_KEY=SG.xxxxx
 *    FROM_EMAIL=noreply@hostmaster.com
 */

class EmailService {
    constructor() {
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            this.enabled = true;
            logger.info('Email service initialized with SendGrid');
        } else {
            this.enabled = false;
            logger.warn('Email service disabled - SENDGRID_API_KEY not set');
        }

        this.fromEmail = process.env.FROM_EMAIL || 'noreply@hostmaster.com';
    }

    /**
     * Send cost alert email
     */
    async sendCostAlert(user, alert) {
        if (!this.enabled) {
            logger.warn('Email not sent - service disabled', {
                userId: user.id,
                alertId: alert.id
            });
            return { success: false, reason: 'service_disabled' };
        }

        const msg = {
            to: user.email,
            from: {
                email: this.fromEmail,
                name: 'HostMaster'
            },
            subject: `🚨 AWS Cost Alert: ${alert.title}`,
            text: this.generateTextContent(alert),
            html: this.generateHTMLContent(alert, user),
            customArgs: {
                userId: user.id.toString(),
                alertId: alert.id?.toString() || 'unknown'
            }
        };

        return await this.sendWithRetry(msg, user.id);
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(user) {
        if (!this.enabled) {
            return { success: false, reason: 'service_disabled' };
        }

        const msg = {
            to: user.email,
            from: {
                email: this.fromEmail,
                name: 'HostMaster'
            },
            subject: 'Welcome to HostMaster!',
            text: `Hi ${user.name},\n\nWelcome to HostMaster! Start by adding your AWS credentials to begin monitoring your cloud costs.\n\nBest regards,\nThe HostMaster Team`,
            html: `
        <h2>Welcome to HostMaster, ${user.name}!</h2>
        <p>You're all set to start optimizing your AWS costs.</p>
        <h3>Next Steps:</h3>
        <ol>
          <li>Add your AWS credentials</li>
          <li>Run your first scan</li>
          <li>Set up cost alerts</li>
        </ol>
        <p><a href="${process.env.APP_URL || 'https://app.hostmaster.com'}/dashboard" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a></p>
        <p style="color: #666; font-size: 14px;">Need help? Reply to this email or visit our <a href="${process.env.APP_URL || 'https://app.hostmaster.com'}/docs">documentation</a>.</p>
      `
        };

        return await this.sendWithRetry(msg, user.id);
    }

    /**
     * Send email with automatic retry
     */
    async sendWithRetry(msg, userId, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await sgMail.send(msg);

                logger.info('Email sent successfully', {
                    userId,
                    to: msg.to,
                    subject: msg.subject,
                    attempt,
                    messageId: response[0].headers['x-message-id']
                });

                return {
                    success: true,
                    messageId: response[0].headers['x-message-id'],
                    attempt
                };
            } catch (error) {
                logger.error('Email send failed', {
                    userId,
                    to: msg.to,
                    subject: msg.subject,
                    attempt,
                    error: error.message,
                    code: error.code
                });

                if (attempt === retries || this.isNonRetryableError(error)) {
                    return {
                        success: false,
                        error: error.message,
                        code: error.code,
                        attempt
                    };
                }

                // Wait before retry (exponential backoff)
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
    }

    /**
     * Check if error should not be retried
     */
    isNonRetryableError(error) {
        const nonRetryableCodes = [400, 401, 403, 404];
        return nonRetryableCodes.includes(error.code);
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate plain text email content
     */
    generateTextContent(alert) {
        return `
HostMaster Cost Alert

${alert.title}

${alert.message}

Current Value: $${alert.current_value}
Threshold: $${alert.threshold}
Severity: ${alert.level}

View your dashboard: ${process.env.APP_URL || 'https://app.hostmaster.com'}/dashboard

---
This is an automated alert from HostMaster.
To manage your alert settings, visit your dashboard.
    `.trim();
    }

    /**
     * Generate HTML email content
     */
    generateHTMLContent(alert, user) {
        const severityColors = {
            critical: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };

        const color = severityColors[alert.level] || severityColors.info;

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HostMaster Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">HostMaster</h1>
            </td>
          </tr>
          
          <!-- Alert Badge -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <div style="background-color: ${color}; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                ${alert.level} Alert
              </div>
            </td>
          </tr>
          
          <!-- Alert Title -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <h2 style="margin: 0; font-size: 20px; color: #111827;">${alert.title}</h2>
            </td>
          </tr>
          
          <!-- Alert Message -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0; color: #4B5563; font-size: 16px; line-height: 1.6;">${alert.message}</p>
            </td>
          </tr>
          
          <!-- Alert Details -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 6px; padding: 20px;">
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="color: #6B7280; font-size: 14px; margin-bottom: 4px;">Current Value</div>
                    <div style="color: #111827; font-size: 24px; font-weight: 600;">$${alert.current_value}</div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="color: #6B7280; font-size: 14px; margin-bottom: 4px;">Threshold</div>
                    <div style="color: #111827; font-size: 24px; font-weight: 600;">$${alert.threshold}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 30px;" align="center">
              <a href="${process.env.APP_URL || 'https://app.hostmaster.com'}/dashboard" style="background-color: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">View Dashboard</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; color: #6B7280; font-size: 14px; text-align: center;">
                This is an automated alert from HostMaster.<br>
                <a href="${process.env.APP_URL || 'https://app.hostmaster.com'}/settings/alerts" style="color: #4F46E5; text-decoration: none;">Manage alert settings</a>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Unsubscribe -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td align="center">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                © 2026 HostMaster. All rights reserved.<br>
                <a href="${process.env.APP_URL || 'https://app.hostmaster.com'}/unsubscribe?email=${user.email}" style="color: #9CA3AF; text-decoration: underline;">Unsubscribe from alerts</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
    }
}

module.exports = new EmailService();
