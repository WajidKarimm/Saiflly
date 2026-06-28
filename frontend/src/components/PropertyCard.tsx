'use client';

import Link from 'next/link';
import { PropertyWithScore } from '../types';
import { SafetyBadge } from './SafetyBadge';
import { formatCurrency } from '../lib/utils/helpers';
import { formatPropertyType } from '../lib/utils/formatting';

interface PropertyCardProps {
  property: PropertyWithScore;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <Link href={`/properties/${property.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
        {/* Image placeholder */}
        <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <span className="text-4xl">🏠</span>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{property.address}</h3>
              <p className="text-sm text-gray-600">{formatPropertyType(property.property_type)}</p>
            </div>
            <SafetyBadge score={property.safety_score.total_score} size="sm" showLabel={false} />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Beds</span>
              <p className="font-semibold text-gray-900">{property.bedrooms}</p>
            </div>
            <div>
              <span className="text-gray-600">Baths</span>
              <p className="font-semibold text-gray-900">{property.bathrooms}</p>
            </div>
            <div>
              <span className="text-gray-600">Size</span>
              <p className="font-semibold text-gray-900">{property.size_sqft} sqft</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-bold text-blue-600">{formatCurrency(property.price)}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
