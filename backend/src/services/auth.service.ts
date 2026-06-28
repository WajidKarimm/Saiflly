import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { query } from '../config/database';
import { setCache, getCache } from '../config/redis';
import { AuthenticationError, ConflictError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export const generateTokens = (userId: string, email: string, role: string): AuthTokens => {
  const access_token = jwt.sign(
    { id: userId, email, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRY }
  );

  const refresh_token = jwt.sign(
    { id: userId, email },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY }
  );

  return {
    access_token,
    refresh_token,
    expires_in: 3600, // 1 hour
  };
};

export const register = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phoneNumber?: string
): Promise<{ user: Partial<User>; tokens: AuthTokens }> => {
  // Check if user exists
  const existing = await query<User>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  // Create user
  const result = await query<User>(
    `INSERT INTO users (id, email, password, first_name, last_name, phone_number, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING id, email, first_name, last_name, phone_number, role, created_at, updated_at`,
    [userId, email, hashedPassword, firstName, lastName, phoneNumber || null, 'user']
  );

  if (result.rows.length === 0) {
    throw new Error('Failed to create user');
  }

  const user = result.rows[0];
  const tokens = generateTokens(user.id, user.email, user.role);

  logger.info('User registered', { userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at,
    },
    tokens,
  };
};

export const login = async (
  email: string,
  password: string
): Promise<{ user: Partial<User>; tokens: AuthTokens }> => {
  const result = await query<User & { password: string }>(
    'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AuthenticationError('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid email or password');
  }

  const tokens = generateTokens(user.id, user.email, user.role);

  logger.info('User logged in', { userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
    tokens,
  };
};

export const refreshAccessToken = async (refreshToken: string): Promise<AuthTokens> => {
  try {
    const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as {
      id: string;
      email: string;
    };

    const result = await query<User>(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User');
    }

    const user = result.rows[0];
    const tokens = generateTokens(user.id, user.email, user.role);

    return tokens;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  const cached = await getCache<User>(`user:${userId}`);
  if (cached) return cached;

  const result = await query<User>(
    'SELECT id, email, first_name, last_name, phone_number, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User');
  }

  const user = result.rows[0];
  await setCache(`user:${userId}`, user, 3600);

  return user;
};
