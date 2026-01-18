const request = require('supertest');
const app = require('../src/server');

describe('Authentication API', () => {
    describe('POST /api/v1/auth/register', () => {
        it('should register a new user with valid credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: `test${Date.now()}@example.com`,
                    password: 'Password123',
                    name: 'Test User'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('email');
        });

        it('should reject registration with weak password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'weak',
                    name: 'Test User'
                });

            expect(res.statusCode).toBe(400);
        });

        it('should reject registration with invalid email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'notanemail',
                    password: 'Password123',
                    name: 'Test User'
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login with valid credentials', async () => {
            // First register a user
            const email = `test${Date.now()}@example.com`;
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email,
                    password: 'Password123',
                    name: 'Test User'
                });

            // Then login
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email,
                    password: 'Password123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
        });

        it('should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'WrongPassword123'
                });

            expect(res.statusCode).toBe(401);
        });
    });
});

describe('Health Check API', () => {
    describe('GET /health', () => {
        it('should return healthy status', async () => {
            const res = await request(app).get('/health');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'healthy');
            expect(res.body).toHaveProperty('timestamp');
        });
    });
});
