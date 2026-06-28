import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query } from '../../config/database';
import { UpdateProfileInput } from '../validators/user.validator';
import { invalidateUserCache } from '../../services/cache';
import logger from '../../utils/logger';

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { first_name, last_name, phone_number, preferences } = req.body as UpdateProfileInput;

    const result = await query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone_number = COALESCE($3, phone_number),
           preferences = COALESCE($4, preferences),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone_number, role, created_at, updated_at`,
      [first_name, last_name, phone_number, preferences ? JSON.stringify(preferences) : null, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update profile');
    }

    await invalidateUserCache(req.user.id);

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Profile updated successfully',
    });

    logger.info('User profile updated', { userId: req.user.id });
  } catch (error) {
    logger.error('Update profile error', { error });
    throw error;
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const result = await query(
      'SELECT id, email, first_name, last_name, phone_number, role, preferences, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });

    logger.info('User profile retrieved', { userId: req.user.id });
  } catch (error) {
    logger.error('Get profile error', { error });
    throw error;
  }
};
