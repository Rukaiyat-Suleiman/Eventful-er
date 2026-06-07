const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Event, Payment, QrCode } = require('../../database/models');
const sendResponse = require('../../middlewares/response.middleware');
const { logger } = require('../../config/logger.config');

const updateProfileSchema = Joi.object({
    username: Joi.string().allow('', null).optional(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('host', 'attendee').required(),
    password: Joi.string().min(6).allow('', null).optional()
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

const updateProfile = async (req, res) => {
    const transaction = await User.sequelize.transaction();
    try {
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            await transaction.rollback();
            if (req.accepts('html') && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                return res.status(400).render("error", { message: error.details[0].message });
            }
            return sendResponse(res, 400, false, "Validation error", null, error.details[0].message);
        }

        const { username, email, role, password } = value;
        const userId = req.user.id;

        const user = await User.findByPk(userId, { transaction });
        if (!user) {
            await transaction.rollback();
            return sendResponse(res, 404, false, "User not found");
        }

        // Check if email is already taken by someone else
        if (email !== user.email) {
            const existingUser = await User.findOne({ where: { email }, transaction });
            if (existingUser) {
                await transaction.rollback();
                if (req.accepts('html') && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                    return res.status(409).render("error", { message: "Email is already taken" });
                }
                return sendResponse(res, 409, false, "Email is already taken");
            }
        }

        user.username = username || null;
        user.email = email;
        user.role = role;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save({ transaction });

        // If email or role changed, update the token
        if (user.email !== req.user.email || user.role !== req.user.role) {
            const { token } = generateTokens(user);
            setTokenCookie(res, token);
        }

        await transaction.commit();

        if (req.accepts('html') && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            return res.redirect('/profile');
        }

        return sendResponse(res, 200, true, "Profile updated successfully", {
            user: { id: user.id, email: user.email, role: user.role, username: user.username }
        });
    } catch (err) {
        try { await transaction.rollback(); } catch (e) {}
        logger.error("Update Profile Error:", err);
        return sendResponse(res, 500, false, "Internal server error", null, err.message);
    }
};

const deleteProfile = async (req, res) => {
    const transaction = await User.sequelize.transaction();
    try {
        const userId = req.user.id;

        // Optionally, delete related data if not handled by cascades
        await QrCode.destroy({ where: { userId }, transaction });
        await Payment.destroy({ where: { userId }, transaction });
        await Event.destroy({ where: { userId }, transaction });
        
        await User.destroy({ where: { id: userId }, transaction });

        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        await transaction.commit();

        if (req.accepts('html') && req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            return res.redirect('/');
        }

        return sendResponse(res, 200, true, "Account deleted successfully");
    } catch (err) {
        try { await transaction.rollback(); } catch (e) {}
        logger.error("Delete Profile Error:", err);
        return sendResponse(res, 500, false, "Internal server error", null, err.message);
    }
};

module.exports = {
    updateProfile,
    deleteProfile
};
