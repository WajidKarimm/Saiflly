'use client';

import { PropertyDetail as PropertyDetailType, AIVerdict } from '../types';
import { SafetyBadge } from './SafetyBadge';
import { ScoreMeters } from './ScoreMeters';
import { formatPropertyType } from '../lib/utils/formatting';
import { formatCurrency } from '../lib/utils/helpers';
import { Button } from './common/Button';

interface PropertyDetailProps {
  property: PropertyDetailType;
  onSave?: () => void;
  isSaving?: boolean;
}

const AIVerdictDisplay = ({ verdict }: { verdict: AIVerdict }) => {
  const riskColors = {
    low: 'bg-green-50 border-green-200',
    medium: 'bg-yellow-50 border-yellow-200',
    high: 'bg-red-50 border-red-200',
  };

  const riskBadgeColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className={`border rounded-lg p-6 ${riskColors[verdict.risk_level]}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Verdict</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskBadgeColors[verdict.risk_level]}`}>
          {verdict.risk_level.charAt(0).toUpperCase() + verdict.risk_level.slice(1)} Risk
        </span>
      </div>

      <p className="text-gray-700 mb-4">{verdict.summary}</p>

      <div className="bg-white bg-opacity-50 rounded p-4 mb-4">
        <p className="text-gray-900 font-medium">{verdict.recommendation}</p>
      </div>

      {verdict.key_factors.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Factors</h4>
          <ul className="list-disc list-inside space-y-1">
            {verdict.key_factors.map((factor, index) => (
              <li key={index} className="text-sm text-gray-700">
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {verdict.considerations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Considerations</h4>
          <ul className="list-disc list-inside space-y-1">
            {verdict.considerations.map((consideration, index) => (
              <li key={index} className="text-sm text-gray-700">
                {consideration}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const PropertyDetail = ({ property, onSave, isSaving }: PropertyDetailProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.property.address}</h1>
            <p className="text-lg text-gray-600">{formatPropertyType(property.property.property_type)}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Price</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(property.property.price)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Size</p>
              <p className="text-2xl font-bold text-gray-900">{property.property.size_sqft} sqft</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bedrooms</p>
              <p className="text-2xl font-bold text-gray-900">{property.property.bedrooms}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bathrooms</p>
              <p className="text-2xl font-bold text-gray-900">{property.property.bathrooms}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Safety Assessment</h2>
            <ScoreMeters scores={property.safety_score} />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Powered Verdict</h2>
            <AIVerdictDisplay verdict={property.ai_verdict} />
          </div>
        </div>

        <div>
          <div className="sticky top-24">
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
              <SafetyBadge score={property.safety_score.total_score} size="lg" />
            </div>

            {onSave && (
              <Button
                onClick={onSave}
                isLoading={isSaving}
                fullWidth
                className="mb-4"
              >
                Save Property
              </Button>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
              <p className="text-sm text-gray-600 mb-2">
                Latitude: {property.property.latitude.toFixed(4)}
              </p>
              <p className="text-sm text-gray-600">
                Longitude: {property.property.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
