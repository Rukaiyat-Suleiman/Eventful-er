const { sequelize } = require("../config/sequelize.config.js");
const { logger } = require("../config/logger.config.js");

async function checkDBConnection() {
    try {
        await sequelize.authenticate()
        logger.info("Database is connected")
    } catch (error) {
        logger.error("Database is not connected", error)
        throw new Error
    }
}

module.exports = checkDBConnection;
