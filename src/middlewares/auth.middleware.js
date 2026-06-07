const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger.config.js');

const verifyToken = (req, res, next) => {
    // Check cookies first, then Authorization header
    let token = req.cookies.jwt;
    
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // If it's an API route, return JSON. Otherwise redirect to login
        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ success: false, statusCode: 401, message: 'No token provided' });
        }
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        logger.error('JWT Verification Error:', error);
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ success: false, statusCode: 401, message: 'Invalid or expired token' });
        }
        return res.redirect('/login?error=session_expired');
    }
};

const optionalToken = (req, res, next) => {
    let token = req.cookies.jwt;
    
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        // If invalid/expired token is provided, just proceed without req.user
        next();
    }
};

module.exports = { verifyToken, optionalToken };
