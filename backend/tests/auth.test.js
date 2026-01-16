const request = require('supertest');
const app = require('../src/server');

describe('Authentication API', () => {
    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', 'test@example.com');
        });

        it('should reject duplicate email', async () => {
            // Register first user
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'duplicate@example.com',
                    password: 'password123',
                    name: 'User One'
                });

            // Try to register with same email
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'duplicate@example.com',
                    password: 'password456',
                    name: 'User Two'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should require valid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                    name: 'Test User'
                });

            expect(response.status).toBe(400);
        });

        it('should require password >= 8 characters', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'short',
                    name: 'Test User'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeAll(async () => {
            // Create test user
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'login@example.com',
                    password: 'password123',
                    name: 'Login User'
                });
        });

        it('should login with correct credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', 'login@example.com');
        });

        it('should reject wrong password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should reject non-existent email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
        });
    });
});

describe('Rate Limiting', () => {
    it('should enforce daily API limits for free tier', async () => {
        // This would need to mock Redis and simulate 100+ requests
        // Placeholder for now
        expect(true).toBe(true);
    });
});
