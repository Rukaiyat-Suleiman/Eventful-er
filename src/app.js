const express = require("express");
require("dotenv/config");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { logger } = require("./config/logger.config.js");
const sendResponse = require("./middlewares/response.middleware.js");
const mainRouter = require("./modules/events/events.routes.js");
const authRouter = require("./modules/auth/auth.routes.js");
const viewRouter = require("./modules/views/views.routes.js");
const paymentRouter = require("./modules/payments/payments.routes.js");
const usersRouter = require("./modules/users/users.routes.js");
const checkDBConnection = require("./utils/db-check.js");
const { startReminderJob } = require("./jobs/reminder.job.js");

const PORT = process.env.PORT || 3000;

const app = express();

const stream = {
    write: message => logger.info(message.trim())
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("tiny", { stream }));

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerOptions = require("./config/swagger.config.js");

// Rate Limiter
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 30) * 60 * 1000,
    max: 100, // Limit each IP to 100 requests per `window`
    message: { success: false, statusCode: 429, message: "Too many requests, please try again later." }
});
app.use(limiter);

// EJS View Engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Swagger API Documentation
const swaggerSpec = swaggerJsdoc(swaggerOptions(PORT));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/", viewRouter);
app.use("/api/auth", authRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/users", usersRouter);
app.use("/api", mainRouter);

const errorHandler = require("./middlewares/error.middleware.js");
app.use(errorHandler);

// Only listen if not running in Jest
if (!process.env.JEST_WORKER_ID) {
    app.listen(PORT, async () => {
        try {
            await checkDBConnection();
            startReminderJob();
            logger.info(`Listening on http://localhost:${PORT}`);
        } catch (err) {
            logger.info (`Server failed to startup: \n${err}`)
        }
    });
}

module.exports = app;
