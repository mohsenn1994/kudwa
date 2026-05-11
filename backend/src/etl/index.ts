import logger from '../config/logger';
import extractDataset1 from './extract/extractDataset1';
import extractDataset2 from './extract/extractDataset2';

export async function runPipeline(): Promise<void> {
  logger.info('ETL pipeline starting...');
  const startedAt = Date.now();

  // -- Extract Data --
  logger.info('Extracting data from sources...');
  const [set1, set2] = await Promise.all([extractDataset1(), extractDataset2()]);
  logger.info('Data extraction completed');

  const duration = (Date.now() - startedAt) / 1000;
  logger.info(`ETL pipeline completed in ${duration.toFixed(2)} seconds`);
}
