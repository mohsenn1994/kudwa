import logger from '../config/logger';

export async function runPipeline(): Promise<void> {
  logger.info('ETL pipeline starting...');
}
