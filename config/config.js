import 'dotenv/config'

export default {
    development: {
        url: process.env.DB_URI,
        dialect: 'postgres'
    },
    production: {
        url: process.env.DB_URI_PROD,
        dialect: 'postgres'
    },
    test: {
        url: process.env.DB_URI_TEST,
        dialect: 'postgres'
    }
};