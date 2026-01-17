const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * JWT Verification Middleware
 * Extracts and validates JWT token from Authorization header
 * Attaches decoded user info to req.user
 */
const verifyJWT = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No token provided',
                message: 'Authorization header must be in format: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token is empty' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            tier: decoded.tier || 'free',
            name: decoded.name
        };

        logger.info('JWT verified successfully', {
            userId: req.user.id,
            email: req.user.email,
            tier: req.user.tier
        });

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            logger.warn('Token expired', { error: error.message });
            return res.status(401).json({
                error: 'Token expired',
                message: 'Please login again to get a new token'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            logger.warn('Invalid token', { error: error.message });
            return res.status(403).json({
                error: 'Invalid token',
                message: 'Token signature is invalid'
            });
        }

        logger.error('JWT verification failed', {
            error: error.message,
            stack: error.stack
        });

        return res.status(403).json({
            error: 'Token verification failed',
            message: error.message
        });
    }
};

/**
 * Optional JWT Middleware
 * Same as verifyJWT but doesn't fail if no token present
 * Useful for endpoints that work for both authenticated and public users
 */
const optionalJWT = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token, continue without user
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.userId,
            email: decoded.email,
            tier: decoded.tier || 'free',
            name: decoded.name
        };

        next();

    } catch (error) {
        // Token invalid, but that's okay - continue without user
        req.user = null;
        next();
    }
};

module.exports = { verifyJWT, optionalJWT };
