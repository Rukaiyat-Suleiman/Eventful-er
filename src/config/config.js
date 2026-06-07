require('dotenv/config');

const getSSLConfig = (url) => {
    if (!url) return {};
    const useSSL = url.includes('sslmode=require') || (!url.includes('localhost') && !url.includes('127.0.0.1'));
    return useSSL ? {
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    } : {};
};

module.exports = {
    development: {
        url: process.env.DB_URI,
        dialect: 'postgres',
        ...getSSLConfig(process.env.DB_URI)
    },
    production: {
        url: process.env.DB_URI_PROD,
        dialect: 'postgres',
        ...getSSLConfig(process.env.DB_URI_PROD)
    },
    test: {
        url: process.env.DB_URI_TEST,
        dialect: 'postgres',
        ...getSSLConfig(process.env.DB_URI_TEST)
    }
};
