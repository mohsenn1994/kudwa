import fs from 'fs';
import path from 'path';
import logger from '../../config/logger';

// Extract function for Dataset 2
// Reads data_set_2 JSON file and returns its contents as an object
async function extractDataset2(): Promise<unknown> {
  logger.info('Starting extraction of Dataset 2');
  const filePath = process.env.DATASET_2_PATH
    ? path.resolve(process.env.DATASET_2_PATH)
    : path.resolve(__dirname, '../../../data/data_set_2.json');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset 2 not found at: ${filePath}`);
  }

  logger.info(`Dataset 2 found at: ${filePath}, starting to read...`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  logger.info('Dataset 2 extraction completed');
  return data;
}

export default extractDataset2;
