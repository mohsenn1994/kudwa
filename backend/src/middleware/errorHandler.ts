import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';

type ErrorResponse = {
  errorMessage?: string;
  stackTrace?: string;
}

export function getErrorHandler() {
  const errorHandler = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction, // albeit not used, it's required for express to direct some errors to this middleware
  ) => {
    const errStatus = err.statusCode || 500;
    const errMsg = err.message || 'Internal server error';
    const response: ErrorResponse = {
      errorMessage: errMsg,
    };

    if (process.env.NODE_ENV === 'development') {
      response.stackTrace = err.stack;
    }

    logger.error('Error caught in error handler middleware', {
      method: 'errorHandler',
      errorMessage: err.message,
      errorStack: err.stack,
    });

    res.status(errStatus).json(response);
  };

  return errorHandler;
}
