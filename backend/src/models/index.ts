import { Sequelize } from 'sequelize';
import config from '../config/database';

export const sequelize = new Sequelize(
  config.database as string,
  config.username as string,
  config.password ?? undefined,
  {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: config.logging,
  }
);

