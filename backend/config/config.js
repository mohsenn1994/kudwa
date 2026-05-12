require('dotenv/config');

const base = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'kudwa',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  dialect: 'postgres',
};

const production = process.env.DATABASE_URL
  ? {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    }
  : base;

module.exports = {
  development: base,
  test: { ...base, database: process.env.DB_NAME_TEST || 'kudwa_test' },
  production,
};
