const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const AWSScanner = require('../services/awsScanner');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/resources
 * @desc    Get all AWS resources - REAL DATABASE
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        // TODO: Add auth middleware to get userId from JWT
        const userId = 'demo-user-id'; // For now, hardcoded

        logger.info('Fetching AWS resources', { userId });

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

        res.json({
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
        });
    } catch (error) {
        logger.error('Error fetching resources', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
});

/**
 * @route   POST /api/v1/resources/scan
 * @desc    Trigger AWS scan - REAL AWS SDK
 * @access  Private
 */
router.post('/scan', async (req, res) => {
    try {
        const userId = 'demo-user-id';
        const { accessKeyId, secretAccessKey, region } = req.body;

        if (!accessKeyId || !secretAccessKey) {
            return res.status(400).json({ error: 'AWS credentials required' });
        }

        logger.info('Starting AWS scan', { userId, region });

        // Initialize scanner
        const scanner = new AWSScanner(accessKeyId, secretAccessKey, region || 'us-east-1');

        // Scan in background
        setImmediate(async () => {
            try {
                const ec2 = await scanner.scanEC2Instances(userId);
                const rds = await scanner.scanRDSInstances(userId);
                logger.info('Scan completed', { userId, ec2Count: ec2.length, rdsCount: rds.length });
            } catch (error) {
                logger.error('Scan failed', { error: error.message });
            }
        });

        res.json({ message: 'Scan started', status: 'running' });
    } catch (error) {
        logger.error('Error starting scan', { error: error.message });
        res.status(500).json({ error: 'Failed to start scan' });
    }
});

module.exports = router;
