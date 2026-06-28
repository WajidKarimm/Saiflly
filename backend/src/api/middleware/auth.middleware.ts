import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthenticationError } from '../../utils/errors';
import logger from '../../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    logger.debug('Optional auth validation failed', { error });
    next();
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthenticationError('Admin access required');
    }
    next();
  } catch (error) {
    next(error);
  }
};
