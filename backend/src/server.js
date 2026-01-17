const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { metricsMiddleware } = require('./utils/metrics');

// ✅ CRITICAL FIX: Start Bull workers (Blocker #3)
// In production, run workers in separate processes with: npm run worker
// For development, workers run inline with API server
if (process.env.NODE_ENV !== 'production' || process.env.START_WORKERS === 'true') {
    require('./worker');
    logger.info('✅ Bull workers started (scan queue + alert queue)');
}

// Import routes
const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resources');
const costRoutes = require('./routes/costs');
const healthRoutes = require('./routes/health');
const { metricsRouter } = require('./utils/metrics');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// ✅ MONITORING: Prometheus metrics middleware (Blocker #5)
app.use(metricsMiddleware);

// Health check endpoints (Kubernetes/Docker)
app.use('/health', healthRoutes);

// Metrics endpoint for Prometheus
app.use(metricsRouter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/costs', costRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`HostMaster Backend API running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
