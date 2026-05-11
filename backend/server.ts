import 'dotenv/config';
import app from './src/app';
import { sequelize } from './src/models';
import logger from './src/config/logger';

const PORT = process.env.PORT || 3000;

async function start(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();
