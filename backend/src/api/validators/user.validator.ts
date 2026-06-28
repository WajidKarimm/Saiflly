import { z } from 'zod';
import { isValidPhoneNumber } from '../../utils/validators';

export const UpdateProfileSchema = z.object({
  first_name: z.string().min(2).max(100).optional(),
  last_name: z.string().min(2).max(100).optional(),
  phone_number: z
    .string()
    .optional()
    .refine((phone) => !phone || isValidPhoneNumber(phone), 'Invalid phone number format'),
  preferences: z
    .object({
      email_notifications: z.boolean().optional(),
      sms_notifications: z.boolean().optional(),
      property_alerts: z.boolean().optional(),
    })
    .optional(),
});

export const GetUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type GetUserInput = z.infer<typeof GetUserSchema>;
