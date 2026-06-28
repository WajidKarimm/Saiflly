'use client';

import { useState } from 'react';
import { Button } from './common/Button';

interface SearchBarProps {
  onSearch: (latitude: number, longitude: number, radius: number) => void;
  isLoading?: boolean;
}

export const SearchBar = ({ onSearch, isLoading = false }: SearchBarProps) => {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(5);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onSearch(latitude, longitude, radius);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enable location services.');
      }
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Search Properties</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location or use current location"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
            Search Radius: {radius} km
          </label>
          <input
            id="radius"
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex gap-4">
          <Button onClick={handleGetLocation} isLoading={isLoading} className="flex-1">
            Use My Location
          </Button>
          <Button variant="secondary" className="flex-1">
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};
