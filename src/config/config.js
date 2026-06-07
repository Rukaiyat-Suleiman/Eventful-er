require('dotenv/config');

const sslConfig = {
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
};

module.exports = {
    development: {
        url: process.env.DB_URI,
        dialect: 'postgres',
        ...sslConfig
    },
    production: {
        url: process.env.DB_URI_PROD,
        dialect: 'postgres',
        ...sslConfig
    },
    test: {
        url: process.env.DB_URI_TEST,
        dialect: 'postgres',
        ...sslConfig
    }
};
