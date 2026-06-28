import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
  timestamp: string;
  path?: string;
}

export const errorHandlerMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    logger.warn('Application error', {
      statusCode: err.statusCode,
      message: err.message,
      code: err.errorCode,
      path: req.path,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.errorCode || 'UNKNOWN_ERROR',
        message: err.message,
        statusCode: err.statusCode,
      },
      timestamp,
      path: req.path,
    };

    res.status(err.statusCode).json(response);
    return;
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
    timestamp,
    path: req.path,
  };

  res.status(500).json(response);
};

export const notFoundMiddleware = (req: Request, res: Response): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.path} not found`,
      statusCode: 404,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  res.status(404).json(response);
};
