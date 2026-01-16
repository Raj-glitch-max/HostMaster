const Queue = require('bull');
const logger = require('../utils/logger');

// Create job queues
const scanQueue = new Queue('aws-scans', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    }
});

const alertQueue = new Queue('alerts', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    }
});

// Queue event handlers
scanQueue.on('completed', (job, result) => {
    logger.info('Scan job completed', { jobId: job.id, accountId: job.data.accountId, result });
});

scanQueue.on('failed', (job, err) => {
    logger.error('Scan job failed', { jobId: job.id, error: err.message });
});

alertQueue.on('completed', (job) => {
    logger.info('Alert sent', { jobId: job.id, userId: job.data.userId });
});

/**
 * Add AWS scan job to queue
 */
async function addScanJob(accountId, options = {}) {
    const job = await scanQueue.add(
        { accountId, ...options },
        {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: 100, // Keep last 100 completed jobs
            removeOnFail: false // Keep failed jobs for debugging
        }
    );

    logger.info('Scan job queued', { jobId: job.id, accountId });
    return job;
}

/**
 * Schedule recurring scans
 */
async function scheduleRecurringScan(accountId, intervalMinutes) {
    const job = await scanQueue.add(
        { accountId },
        {
            repeat: {
                every: intervalMinutes * 60 * 1000 // Convert to milliseconds
            },
            jobId: `recurring-scan-${accountId}` // Prevents duplicates
        }
    );

    logger.info('Recurring scan scheduled', { accountId, intervalMinutes });
    return job;
}

/**
 * Remove recurring scan
 */
async function removeRecurringScan(accountId) {
    await scanQueue.removeRepeatable({
        jobId: `recurring-scan-${accountId}`
    });

    logger.info('Recurring scan removed', { accountId });
}

/**
 * Add alert to queue
 */
async function addAlertJob(userId, alertData) {
    const job = await alertQueue.add(
        { userId, ...alertData },
        {
            attempts: 2,
            backoff: 1000
        }
    );

    logger.info('Alert job queued', { jobId: job.id, userId });
    return job;
}

/**
 * Get scan job status
 */
async function getScanJobStatus(jobId) {
    const job = await scanQueue.getJob(jobId);
    if (!job) return null;

    return {
        id: job.id,
        status: await job.getState(),
        progress: job.progress(),
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason
    };
}

module.exports = {
    scanQueue,
    alertQueue,
    addScanJob,
    scheduleRecurringScan,
    removeRecurringScan,
    addAlertJob,
    getScanJobStatus
};
