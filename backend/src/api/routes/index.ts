import express from 'express';
import authRoutes from './auth';
import propertiesRoutes from './properties';
import usersRoutes from './users';
import scoringRoutes from './scoring';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/properties', propertiesRoutes);
router.use('/users', usersRoutes);
router.use('/scoring', scoringRoutes);

export default router;
