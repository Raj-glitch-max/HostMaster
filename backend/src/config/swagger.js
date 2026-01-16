const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HostMaster API',
            version: '1.0.0',
            description: 'AWS Cost Optimization Platform API Documentation',
            contact: {
                name: 'HostMaster Support',
                email: 'support@hostmaster.io'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            },
            {
                url: 'https://api.hostmaster.io',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        tier: { type: 'string', enum: ['free', 'professional', 'enterprise'] }
                    }
                },
                Resource: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        type: { type: 'string' },
                        name: { type: 'string' },
                        region: { type: 'string' },
                        monthlyCost: { type: 'number' },
                        state: { type: 'string' }
                    }
                },
                Recommendation: {
                    type: 'object',
                    properties: {
                        type: { type: 'string' },
                        action: { type: 'string' },
                        savings: { type: 'number' },
                        confidenceScore: { type: 'number' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Resources', description: 'AWS resource management' },
            { name: 'Costs', description: 'Cost analysis and recommendations' }
        ]
    },
    apis: ['./src/routes/*.js'] // Path to API route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    swaggerSpec
};
