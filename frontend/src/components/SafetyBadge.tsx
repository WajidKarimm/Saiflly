'use client';

import clsx from 'clsx';
import { getScoreSeverity, getScoreLabel } from '../lib/utils/helpers';

interface SafetyBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const SafetyBadge = ({ score, size = 'md', showLabel = true }: SafetyBadgeProps) => {
  const severity = getScoreSeverity(score);
  const label = getScoreLabel(score);

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg',
  };

  const severityClasses = {
    success: 'bg-green-100 text-green-700 border-green-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    error: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={clsx(
          'flex items-center justify-center rounded-full border-2 font-bold',
          sizeClasses[size],
          severityClasses[severity]
        )}
      >
        {Math.round(score)}
      </div>
      {showLabel && <span className="text-xs font-medium text-gray-600">{label}</span>}
    </div>
  );
};
