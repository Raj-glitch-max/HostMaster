const express = require('express');
const client = require('prom-client');

const app = express.Router();

// Create custom metrics
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

const scanJobDuration = new client.Histogram({
    name: 'scan_job_duration_seconds',
    help: 'Duration of AWS scan jobs',
    labelNames: ['status']
});

const activeScansGauge = new client.Gauge({
    name: 'active_scans',
    help: 'Number of currently active scan jobs'
});

const totalCostGauge = new client.Gauge({
    name: 'total_aws_cost_dollars',
    help: 'Total AWS cost tracked across all users',
    labelNames: ['tier']
});

const apiCallsCounter = new client.Counter({
    name: 'api_calls_total',
    help: 'Total number of API calls',
    labelNames: ['endpoint', 'tier']
});

// Create a Registry
const register = new client.Registry();

// Register default metrics
client.collectDefaultMetrics({ register });

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(scanJobDuration);
register.registerMetric(activeScansGauge);
register.registerMetric(totalCostGauge);
register.registerMetric(apiCallsCounter);

/**
 * Middleware to track request duration
 */
function metricsMiddleware(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestDuration
            .labels(req.method, req.route?.path || req.path, res.statusCode)
            .observe(duration);
    });

    next();
}

/**
 * Expose metrics endpoint for Prometheus
 */
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
});

module.exports = {
    metricsRouter: app,
    metricsMiddleware,
    metrics: {
        httpRequestDuration,
        scanJobDuration,
        activeScansGauge,
        totalCostGauge,
        apiCallsCounter
    }
};
