const AWS = require('aws-sdk');
const logger = require('../utils/logger');
const { query } = require('../config/database');

class AWSScanner {
    constructor(accessKeyId, secretAccessKey, region = 'us-east-1') {
        this.region = region;

        // Initialize AWS SDK
        AWS.config.update({
            accessKeyId,
            secretAccessKey,
            region
        });

        this.ec2 = new AWS.EC2();
        this.rds = new AWS.RDS();
        this.pricing = new AWS.Pricing({ region: 'us-east-1' }); // Pricing API only in us-east-1
        this.costExplorer = new AWS.CostExplorer({ region: 'us-east-1' });
    }

    /**
     * Scan all EC2 instances
     */
    async scanEC2Instances(userId) {
        try {
            logger.info('Scanning EC2 instances', { userId, region: this.region });

            const params = {
                Filters: [
                    {
                        Name: 'instance-state-name',
                        Values: ['running', 'stopped']
                    }
                ]
            };

            const data = await this.ec2.describeInstances(params).promise();
            const instances = [];

            for (const reservation of data.Reservations) {
                for (const instance of reservation.Instances) {
                    const monthlyCost = await this.calculateEC2Cost(instance.InstanceType, instance.State.Name);

                    const instanceData = {
                        userId,
                        resourceType: 'ec2',
                        resourceId: instance.InstanceId,
                        resourceName: this.getInstanceName(instance.Tags),
                        region: this.region,
                        instanceType: instance.InstanceType,
                        state: instance.State.Name,
                        monthlyCost,
                        metadata: {
                            launchTime: instance.LaunchTime,
                            availabilityZone: instance.Placement.AvailabilityZone,
                            platform: instance.Platform || 'Linux',
                            privateIpAddress: instance.PrivateIpAddress,
                            publicIpAddress: instance.PublicIpAddress,
                            vpcId: instance.VpcId,
                            subnetId: instance.SubnetId
                        }
                    };

                    instances.push(instanceData);

                    // Save to database
                    await this.saveResource(instanceData);
                }
            }

            logger.info(`Found ${instances.length} EC2 instances`, { userId });
            return instances;
        } catch (error) {
            logger.error('Error scanning EC2 instances', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Scan all RDS instances
     */
    async scanRDSInstances(userId) {
        try {
            logger.info('Scanning RDS instances', { userId, region: this.region });

            const data = await this.rds.describeDBInstances().promise();
            const instances = [];

            for (const dbInstance of data.DBInstances) {
                const monthlyCost = await this.calculateRDSCost(
                    dbInstance.DBInstanceClass,
                    dbInstance.Engine,
                    dbInstance.MultiAZ,
                    dbInstance.AllocatedStorage
                );

                const instanceData = {
                    userId,
                    resourceType: 'rds',
                    resourceId: dbInstance.DBInstanceIdentifier,
                    resourceName: dbInstance.DBInstanceIdentifier,
                    region: this.region,
                    instanceType: dbInstance.DBInstanceClass,
                    state: dbInstance.DBInstanceStatus,
                    monthlyCost,
                    metadata: {
                        engine: dbInstance.Engine,
                        engineVersion: dbInstance.EngineVersion,
                        multiAZ: dbInstance.MultiAZ,
                        storageType: dbInstance.StorageType,
                        allocatedStorage: dbInstance.AllocatedStorage,
                        availabilityZone: dbInstance.AvailabilityZone,
                        endpoint: dbInstance.Endpoint
                    }
                };

                instances.push(instanceData);
                await this.saveResource(instanceData);
            }

            logger.info(`Found ${instances.length} RDS instances`, { userId });
            return instances;
        } catch (error) {
            logger.error('Error scanning RDS instances', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Get real costs from AWS Cost Explorer
     */
    async getRealCosts(userId, startDate, endDate) {
        try {
            const params = {
                TimePeriod: {
                    Start: startDate, // Format: YYYY-MM-DD
                    End: endDate
                },
                Granularity: 'MONTHLY',
                Metrics: ['UnblendedCost'],
                GroupBy: [
                    {
                        Type: 'DIMENSION',
                        Key: 'SERVICE'
                    }
                ]
            };

            const data = await this.costExplorer.getCostAndUsage(params).promise();

            let totalCost = 0;
            const costByService = {};

            for (const result of data.ResultsByTime) {
                for (const group of result.Groups) {
                    const service = group.Keys[0];
                    const cost = parseFloat(group.Metrics.UnblendedCost.Amount);

                    if (!costByService[service]) {
                        costByService[service] = 0;
                    }
                    costByService[service] += cost;
                    totalCost += cost;
                }
            }

            // Save cost history
            const month = startDate.substring(0, 7); // YYYY-MM
            await query(
                `INSERT INTO cost_history (user_id, month, total_cost, cost_by_service, cost_by_region)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, month) DO UPDATE
         SET total_cost = $3, cost_by_service = $4, updated_at = CURRENT_TIMESTAMP`,
                [userId, month, totalCost, JSON.stringify(costByService), JSON.stringify({ [this.region]: totalCost })]
            );

            return {
                totalCost,
                costByService
            };
        } catch (error) {
            logger.error('Error getting costs from Cost Explorer', { error: error.message, userId });
            // Fallback to estimated costs if Cost Explorer fails
            return this.estimateCosts(userId);
        }
    }

    /**
     * Calculate EC2 monthly cost (estimated)
     */
    async calculateEC2Cost(instanceType, state) {
        // Simplified pricing - in production, fetch from AWS Pricing API
        const hourlyRates = {
            't3.micro': 0.0104,
            't3.small': 0.0208,
            't3.medium': 0.0416,
            't3.large': 0.0832,
            't3.xlarge': 0.1664
        };

        const hourlyRate = hourlyRates[instanceType] || 0.05;
        const hoursPerMonth = 730;

        // If stopped, only EBS costs apply (simplified)
        const monthlyCost = state === 'running' ? hourlyRate * hoursPerMonth : 5;

        return parseFloat(monthlyCost.toFixed(2));
    }

    /**
     * Calculate RDS monthly cost (estimated)
     */
    async calculateRDSCost(instanceClass, engine, multiAZ, storageGB) {
        // Simplified pricing
        const hourlyRates = {
            'db.t3.micro': 0.017,
            'db.t3.small': 0.034,
            'db.t3.medium': 0.068
        };

        const hourlyRate = hourlyRates[instanceClass] || 0.05;
        const hoursPerMonth = 730;

        let monthlyCost = hourlyRate * hoursPerMonth;

        // Multi-AZ doubles the cost
        if (multiAZ) {
            monthlyCost *= 2;
        }

        // Storage cost: $0.115 per GB-month
        monthlyCost += (storageGB || 20) * 0.115;

        return parseFloat(monthlyCost.toFixed(2));
    }

    /**
     * Save resource to database
     */
    async saveResource(resourceData) {
        try {
            await query(
                `INSERT INTO aws_resources 
         (user_id, resource_type, resource_id, resource_name, region, instance_type, state, monthly_cost, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id, resource_id, resource_type) 
         DO UPDATE SET 
           state = $7, 
           monthly_cost = $8, 
           metadata = $9,
           last_seen_at = CURRENT_TIMESTAMP`,
                [
                    resourceData.userId,
                    resourceData.resourceType,
                    resourceData.resourceId,
                    resourceData.resourceName,
                    resourceData.region,
                    resourceData.instanceType,
                    resourceData.state,
                    resourceData.monthlyCost,
                    JSON.stringify(resourceData.metadata)
                ]
            );
        } catch (error) {
            logger.error('Error saving resource', { error: error.message });
            throw error;
        }
    }

    /**
     * Helper to get instance name from tags
     */
    getInstanceName(tags) {
        if (!tags) return 'Unnamed';
        const nameTag = tags.find(tag => tag.Key === 'Name');
        return nameTag ? nameTag.Value : 'Unnamed';
    }

    /**
     * Estimate costs from saved resources
     */
    async estimateCosts(userId) {
        const result = await query(
            `SELECT 
         SUM(monthly_cost) as total_cost,
         jsonb_object_agg(resource_type, monthly_cost) as cost_by_service
       FROM aws_resources
       WHERE user_id = $1 AND state = 'running'
       GROUP BY user_id`,
            [userId]
        );

        return result.rows[0] || { totalCost: 0, costByService: {} };
    }
}

module.exports = AWSScanner;
