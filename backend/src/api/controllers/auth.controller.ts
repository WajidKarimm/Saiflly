import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as authService from '../../services/auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../validators/auth.validator';
import logger from '../../utils/logger';

export const register = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password, first_name, last_name, phone_number } = req.body as RegisterInput;

    const result = await authService.register(
      email,
      password,
      first_name,
      last_name,
      phone_number
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      data: result.user,
      tokens: {
        access_token: result.tokens.access_token,
        expires_in: result.tokens.expires_in,
      },
    });

    logger.info('User registration completed', { email });
  } catch (error) {
    logger.error('Registration error', { error });
    throw error;
  }
};

export const login = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password, remember_me } = req.body as LoginInput;

    const result = await authService.login(email, password);

    const cookieMaxAge = remember_me ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', result.tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieMaxAge,
    });

    res.status(200).json({
      success: true,
      data: result.user,
      tokens: {
        access_token: result.tokens.access_token,
        expires_in: result.tokens.expires_in,
      },
    });

    logger.info('User login completed', { email });
  } catch (error) {
    logger.error('Login error', { error });
    throw error;
  }
};

export const refresh = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    const tokens = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: {
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
      },
    });

    logger.debug('Token refreshed');
  } catch (error) {
    logger.error('Token refresh error', { error });
    throw error;
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });

    logger.info('User logout completed', { userId: req.user?.id });
  } catch (error) {
    logger.error('Logout error', { error });
    throw error;
  }
};

export const me = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await authService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Get current user error', { error });
    throw error;
  }
};
