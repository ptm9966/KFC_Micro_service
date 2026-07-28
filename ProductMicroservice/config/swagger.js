const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product Microservice API',
      version: '1.0.0',
      description: 'API documentation for Product Management Microservice',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8083}`,
        description: 'Product Microservice Server',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../features/**/*.route.js'), // Path to the API routes
    path.join(__dirname, '../index.js'), // Include root index for root-level endpoints
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;