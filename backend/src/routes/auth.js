const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const {
    sanitizeInput,
    validatePasswordStrength,
    checkAccountLockout,
    recordFailedLogin,
    resetFailedLogins,
    auditLog,
    getClientIp
} = require('../utils/security');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user - PRODUCTION HARDENED
 */
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 12 }),
        body('name').trim().notEmpty().isLength({ max: 100 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const email = sanitizeInput(req.body.email);
            const password = req.body.password;
            const name = sanitizeInput(req.body.name);

            // Validate password strength
            const passwordCheck = validatePasswordStrength(password);
            if (!passwordCheck.valid) {
                return res.status(400).json({
                    error: 'Password too weak',
                    requirements: passwordCheck.errors
                });
            }

            // Check if user exists
            const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                await auditLog({
                    action: 'REGISTER_FAILED_DUPLICATE',
                    ipAddress: getClientIp(req),
                    userAgent: req.get('user-agent'),
                    metadata: { email }
                });
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password with 12 rounds (production strength)
            const passwordHash = await bcrypt.hash(password, 12);

            // Create user
            const result = await query(
                'INSERT INTO users (email, password_hash, name, tier) VALUES ($1, $2, $3, $4) RETURNING id, email, name, tier',
                [email, passwordHash, name, 'free']
            );

            const user = result.rows[0];

            // Generate JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email, tier: user.tier },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Audit log
            await auditLog({
                userId: user.id,
                action: 'USER_REGISTERED',
                ipAddress: getClientIp(req),
                userAgent: req.get('user-agent')
            });

            logger.info('User registered', { userId: user.id, email });

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    tier: user.tier
                }
            });
        } catch (error) {
            logger.error('Registration error', { error: error.message });
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user - PRODUCTION HARDENED
 */
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const email = sanitizeInput(req.body.email);
            const password = req.body.password;

            // Find user
            const result = await query(
                'SELECT id, email, name, tier, password_hash FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                await auditLog({
                    action: 'LOGIN_FAILED_USER_NOT_FOUND',
                    ipAddress: getClientIp(req),
                    userAgent: req.get('user-agent'),
                    metadata: { email }
                });
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = result.rows[0];

            // Check account lockout
            const lockoutStatus = await checkAccountLockout(user.id);
            if (lockoutStatus.locked) {
                await auditLog({
                    userId: user.id,
                    action: 'LOGIN_BLOCKED_ACCOUNT_LOCKED',
                    ipAddress: getClientIp(req),
                    userAgent: req.get('user-agent')
                });
                return res.status(423).json({
                    error: 'Account temporarily locked',
                    minutesRemaining: lockoutStatus.minutesRemaining
                });
            }

            // Verify password
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                // Record failed attempt
                const failedStatus = await recordFailedLogin(user.id);

                await auditLog({
                    userId: user.id,
                    action: 'LOGIN_FAILED_WRONG_PASSWORD',
                    ipAddress: getClientIp(req),
                    userAgent: req.get('user-agent'),
                    metadata: { attempts: failedStatus.attempts }
                });

                if (failedStatus.locked) {
                    return res.status(423).json({
                        error: 'Too many failed attempts. Account locked for 30 minutes.'
                    });
                }

                return res.status(401).json({
                    error: 'Invalid credentials',
                    remaining: 5 - failedStatus.attempts
                });
            }

            // Reset failed attempts on successful login
            await resetFailedLogins(user.id);

            // Generate JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email, tier: user.tier },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            await auditLog({
                userId: user.id,
                action: 'LOGIN_SUCCESS',
                ipAddress: getClientIp(req),
                userAgent: req.get('user-agent')
            });

            logger.info('User logged in', { userId: user.id, email });

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    tier: user.tier
                }
            });
        } catch (error) {
            logger.error('Login error', { error: error.message, stack: error.stack });
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

module.exports = router;
