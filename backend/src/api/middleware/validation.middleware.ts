import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = schema.parse({
        ...req.body,
        ...req.params,
        ...req.query,
      });

      // Attach validated data to request
      req.body = validated;
      next();
    } catch (error: any) {
      const errorMessages = error.errors
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');

      logger.debug('Validation error', { errors: error.errors });
      next(new ValidationError(errorMessages));
    }
  };
};

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      const errorMessages = error.errors
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');

      logger.debug('Body validation error', { errors: error.errors });
      next(new ValidationError(errorMessages));
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error: any) {
      const errorMessages = error.errors
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');

      logger.debug('Params validation error', { errors: error.errors });
      next(new ValidationError(errorMessages));
    }
  };
};
