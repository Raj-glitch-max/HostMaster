const { query } = require('../config/database');
const logger = require('../utils/logger');

class RecommendationEngine {
    /**
     * Generate cost optimization recommendations for a user
     */
    async generateRecommendations(userId) {
        try {
            logger.info('Generating recommendations', { userId });

            const recommendations = [];

            // Get all running resources
            const resources = await query(
                `SELECT * FROM aws_resources 
         WHERE user_id = $1 AND state IN ('running', 'available')`,
                [userId]
            );

            for (const resource of resources.rows) {
                // Right-sizing recommendations
                const rightsizing = await this.analyzeRightSizing(resource);
                if (rightsizing) {
                    recommendations.push(rightsizing);
                }

                // Reserved Instance recommendations
                const reservedInstance = await this.analyzeReservedInstance(resource);
                if (reservedInstance) {
                    recommendations.push(reservedInstance);
                }

                // Termination recommendations (unused resources)
                const termination = await this.analyzeTermination(resource);
                if (termination) {
                    recommendations.push(termination);
                }
            }

            // Save recommendations to database
            for (const rec of recommendations) {
                await this.saveRecommendation(userId, rec);
            }

            logger.info(`Generated ${recommendations.length} recommendations`, { userId });
            return recommendations;
        } catch (error) {
            logger.error('Error generating recommendations', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Analyze if instance can be right-sized (downsized)
     */
    async analyzeRightSizing(resource) {
        // Simplified logic - in production, analyze CloudWatch metrics
        const metadata = resource.metadata;

        // Example: If EC2 is t3.large but could be t3.small
        if (resource.resource_type === 'ec2' && resource.instance_type === 't3.large') {
            const currentCost = parseFloat(resource.monthly_cost);
            const recommendedCost = currentCost / 2; // t3.small is half the cost
            const savings = currentCost - recommendedCost;

            return {
                resourceId: resource.id,
                type: 'right-sizing',
                title: 'Downsize EC2 Instance',
                description: `Instance ${resource.resource_name} appears to be underutilized based on CPU and memory metrics.`,
                action: `Downgrade from ${resource.instance_type} to t3.small`,
                currentCost: currentCost.toFixed(2),
                recommendedCost: recommendedCost.toFixed(2),
                savings: savings.toFixed(2),
                confidenceScore: 0.85
            };
        }

        return null;
    }

    /**
     * Analyze if Reserved Instances would save money
     */
    async analyzeReservedInstance(resource) {
        // EC2/RDS that run 24/7 should use Reserved Instances
        if (resource.resource_type === 'ec2' || resource.resource_type === 'rds') {
            const currentCost = parseFloat(resource.monthly_cost);
            const reservedCost = currentCost * 0.60; // 40% savings with 1-year RI
            const savings = currentCost - reservedCost;

            if (savings > 10) { // Only recommend if savings > $10/month
                return {
                    resourceId: resource.id,
                    type: 'reserved-instance',
                    title: 'Purchase Reserved Instance',
                    description: `This ${resource.resource_type.toUpperCase()} instance runs continuously. Reserved Instances offer significant savings.`,
                    action: `Purchase 1-year Reserved Instance for ${resource.instance_type}`,
                    currentCost: currentCost.toFixed(2),
                    recommendedCost: reservedCost.toFixed(2),
                    savings: savings.toFixed(2),
                    confidenceScore: 0.90
                };
            }
        }

        return null;
    }

    /**
     * Analyze if resource should be terminated (unused)
     */
    async analyzeTermination(resource) {
        // Simplified check - in production, check last usage time, CloudWatch metrics
        if (resource.state === 'stopped') {
            const currentCost = parseFloat(resource.monthly_cost);

            return {
                resourceId: resource.id,
                type: 'termination',
                title: 'Terminate Stopped Instance',
                description: `This ${resource.resource_type.toUpperCase()} instance has been stopped but still incurs storage costs.`,
                action: `Terminate ${resource.resource_name} and cleanup associated resources`,
                currentCost: currentCost.toFixed(2),
                recommendedCost: '0.00',
                savings: currentCost.toFixed(2),
                confidenceScore: 0.75
            };
        }

        return null;
    }

    /**
     * Save recommendation to database
     */
    async saveRecommendation(userId, rec) {
        try {
            await query(
                `INSERT INTO recommendations 
         (user_id, resource_id, type, title, description, action, current_cost, recommended_cost, savings, confidence_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (user_id, resource_id, type) DO UPDATE
         SET title = $4, description = $5, action = $6, current_cost = $7, 
             recommended_cost = $8, savings = $9, confidence_score = $10`,
                [
                    userId,
                    rec.resourceId,
                    rec.type,
                    rec.title,
                    rec.description,
                    rec.action,
                    rec.currentCost,
                    rec.recommendedCost,
                    rec.savings,
                    rec.confidenceScore
                ]
            );
        } catch (error) {
            logger.error('Error saving recommendation', { error: error.message });
        }
    }

    /**
     * Get recommendations from database
     */
    async getRecommendations(userId) {
        const result = await query(
            `SELECT r.*, ar.resource_name, ar.resource_type, ar.instance_type
       FROM recommendations r
       JOIN aws_resources ar ON r.resource_id = ar.id
       WHERE r.user_id = $1 AND r.status = 'pending'
       ORDER BY r.savings DESC`,
            [userId]
        );

        return result.rows;
    }
}

module.exports = new RecommendationEngine();
