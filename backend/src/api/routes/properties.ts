import express from 'express';
import * as propertiesController from '../controllers/properties.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  SearchPropertiesSchema,
  PropertyDetailSchema,
  SavePropertySchema,
} from '../validators/property.validator';

const router = express.Router();

// Search properties
router.post(
  '/search',
  optionalAuthMiddleware,
  validateBody(SearchPropertiesSchema),
  propertiesController.searchProperties
);

// Get property detail
router.get(
  '/:id',
  optionalAuthMiddleware,
  validateParams(PropertyDetailSchema),
  propertiesController.getPropertyDetail
);

// Save property (requires auth)
router.post(
  '/:id/save',
  authMiddleware,
  validateBody(SavePropertySchema),
  propertiesController.saveProperty
);

// Get saved properties (requires auth)
router.get(
  '/user/saved',
  authMiddleware,
  propertiesController.getSavedProperties
);

export default router;
