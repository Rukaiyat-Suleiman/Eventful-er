const path = require('path');

module.exports = (PORT) => ({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Eventful-er API',
      version: '1.0.0',
      description: 'Documentation API Eventful-er'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './src/modules/**/*.routes.js',
    './src/modules/**/*.js'
  ]
});