const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../database/models');
const sendResponse = require('../../middlewares/response.middleware');
const { logger } = require('../../config/logger.config');

// Joi Validation Schemas
const signupSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    username: Joi.string().allow('', null),
    role: Joi.string().valid('host', 'attendee').required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const generateTokens = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    return { token, refreshToken };
};

const setTokenCookie = (res, token) => {
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day fallback
    });
};

const signup = async (req, res) => {
    const transaction = await User.sequelize.transaction();
    try {
        const { error, value } = signupSchema.validate(req.body);
        if (error) {
            await transaction.rollback();
            return sendResponse(res, 400, false, "Validation error", null, error.details[0].message);
        }

        const { firstName, lastName, email, password, username, role } = value;

        // Check if user exists
        const existingUser = await User.findOne({
            where: { email },
            attributes: ['id'],
            transaction
        });
        if (existingUser) {
            await transaction.rollback();
            return sendResponse(res, 409, false, "User with this email already exists");
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            username: username || null,
            role
        }, { transaction });

        // Generate tokens
        const { token } = generateTokens(newUser);
        
        // Set cookie
        setTokenCookie(res, token);

        await transaction.commit();

        if (req.accepts('html')) {
            return res.redirect('/dashboard');
        }

        return sendResponse(res, 201, true, "User registered successfully", {
            user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName }
        });
    } catch (err) {
        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            // Already rolled back or failed to roll back
        }
        logger.error('Signup Error:', err);
        return sendResponse(res, 500, false, "Internal server error", null, err.message);
    }
};

const login = async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return sendResponse(res, 400, false, "Validation error", null, error.details[0].message);
        }

        const { email, password } = value;

        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'email', 'password', 'role', 'firstName']
        });
        if (!user) {
            return sendResponse(res, 401, false, "Invalid email or password");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendResponse(res, 401, false, "Invalid email or password");
        }

        const { token, refreshToken } = generateTokens(user);
        
        setTokenCookie(res, token);

        if (req.accepts('html') && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            return res.redirect('/dashboard');
        }

        return sendResponse(res, 200, true, "Login successful", {
            token,
            refreshToken,
            user: { id: user.id, email: user.email, firstName: user.firstName }
        });
    } catch (err) {
        logger.error('Login Error:', err);
        return sendResponse(res, 500, false, "Internal server error", null, err.message);
    }
};

const logout = (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    if (req.accepts('html')) {
        return res.redirect('/login');
    }
    return sendResponse(res, 200, true, "Logged out successfully");
};

module.exports = { signup, login, logout };
