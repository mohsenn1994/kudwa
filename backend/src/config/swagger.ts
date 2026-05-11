import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kudwa ETL API',
      version: '1.0.0',
      description: 'Kudwa ETL Financial Data Application',
    },
    servers: [{ url: 'http://localhost:3000/api', description: 'Development server' }],
    tags: [
      { name: 'Integration', description: 'Trigger and monitor ETL pipeline' },
      { name: 'Reports', description: 'Retrieve integrated P&L data' },
    ],
  },
  apis: ['./src/api/routes/*.ts', './src/api/controllers/*.ts'],
};

export default swaggerJsdoc(options);
