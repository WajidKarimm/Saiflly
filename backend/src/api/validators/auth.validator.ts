import { z } from 'zod';
import { isValidPassword, isValidPhoneNumber } from '../../utils/validators';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (pass) => isValidPassword(pass).valid,
      (pass) => ({
        message: isValidPassword(pass).errors.join(', '),
      })
    ),
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  phone_number: z.string().optional().refine(
    (phone) => !phone || isValidPhoneNumber(phone),
    'Invalid phone number format'
  ),
  role: z.enum(['user', 'admin']).default('user').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().default(false).optional(),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1, 'Old password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (pass) => isValidPassword(pass).valid,
      (pass) => ({
        message: isValidPassword(pass).errors.join(', '),
      })
    ),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
