'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { MapView } from '@/components/MapView';
import { Button } from '@/components/common/Button';
import { useProperties } from '@/lib/hooks/useProperties';
import { MapMarker, PropertyWithScore } from '@/types';

export default function PropertiesPage() {
  const [searchCoords, setSearchCoords] = useState<{
    latitude: number;
    longitude: number;
    radius: number;
  } | null>(null);

  const {
    properties,
    pagination,
    isLoading,
    error,
    page,
    nextPage,
    prevPage,
  } = useProperties(
    searchCoords?.latitude ?? 0,
    searchCoords?.longitude ?? 0,
    searchCoords?.radius ?? 5
  );

  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const handleSearch = useCallback(
    (latitude: number, longitude: number, radius: number) => {
      setSearchCoords({ latitude, longitude, radius });
    },
    []
  );

  // Build map markers from properties
  const markers: MapMarker[] = properties.map((p: PropertyWithScore) => ({
    id: p.id,
    latitude: p.latitude,
    longitude: p.longitude,
    title: p.address,
    score: p.safety_score?.total_score ?? 0,
    address: p.address,
  }));

  const hasSearched = searchCoords !== null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Page header */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Search Properties
            </h1>
            <p className="text-blue-100 text-lg">
              Explore properties with AI-powered safety analysis
            </p>
          </div>
        </section>

        <div className="page-container">
          {/* Search */}
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />

          {/* View toggle */}
          {hasSearched && properties.length > 0 && (
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing{' '}
                <span className="font-semibold text-gray-900">
                  {properties.length}
                </span>{' '}
                of {pagination?.total ?? 0} properties
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Map
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              Failed to load properties. Please try again.
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="h-48 skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 skeleton w-3/4" />
                    <div className="h-3 skeleton w-1/2" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-8 skeleton" />
                      <div className="h-8 skeleton" />
                      <div className="h-8 skeleton" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No search yet */}
          {!hasSearched && !isLoading && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Start Your Search
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Use the search bar above to find properties near your desired
                location. You can also use your current location.
              </p>
            </div>
          )}

          {/* No results */}
          {hasSearched && !isLoading && properties.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Properties Found
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Try expanding your search radius or searching in a different
                area.
              </p>
            </div>
          )}

          {/* Results */}
          {!isLoading && properties.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property: PropertyWithScore) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <MapView
                  markers={markers}
                  center={
                    searchCoords
                      ? {
                          latitude: searchCoords.latitude,
                          longitude: searchCoords.longitude,
                        }
                      : undefined
                  }
                />
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-10">
                  <Button
                    variant="secondary"
                    onClick={prevPage}
                    disabled={page <= 1}
                  >
                    ← Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {pagination.pages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={nextPage}
                    disabled={page >= pagination.pages}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
