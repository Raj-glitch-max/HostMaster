const { scanQueue, alertQueue } = require('./services/queue');
const AWSScanner = require('./services/awsScanner');
const alertSystem = require('./services/alertSystem');
const recommendationEngine = require('./services/recommendationEngine');
const { query } = require('./config/database');
const logger = require('./utils/logger');

/**
 * Process AWS scan jobs
 */
scanQueue.process(async (job) => {
    const { accountId, userId } = job.data;

    logger.info('Processing scan job', { jobId: job.id, accountId });

    try {
        // Update job progress
        job.progress(10);

        // Get account credentials from database
        const accountResult = await query(
            `SELECT aws_access_key_encrypted, aws_secret_key_encrypted, aws_region
       FROM accounts WHERE id = $1`,
            [accountId]
        );

        if (accountResult.rows.length === 0) {
            throw new Error('Account not found');
        }

        const account = accountResult.rows[0];

        // TODO: Decrypt credentials (add encryption later)
        const accessKey = account.aws_access_key_encrypted;
        const secretKey = account.aws_secret_key_encrypted;
        const region = account.aws_region || 'us-east-1';

        // Initialize AWS scanner
        const scanner = new AWSScanner(accessKey, secretKey, region);

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
 * Send email alert (placeholder - integrate with SendGrid/AWS SES)
 */
async function sendEmailAlert(userId, title, message, level) {
    // Get user email
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    const email = userResult.rows[0]?.email;

    if (!email) {
        throw new Error('User email not found');
    }

    // TODO: Integrate with SendGrid or AWS SES
    logger.info('Email alert', { email, title, message, level });

    // For now, just log
    console.log(`
    ========================================
    EMAIL ALERT (${level})
    To: ${email}
    Subject: ${title}
    Message: ${message}
    ========================================
  `);
}

/**
 * Send Slack alert (placeholder - integrate with Slack webhook)
 */
async function sendSlackAlert(userId, title, message, level) {
    // Get user's Slack webhook URL
    const userResult = await query(
        'SELECT slack_webhook_url FROM users WHERE id = $1',
        [userId]
    );
    const webhookUrl = userResult.rows[0]?.slack_webhook_url;

    if (!webhookUrl) {
        logger.warn('No Slack webhook configured', { userId });
        return;
    }

    // TODO: Post to Slack webhook
    logger.info('Slack alert', { userId, title, message, level });

    console.log(`
    ========================================
    SLACK ALERT (${level})
    Title: ${title}
    Message: ${message}
    ========================================
  `);
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
