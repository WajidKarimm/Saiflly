import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as scoringService from '../../services/scoring';
import * as aiVerdictService from '../../services/ai-verdict';
import * as databaseService from '../../services/database';
import logger from '../../utils/logger';

export const calculateScore = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { property_id, latitude, longitude, address } = req.body;

    if (!property_id || latitude === undefined || longitude === undefined) {
      throw new Error('Missing required fields: property_id, latitude, longitude');
    }

    const scoringFactors = await scoringService.calculateSafetyScore(
      property_id,
      latitude,
      longitude
    );

    // Save to database
    await databaseService.saveSafetyScore({
      property_id,
      total_score: scoringFactors.totalScore,
      crime_score: scoringFactors.crimeScore,
      area_safety_score: scoringFactors.areaSafetyScore,
      facilities_score: scoringFactors.facilitiesScore,
      property_history_score: scoringFactors.propertyHistoryScore,
      cost_trends_score: scoringFactors.costTrendsScore,
    });

    // Generate AI verdict if address provided
    const aiVerdict = address
      ? await aiVerdictService.generateAIVerdict(address, scoringFactors)
      : null;

    res.status(200).json({
      success: true,
      data: {
        property_id,
        scoring_factors: scoringFactors,
        ai_verdict: aiVerdict,
      },
    });

    logger.info('Safety score calculated', { propertyId: property_id, score: scoringFactors.totalScore });
  } catch (error) {
    logger.error('Calculate score error', { error });
    throw error;
  }
};

export const getScoreBreakdown = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { property_id } = req.params;

    const score = await databaseService.getSafetyScore(property_id);

    if (!score) {
      throw new Error('Safety score not found');
    }

    const breakdown = {
      total_score: score.total_score,
      components: {
        crime: {
          score: score.crime_score,
          weight: 0.35,
          weighted_value: score.crime_score * 0.35,
        },
        area_safety: {
          score: score.area_safety_score,
          weight: 0.25,
          weighted_value: score.area_safety_score * 0.25,
        },
        facilities: {
          score: score.facilities_score,
          weight: 0.2,
          weighted_value: score.facilities_score * 0.2,
        },
        property_history: {
          score: score.property_history_score,
          weight: 0.15,
          weighted_value: score.property_history_score * 0.15,
        },
        cost_trends: {
          score: score.cost_trends_score,
          weight: 0.05,
          weighted_value: score.cost_trends_score * 0.05,
        },
      },
      calculated_at: score.calculated_at,
    };

    res.status(200).json({
      success: true,
      data: breakdown,
    });

    logger.info('Score breakdown retrieved', { propertyId: property_id });
  } catch (error) {
    logger.error('Get score breakdown error', { error });
    throw error;
  }
};
