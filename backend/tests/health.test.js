const request = require('supertest');
const app = require('../src/server');
const { query } = require('../src/config/database');

/**
 * Health Check Endpoint Tests
 * 
 * Tests all health check endpoints for proper responses
 */

describe('Health Check Endpoints', () => {

    describe('GET /health', () => {
        it('should return 200 and health status', async () => {
            const res = await request(app)
                .get('/health')
                .expect(200);

            expect(res.body).toHaveProperty('status', 'healthy');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('uptime');
            expect(res.body.uptime).toBeGreaterThan(0);
        });
    });

    describe('GET /health/ready', () => {
        it('should return 200 when all dependencies are healthy', async () => {
            const res = await request(app)
                .get('/health/ready')
                .expect(200);

            expect(res.body).toHaveProperty('status', 'ready');
            expect(res.body).toHaveProperty('checks');
            expect(res.body.checks).toHaveProperty('database');
            expect(res.body.checks).toHaveProperty('redis');
            expect(res.body.checks).toHaveProperty('queues');
        });
    });

    describe('GET /health/detailed', () => {
        it('should return detailed system status', async () => {
            const res = await request(app)
                .get('/health/detailed')
                .expect(200);

            expect(res.body).toHaveProperty('status');
            expect(res.body).toHaveProperty('system');
            expect(res.body).toHaveProperty('database');
            expect(res.body).toHaveProperty('redis');
            expect(res.body).toHaveProperty('queues');

            // Check system metrics
            expect(res.body.system).toHaveProperty('memory');
            expect(res.body.system.memory).toHaveProperty('used');
            expect(res.body.system.memory).toHaveProperty('total');
        });
    });
});
