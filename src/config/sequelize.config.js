const Sequelize = require("sequelize");
const { logger } = require("./logger.config.js");

const dbUri = process.env.NODE_ENV === 'test' ? process.env.DB_URI_TEST : process.env.DB_URI;
const useSSL = dbUri && (dbUri.includes('sslmode=require') || (!dbUri.includes('localhost') && !dbUri.includes('127.0.0.1')));

const sequelize = new Sequelize(dbUri, {
    dialect: "postgres",
    logging: (msg) => logger.debug("Sequelize: " + msg),
    dialectOptions: useSSL ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {},
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const sequelizeConfig = {
    development: {
        use_env_variables: process.env.DB_URI,
        dialect: 'postgres'
    },
    production: {
        use_env_variables: process.env.DB_URI,
        dialect: 'postgres'
    },
    test: {
        use_env_variables: process.env.DB_URI,
        dialect: 'postgres'
    }
};

module.exports = { sequelize, sequelizeConfig };
