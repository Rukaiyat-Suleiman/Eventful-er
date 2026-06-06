import express from "express";
import "dotenv/config";
import morgan from "morgan";
import { logger } from "./utils/logger.config.js";
import sendResponse from "./utils/response.middleware.js"
import router from "./routes/mainRoute.js";
import checkDBConnection from "./utils/auth.db.js";

const PORT = process.env.PORT;

const app = express();

const stream = {
    write: message => logger.info(message.trim())
};

app.use (morgan("tiny", {stream}));
app.use ("/", router);

// Only listen if not running in Jest
if (!process.env.JEST_WORKER_ID) {
    app.listen(PORT, async () => {
        try {
            await checkDBConnection()
            logger.info(`Listening on http://localhost:${PORT}`);
        } catch (err) {
            logger.info (`Server failed to startup: \n${err}`)
        }
    });
}

export default app;