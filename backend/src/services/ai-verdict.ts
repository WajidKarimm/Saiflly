import axios from 'axios';
import { env } from '../config/env';
import { getCache, setCache } from '../config/redis';
import { CACHE_TTL } from '../utils/constants';
import { ScoringResult } from './scoring';
import logger from '../utils/logger';

export interface AIVerdict {
  summary: string;
  recommendation: string;
  risk_level: 'low' | 'medium' | 'high';
  key_factors: string[];
  considerations: string[];
}

export const generateAIVerdict = async (
  propertyAddress: string,
  scoringFactors: ScoringResult
): Promise<AIVerdict> => {
  const cacheKey = `verdict:${propertyAddress}:${scoringFactors.totalScore}`;
  const cached = await getCache<AIVerdict>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `Analyze the following property safety scores and provide a comprehensive verdict for potential buyers/renters:

Property Address: ${propertyAddress}

Safety Scores:
- Overall Safety Score: ${scoringFactors.totalScore}/100
- Crime Score: ${scoringFactors.crimeScore}/100
- Area Safety Score: ${scoringFactors.areaSafetyScore}/100
- Facilities Proximity Score: ${scoringFactors.facilitiesScore}/100
- Property History Score: ${scoringFactors.propertyHistoryScore}/100
- Cost Trends Score: ${scoringFactors.costTrendsScore}/100

Please provide:
1. A brief summary of the property's safety profile (2-3 sentences)
2. A specific recommendation for potential buyers/renters
3. Risk level assessment (low, medium, high)
4. Key factors affecting the score (3-5 bullet points)
5. Important considerations or warnings (if any)

Respond in JSON format with keys: summary, recommendation, risk_level, key_factors (array), considerations (array)`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'x-api-key': env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    const content = response.data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const verdict: AIVerdict = JSON.parse(jsonMatch[0]);

    await setCache(cacheKey, verdict, CACHE_TTL.VERDICTS);
    logger.info('AI verdict generated', { address: propertyAddress, riskLevel: verdict.risk_level });

    return verdict;
  } catch (error) {
    logger.error('Error generating AI verdict', { error, address: propertyAddress });

    // Return a fallback verdict based on scores
    return generateFallbackVerdict(scoringFactors);
  }
};

const generateFallbackVerdict = (scores: ScoringResult): AIVerdict => {
  const totalScore = scores.totalScore;
  let riskLevel: 'low' | 'medium' | 'high';
  let recommendation: string;

  if (totalScore >= 80) {
    riskLevel = 'low';
    recommendation = 'This property appears to be in a safe area with good infrastructure. Highly recommended for purchase or rental.';
  } else if (totalScore >= 60) {
    riskLevel = 'medium';
    recommendation = 'This property is in a moderately safe area. Suitable for most buyers/renters with some precautions recommended.';
  } else {
    riskLevel = 'high';
    recommendation = 'This property is in a higher-risk area. Exercise caution and consider alternative locations if safety is a primary concern.';
  }

  const summary = `This property has an overall safety score of ${totalScore}/100. ${
    riskLevel === 'low'
      ? 'The area is well-developed with good security infrastructure.'
      : riskLevel === 'medium'
      ? 'The area has moderate safety metrics with some areas of concern.'
      : 'The area has notable safety concerns that should be considered carefully.'
  }`;

  return {
    summary,
    recommendation,
    risk_level: riskLevel,
    key_factors: [
      `Crime Rate: ${scores.crimeScore}/100`,
      `Area Safety: ${scores.areaSafetyScore}/100`,
      `Facilities Access: ${scores.facilitiesScore}/100`,
      `Property History: ${scores.propertyHistoryScore}/100`,
    ],
    considerations: [
      'Verify all scores with local authorities',
      'Visit the area during different times of day',
      'Consult with local residents',
      'Check insurance rates for the area',
    ],
  };
};
