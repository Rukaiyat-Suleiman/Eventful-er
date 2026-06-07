const log4js = require("log4js");

log4js.configure({
    appenders: {
        file: { type: "file", filename: "app.log" },
        out: { type: "stdout" }
    },
    categories: {
        default: { appenders: ["file", "out"], level: process.env.LOG_LEVEL || "debug" }
    }
});

const logger = log4js.getLogger();

module.exports = { logger };
