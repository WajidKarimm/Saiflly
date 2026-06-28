import { z } from 'zod';
import { isValidCoordinates, isValidBudgetRange } from '../../utils/validators';

export const SearchPropertiesSchema = z.object({
  latitude: z.number().refine((lat) => lat >= -90 && lat <= 90, 'Invalid latitude'),
  longitude: z.number().refine((lng) => lng >= -180 && lng <= 180, 'Invalid longitude'),
  radius_km: z.number().min(0.5).max(50).default(5),
  property_type: z.enum(['house', 'apartment', 'townhouse', 'commercial', 'land']).optional(),
  min_budget: z.number().positive().optional(),
  max_budget: z.number().positive().optional(),
  page: z.number().positive().default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const PropertyDetailSchema = z.object({
  id: z.string().uuid('Invalid property ID'),
});

export const SavePropertySchema = z.object({
  property_id: z.string().uuid('Invalid property ID'),
  notes: z.string().max(500).optional(),
});

export const SavedPropertiesSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z.enum(['saved_date', 'safety_score', 'price']).default('saved_date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchPropertiesInput = z.infer<typeof SearchPropertiesSchema>;
export type PropertyDetailInput = z.infer<typeof PropertyDetailSchema>;
export type SavePropertyInput = z.infer<typeof SavePropertySchema>;
export type SavedPropertiesInput = z.infer<typeof SavedPropertiesSchema>;
