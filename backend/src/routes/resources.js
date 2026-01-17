const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { cache } = require('../config/redis');
const AWSScanner = require('../services/awsScanner');
const { addScanJob, getScanJobStatus } = require('../services/queue');
const { verifyJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/resources
 * @desc    Get all AWS resources - WITH CACHING
 * @access  Private (requires JWT)
 */
router.get('/', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id; // ✅ FIXED: Extracted from JWT token

        logger.info('Fetching AWS resources', { userId });

        // Check cache first
        const cached = await cache.getUserDashboard(userId);
        if (cached) {
            logger.info('Serving from cache', { userId });
            return res.json(cached);
        }

        // Get from database
        const result = await query(
            `SELECT 
        id, resource_type, resource_id, resource_name, region, 
        instance_type, state, monthly_cost, metadata, last_seen_at
       FROM aws_resources 
       WHERE user_id = $1 
       ORDER BY monthly_cost DESC`,
            [userId]
        );

        // Group by type
        const ec2Instances = result.rows.filter(r => r.resource_type === 'ec2');
        const rdsInstances = result.rows.filter(r => r.resource_type === 'rds');

        const totalCost = result.rows.reduce((sum, r) => sum + parseFloat(r.monthly_cost || 0), 0);

        const response = {
            ec2Instances: ec2Instances.map(r => ({
                id: r.resource_id,
                type: r.instance_type,
                state: r.state,
                region: r.region,
                name: r.resource_name,
                monthlyCost: parseFloat(r.monthly_cost),
                metadata: r.metadata
            })),
            rdsInstances: rdsInstances.map(r => ({
                id: r.resource_id,
                type: r.instance_type,
                engine: r.metadata?.engine,
                multiAZ: r.metadata?.multiAZ,
                monthlyCost: parseFloat(r.monthly_cost)
            })),
            totalMonthlyCost: totalCost.toFixed(2)
        };

        // Cache for 30 minutes
        await cache.setUserDashboard(userId, response);

        res.json(response);
    } catch (error) {
        logger.error('Error fetching resources', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
});

/**
 * @route   POST /api/v1/resources/scan
 * @desc    Trigger AWS scan - QUEUED via Bull
 * @access  Private (requires JWT)
 */
router.post('/scan', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.id; // ✅ FIXED: From JWT
        const { accessKeyId, secretAccessKey, region } = req.body;

        if (!accessKeyId || !secretAccessKey) {
            return res.status(400).json({ error: 'AWS credentials required' });
        }

        logger.info('Triggering AWS scan', { userId, region });

        // Create scan job record
        const scanJobResult = await query(
            `INSERT INTO scan_jobs (user_id, status) 
       VALUES ($1, 'pending') 
       RETURNING id`,
            [userId]
        );

        const scanJobId = scanJobResult.rows[0].id;

        // Queue the scan job
        const job = await addScanJob(userId, {
            userId,
            accountId: userId, // Simplified - in real app, separate account table
            accessKeyId,
            secretAccessKey,
            region: region || 'us-east-1',
            scanJobId
        });

        logger.info('Scan job queued', { jobId: job.id, scanJobId, userId });

        res.json({
            message: 'Scan queued successfully',
            jobId: job.id,
            scanJobId,
            status: 'pending'
        });
    } catch (error) {
        logger.error('Error starting scan', { error: error.message });
        res.status(500).json({ error: 'Failed to start scan' });
    }
});

/**
 * @route   GET /api/v1/resources/scan/:jobId
 * @desc    Get scan job status
 * @access  Private (requires JWT)
 */
router.get('/scan/:jobId', verifyJWT, async (req, res) => {
    try {
        const { jobId } = req.params;

        const status = await getScanJobStatus(jobId);

        if (!status) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(status);
    } catch (error) {
        logger.error('Error getting scan status', { error: error.message });
        res.status(500).json({ error: 'Failed to get scan status' });
    }
});

module.exports = router;
