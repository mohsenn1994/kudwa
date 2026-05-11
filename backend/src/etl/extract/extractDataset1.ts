import fs from 'fs';
import path from 'path';
import logger from '../../config/logger';

// Extract function for Dataset 1
// Reads data_set_1 JSON file and returns its contents as an object
async function extractDataset1(): Promise<unknown> {
  logger.info('Starting extraction of Dataset 1');
  const filePath = process.env.DATASET_1_PATH
    ? path.resolve(process.env.DATASET_1_PATH)
    : path.resolve(__dirname, '../../../data/data_set_1.json');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset 1 not found at: ${filePath}`);
  }

  logger.info(`Dataset 1 found at: ${filePath}, starting to read...`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  logger.info('Dataset 1 extraction completed');
  return data;
}

export default extractDataset1;
