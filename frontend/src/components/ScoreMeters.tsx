'use client';

import { SafetyScore } from '../types';

interface ScoreMeterProps {
  scores: SafetyScore;
}

interface MeterItemProps {
  label: string;
  value: number;
  weight: number;
}

const MeterItem = ({ label, value, weight }: MeterItemProps) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {Math.round(value)} <span className="text-xs text-gray-500">({Math.round(weight * 100)}%)</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
};

export const ScoreMeters = ({ scores }: ScoreMeterProps) => {
  const weights = {
    crime: 0.35,
    area_safety: 0.25,
    facilities: 0.2,
    property_history: 0.15,
    cost_trends: 0.05,
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-900">Safety Score Breakdown</h3>

      <MeterItem label="Crime Rate" value={scores.crime_score} weight={weights.crime} />
      <MeterItem label="Area Safety" value={scores.area_safety_score} weight={weights.area_safety} />
      <MeterItem label="Facilities" value={scores.facilities_score} weight={weights.facilities} />
      <MeterItem
        label="Property History"
        value={scores.property_history_score}
        weight={weights.property_history}
      />
      <MeterItem label="Cost Trends" value={scores.cost_trends_score} weight={weights.cost_trends} />

      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Overall Safety Score</span>
          <span className="text-3xl font-bold text-blue-600">{Math.round(scores.total_score)}/100</span>
        </div>
      </div>
    </div>
  );
};
