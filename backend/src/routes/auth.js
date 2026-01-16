const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user - REAL DATABASE
 */
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('name').trim().notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password, name } = req.body;

            // Check if user exists
            const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const result = await query(
                'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
                [email, passwordHash, name]
            );

            const user = result.rows[0];

            // Generate JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET || 'local_development_secret',
                { expiresIn: '7d' }
            );

            logger.info('User registered', { userId: user.id, email });

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: { id: user.id, email: user.email, name: user.name }
            });
        } catch (error) {
            logger.error('Registration error', { error: error.message });
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user - REAL DATABASE
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
            const { email, password } = req.body;

            // Find user
            const result = await query(
                'SELECT id, email, name, password_hash FROM users WHERE email = $1',
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = result.rows[0];

            // Verify password
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET || 'local_development_secret',
                { expiresIn: '7d' }
            );

            logger.info('User logged in', { userId: user.id, email });

            res.json({
                message: 'Login successful',
                token,
                user: { id: user.id, email: user.email, name: user.name }
            });
        } catch (error) {
            logger.error('Login error', { error: error.message });
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

module.exports = router;
