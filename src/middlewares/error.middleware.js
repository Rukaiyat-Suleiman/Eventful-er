const { logger } = require("../config/logger.config");

const errorHandler = (err, req, res, next) => {
    logger.error("App Error Handler:", err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";

    if (req.accepts("html") && !req.originalUrl.startsWith("/api")) {
        return res.status(statusCode).render("error", { message });
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
};

module.exports = errorHandler;
