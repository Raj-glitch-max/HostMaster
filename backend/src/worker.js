const { scanQueue, alertQueue } = require('./services/queue');
const AWSScanner = require('./services/awsScanner');
const alertSystem = require('./services/alertSystem');
const recommendationEngine = require('./services/recommendationEngine');
const { query } = require('./config/database');
const { decrypt } = require('./utils/encryption');
const logger = require('./utils/logger');
const emailService = require('./services/emailService');
const slackService = require('./services/slackService');

/**
 * Process AWS scan jobs
 */
scanQueue.process(async (job) => {
    const { accountId, userId, accessKeyId, secretAccessKey, region } = job.data;

    logger.info('Processing scan job', { jobId: job.id, accountId, userId });

    try {
        // Update job progress
        job.progress(10);

        // ✅ CRITICAL FIX: Decrypt AWS credentials from job data
        logger.info('Decrypting AWS credentials', { userId });

        const decryptedAccessKey = decrypt(accessKeyId);
        const decryptedSecretKey = decrypt(secretAccessKey);

        logger.info('AWS credentials decrypted successfully', {
            userId,
            accessKeyLength: decryptedAccessKey.length
        });

        // Initialize AWS scanner with DECRYPTED credentials
        const scanner = new AWSScanner(
            decryptedAccessKey,
            decryptedSecretKey,
            region || 'us-east-1'
        );

        job.progress(20);

        // Scan EC2 instances
        logger.info('Scanning EC2 instances', { accountId });
        const ec2Instances = await scanner.scanEC2Instances(userId);
        job.progress(50);

        // Scan RDS instances
        logger.info('Scanning RDS instances', { accountId });
        const rdsInstances = await scanner.scanRDSInstances(userId);
        job.progress(70);

        // Get real costs from AWS Cost Explorer
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];

        const costs = await scanner.getRealCosts(userId, startDate, endDate);
        job.progress(85);

        // Generate recommendations
        logger.info('Generating recommendations', { userId });
        const recommendations = await recommendationEngine.generateRecommendations(userId);
        job.progress(95);

        // Check for alerts
        await alertSystem.checkAlerts(userId);

        // Update scan status
        await query(
            `UPDATE scan_jobs 
       SET status = 'completed', completed_at = NOW(), resource_count = $1
       WHERE id = $2`,
            [ec2Instances.length + rdsInstances.length, job.data.scanJobId]
        );

        job.progress(100);

        logger.info('Scan completed', {
            jobId: job.id,
            accountId,
            resourcesFound: ec2Instances.length + rdsInstances.length,
            recommendationsGenerated: recommendations.length
        });

        return {
            status: 'completed',
            resourcesFound: ec2Instances.length + rdsInstances.length,
            totalCost: costs.totalCost,
            recommendations: recommendations.length
        };
    } catch (error) {
        logger.error('Scan failed', { jobId: job.id, error: error.message, stack: error.stack });

        // Update scan status to failed
        await query(
            `UPDATE scan_jobs 
       SET status = 'failed', completed_at = NOW(), errors = ARRAY[$1]
       WHERE id = $2`,
            [error.message, job.data.scanJobId]
        );

        throw error;
    }
});

/**
 * Process alert delivery jobs
 */
alertQueue.process(async (job) => {
    const { userId, channel, title, message, level } = job.data;

    logger.info('Processing alert', { jobId: job.id, userId, channel, level });

    try {
        switch (channel) {
            case 'email':
                await sendEmailAlert(userId, title, message, level);
                break;
            case 'slack':
                await sendSlackAlert(userId, title, message, level);
                break;
            case 'sms':
                await sendSMSAlert(userId, title, message, level);
                break;
            case 'dashboard':
                // Already saved in database
                break;
            default:
                logger.warn('Unknown alert channel', { channel });
        }

        logger.info('Alert delivered', { jobId: job.id, userId, channel });
        return { status: 'delivered', channel };
    } catch (error) {
        logger.error('Alert delivery failed', { jobId: job.id, error: error.message });
        throw error;
    }
});

/**
 * Send email alert using SendGrid
 */
async function sendEmailAlert(userId, title, message, level) {
    // Get user details
    const userResult = await query(
        'SELECT id, email, name FROM users WHERE id = $1',
        [userId]
    );
    const user = userResult.rows[0];

    if (!user) {
        throw new Error('User not found');
    }

    // Create alert object
    const alert = {
        id: null, // Set if you have alert ID
        title,
        message,
        level,
        current_value: 0, // Update with real value if available
        threshold: 0 // Update with real threshold if available
    };

    try {
        const result = await emailService.sendCostAlert(user, alert);

        if (result.success) {
            logger.info('Email alert sent successfully', {
                userId,
                email: user.email,
                messageId: result.messageId
            });
        } else {
            logger.error('Email alert failed to send', {
                userId,
                email: user.email,
                reason: result.reason || result.error
            });
        }

        return result;
    } catch (error) {
        logger.error('Email alert error', {
            userId,
            error: error.message
        });
        throw error;
    }
}

/**
 * Send Slack alert using webhook
 */
async function sendSlackAlert(userId, title, message, level) {
    // Get user's Slack webhook URL
    const userResult = await query(
        'SELECT id, name, slack_webhook_url FROM users WHERE id = $1',
        [userId]
    );
    const user = userResult.rows[0];

    if (!user || !user.slack_webhook_url) {
        logger.warn('No Slack webhook configured', { userId });
        return { success: false, reason: 'no_webhook' };
    }

    // Create alert object
    const alert = {
        id: null,
        title,
        message,
        level,
        current_value: 0, // Update with real value if available
        threshold: 0 // Update with real threshold if available
    };

    try {
        const result = await slackService.sendCostAlert(
            user.slack_webhook_url,
            alert,
            user
        );

        if (result.success) {
            logger.info('Slack alert sent successfully', {
                userId,
                attempt: result.attempt
            });
        } else {
            logger.error('Slack alert failed to send', {
                userId,
                reason: result.reason || result.error
            });
        }

        return result;
    } catch (error) {
        logger.error('Slack alert error', {
            userId,
            error: error.message
        });
        throw error;
    }
}

/**
 * Send SMS alert (placeholder - integrate with Twilio/AWS SNS)
 */
async function sendSMSAlert(userId, title, message, level) {
    // Get user's phone number
    const userResult = await query('SELECT phone_number FROM users WHERE id = $1', [userId]);
    const phone = userResult.rows[0]?.phone_number;

    if (!phone) {
        logger.warn('No phone number configured', { userId });
        return;
    }

    // TODO: Send via Twilio or AWS SNS
    logger.info('SMS alert', { phone, title, message, level });

    console.log(`
    ========================================
    SMS ALERT (${level})
    To: ${phone}
    Message: ${title} - ${message}
    ========================================
  `);
}

logger.info('Worker started - processing scan and alert jobs');
