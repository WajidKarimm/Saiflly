'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Button } from '@/components/common/Button';
import { SafetyBadge } from '@/components/SafetyBadge';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSavedProperties } from '@/lib/hooks/useSavedProperties';
import { formatCurrency } from '@/lib/utils/helpers';
import { formatPropertyType, formatRelativeTime } from '@/lib/utils/formatting';

export default function SavedPropertiesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    properties,
    pagination,
    isLoading,
    page,
    nextPage,
    prevPage,
  } = useSavedProperties();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="page-container">
            <div className="h-8 skeleton w-48 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 skeleton rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Page header */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-10 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Saved Properties</h1>
              <p className="text-blue-100">
                Your curated collection of properties
              </p>
            </div>
            <Link href="/properties">
              <Button variant="secondary">+ Find More</Button>
            </Link>
          </div>
        </section>

        <div className="page-container">
          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md p-6 flex gap-6"
                >
                  <div className="w-32 h-24 skeleton rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 skeleton w-2/3" />
                    <div className="h-4 skeleton w-1/3" />
                    <div className="h-3 skeleton w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && properties.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">❤️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Saved Properties Yet
              </h2>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Start exploring properties and save the ones you like.
                They&apos;ll appear here for easy access.
              </p>
              <Link href="/properties">
                <Button size="lg">Explore Properties</Button>
              </Link>
            </div>
          )}

          {/* Saved list */}
          {!isLoading && properties.length > 0 && (
            <>
              <div className="space-y-4">
                {properties.map((saved: any) => (
                  <Link
                    key={saved.id}
                    href={`/properties/${saved.property_id}`}
                    className="block"
                  >
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all flex items-center gap-6">
                      {/* Image placeholder */}
                      <div className="w-28 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">🏠</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {saved.property?.address || 'Property'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          {saved.property?.property_type && (
                            <span>
                              {formatPropertyType(saved.property.property_type)}
                            </span>
                          )}
                          {saved.property?.price && (
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(saved.property.price)}
                            </span>
                          )}
                        </div>
                        {saved.notes && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            📝 {saved.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Saved {formatRelativeTime(saved.saved_at)}
                        </p>
                      </div>

                      {/* Score badge */}
                      <div className="flex-shrink-0 hidden sm:block">
                        {saved.property?.safety_score ? (
                          <SafetyBadge
                            score={saved.property.safety_score.total_score}
                            size="sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-sm text-gray-400">
                            —
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <span className="text-gray-300 text-lg flex-shrink-0">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

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
