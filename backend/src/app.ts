import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import apiRoutes from './api/routes';
import { errorHandlerMiddleware, notFoundMiddleware } from './api/middleware/error-handler.middleware';
import { env } from './config/env';
import logger from './utils/logger';

const app: Express = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Request logging
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// API routes
app.use('/api/v1', apiRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundMiddleware);

// Global error handler
app.use(errorHandlerMiddleware);

export default app;
