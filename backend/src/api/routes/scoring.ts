import express from 'express';
import * as scoringController from '../controllers/scoring.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Calculate safety score
router.post(
  '/calculate',
  optionalAuthMiddleware,
  scoringController.calculateScore
);

// Get score breakdown
router.get(
  '/:property_id/breakdown',
  optionalAuthMiddleware,
  scoringController.getScoreBreakdown
);

export default router;
