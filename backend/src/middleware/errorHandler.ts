import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';

export function getErrorHandler() {
  const errorHandler = (
    err: Error & { status?: number; statusCode?: number },
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction, // required for Express to recognise this as an error handler
  ) => {
    const status = err.status ?? err.statusCode ?? 500;
    const message = err.message || 'Internal server error';

    logger.error('Request error', {
      method: req.method,
      url: req.url,
      status,
      message,
      stack: err.stack,
    });

    const body: Record<string, unknown> = { success: false, message };

    if (process.env.NODE_ENV === 'development') {
      body.stack = err.stack;
    }

    res.status(status).json(body);
  };

  return errorHandler;
}
