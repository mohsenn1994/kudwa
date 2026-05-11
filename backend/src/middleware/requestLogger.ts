import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
  });
  next();
};

export default requestLogger;
