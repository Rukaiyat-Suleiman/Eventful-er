import { sequelize } from "../config/sequelize.config.js";
import { logger } from "./logger.config.js"

async function checkDBConnection() {
    try {
        await sequelize.authenticate()
        logger.info("Database is connected")
    } catch (error) {
        logger.error("Database is not connected", error)
        throw new Error
    }
}

export default checkDBConnection