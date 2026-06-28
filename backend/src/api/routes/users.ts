import express from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { UpdateProfileSchema } from '../validators/user.validator';

const router = express.Router();

// Get current user profile
router.get('/profile', authMiddleware, usersController.getProfile);

// Update user profile
router.put(
  '/profile',
  authMiddleware,
  validateBody(UpdateProfileSchema),
  usersController.updateProfile
);

export default router;
