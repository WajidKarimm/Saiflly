import app from './app';
import { env, validateEnv } from './config/env';
import logger from './utils/logger';
import { getPool } from './config/database';

const startServer = async () => {
  try {
    // Validate environment variables
    validateEnv();

    // Test database connection
    const pool = getPool();
    const client = await pool.connect();
    logger.info('Connected to database');
    client.release();

    // Start server
    const PORT = env.PORT;
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Frontend URL: ${env.FRONTEND_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', { promise, reason });
  process.exit(1);
});

startServer();
