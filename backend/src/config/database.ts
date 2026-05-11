import 'dotenv/config';

const config = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'kudwa',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  dialect: 'postgres' as const,
  logging: false,
};

export const development = config;
export default config;
