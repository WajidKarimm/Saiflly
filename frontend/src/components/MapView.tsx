'use client';

import { useEffect, useRef } from 'react';
import { MapMarker } from '../types';

interface MapViewProps {
  markers: MapMarker[];
  center?: { latitude: number; longitude: number };
  onMarkerClick?: (marker: MapMarker) => void;
}

export const MapView = ({ markers, center, onMarkerClick }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // This is a placeholder for Mapbox integration
    // In production, you would initialize Mapbox GL here
    const container = containerRef.current;
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 18px; flex-direction: column; gap: 10px;">
        <div style="font-size: 48px;">🗺️</div>
        <div>Map View - Mapbox Integration Required</div>
        <div style="font-size: 12px; opacity: 0.8;">Showing ${markers.length} properties</div>
      </div>
    `;
  }, [markers]);

  return (
    <div className="rounded-lg overflow-hidden shadow-lg">
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '500px',
          backgroundColor: '#e5e7eb',
        }}
      />
    </div>
  );
};
