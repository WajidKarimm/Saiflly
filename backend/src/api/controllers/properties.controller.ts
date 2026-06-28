import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as databaseService from '../../services/database';
import * as scoringService from '../../services/scoring';
import * as aiVerdictService from '../../services/ai-verdict';
import { SearchPropertiesInput, SavePropertyInput, SavedPropertiesInput } from '../validators/property.validator';
import logger from '../../utils/logger';

export const searchProperties = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { latitude, longitude, radius_km, page, limit } = req.body as SearchPropertiesInput;

    const offset = (page - 1) * limit;

    const { properties, total } = await databaseService.searchProperties(
      latitude,
      longitude,
      radius_km || 5,
      limit,
      offset
    );

    // Calculate safety scores for each property
    const propertiesWithScores = await Promise.all(
      properties.map(async (property) => {
        const score = await databaseService.getSafetyScore(property.id) ||
          (await scoringService.calculateSafetyScore(property.id, property.latitude, property.longitude));
        return { ...property, safety_score: score };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        properties: propertiesWithScores,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });

    logger.info('Properties searched', { latitude, longitude, count: properties.length });
  } catch (error) {
    logger.error('Search properties error', { error });
    throw error;
  }
};

export const getPropertyDetail = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await databaseService.getPropertyById(id);
    const safetyScore = await databaseService.getSafetyScore(id) ||
      (await scoringService.calculateSafetyScore(id, property.latitude, property.longitude));

    const aiVerdict = await aiVerdictService.generateAIVerdict(property.address, safetyScore as any);

    res.status(200).json({
      success: true,
      data: {
        property,
        safety_score: safetyScore,
        ai_verdict: aiVerdict,
      },
    });

    logger.info('Property detail retrieved', { propertyId: id });
  } catch (error) {
    logger.error('Get property detail error', { error });
    throw error;
  }
};

export const saveProperty = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { property_id, notes } = req.body as SavePropertyInput;

    const saved = await databaseService.saveProperty(req.user.id, property_id, notes);

    res.status(200).json({
      success: true,
      data: saved,
      message: 'Property saved successfully',
    });

    logger.info('Property saved', { userId: req.user.id, propertyId: property_id });
  } catch (error) {
    logger.error('Save property error', { error });
    throw error;
  }
};

export const getSavedProperties = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { page = 1, limit = 20 } = req.query as unknown as SavedPropertiesInput;
    const offset = (page - 1) * limit;

    const { properties, total } = await databaseService.getSavedProperties(
      req.user.id,
      limit,
      offset
    );

    res.status(200).json({
      success: true,
      data: {
        properties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });

    logger.info('Saved properties retrieved', { userId: req.user.id, count: properties.length });
  } catch (error) {
    logger.error('Get saved properties error', { error });
    throw error;
  }
};
