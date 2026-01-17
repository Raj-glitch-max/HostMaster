const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Input Validation Middleware
 * 
 * Validates and sanitizes all user input to prevent:
 * - SQL injection
 * - XSS attacks
 * - Invalid data
 * - Malicious payloads
 */

// Validation helper
const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Log validation errors
        logger.warn('Input validation failed', {
            path: req.path,
            errors: errors.array(),
            userId: req.user?.id
        });

        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    };
};

// Registration validation
const validateRegistration = validate([
    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail()
        .trim(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be 2-100 characters')
        .escape()
]);

// Login validation
const validateLogin = validate([
    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail()
        .trim(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
]);

// AWS scan validation
const validateScan = validate([
    body('accessKeyId')
        .notEmpty()
        .withMessage('AWS Access Key ID is required')
        .matches(/^AKIA[0-9A-Z]{16}$/)
        .withMessage('Invalid AWS Access Key ID format')
        .trim(),
    body('secretAccessKey')
        .notEmpty()
        .withMessage('AWS Secret Access Key is required')
        .isLength({ min: 40, max: 40 })
        .withMessage('Invalid AWS Secret Access Key length')
        .trim(),
    body('region')
        .optional()
        .isIn([
            'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
            'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
            'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
            'sa-east-1', 'ca-central-1'
        ])
        .withMessage('Invalid AWS region')
]);

// Alert settings validation
const validateAlertSettings = validate([
    body('threshold')
        .isFloat({ min: 0, max: 1000000 })
        .withMessage('Threshold must be between 0 and 1,000,000')
        .toFloat(),
    body('type')
        .isIn(['daily_cost', 'monthly_cost', 'resource_count'])
        .withMessage('Invalid alert type'),
    body('email')
        .optional()
        .isBoolean()
        .withMessage('Email must be boolean')
        .toBoolean(),
    body('slack')
        .optional()
        .isBoolean()
        .withMessage('Slack must be boolean')
        .toBoolean()
]);

// Slack webhook validation
const validateSlackWebhook = validate([
    body('webhookUrl')
        .notEmpty()
        .withMessage('Webhook URL is required')
        .isURL({ protocols: ['https'], require_protocol: true })
        .withMessage('Must be a valid HTTPS URL')
        .custom((value) => {
            if (!value.startsWith('https://hooks.slack.com/services/')) {
                throw new Error('Must be a valid Slack webhook URL');
            }
            return true;
        })
]);

// Email notification validation
const validateEmailSettings = validate([
    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail()
        .trim(),
    body('enabled')
        .isBoolean()
        .withMessage('Enabled must be boolean')
        .toBoolean()
]);

// Pagination validation
const validatePagination = validate([
    body('page')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Page must be between 1 and 10,000')
        .toInt(),
    body('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt()
]);

// Date range validation
const validateDateRange = validate([
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be valid ISO 8601 date')
        .toDate(),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be valid ISO 8601 date')
        .toDate()
        .custom((value, { req }) => {
            if (req.body.startDate && value < req.body.startDate) {
                throw new Error('End date must be after start date');
            }
            return true;
        })
]);

module.exports = {
    validateRegistration,
    validateLogin,
    validateScan,
    validateAlertSettings,
    validateSlackWebhook,
    validateEmailSettings,
    validatePagination,
    validateDateRange
};
