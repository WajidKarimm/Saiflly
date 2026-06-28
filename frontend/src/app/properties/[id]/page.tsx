'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PropertyDetail } from '@/components/PropertyDetail';
import { Button } from '@/components/common/Button';
import { usePropertyDetail } from '@/lib/hooks/useProperties';
import { useSavedProperties } from '@/lib/hooks/useSavedProperties';
import { useAuth } from '@/lib/hooks/useAuth';
import { PropertyDetail as PropertyDetailType } from '@/types';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { isAuthenticated } = useAuth();
  const { property, safetyScore, aiVerdict, isLoading, error } =
    usePropertyDetail(propertyId);
  const { saveProperty, isSaving } = useSavedProperties();

  const handleSave = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    saveProperty(propertyId);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="page-container">
            {/* Back nav */}
            <div className="mb-6">
              <div className="h-4 skeleton w-32" />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="h-8 skeleton w-3/4" />
                  <div className="h-4 skeleton w-1/3" />
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 skeleton rounded-lg" />
                    ))}
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 skeleton" />
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="h-32 skeleton rounded-lg" />
                  <div className="h-12 skeleton rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🏚️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Property Not Found
            </h1>
            <p className="text-gray-500 mb-6">
              The property you&apos;re looking for doesn&apos;t exist or has
              been removed.
            </p>
            <Link href="/properties">
              <Button>← Back to Properties</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Build the detail object expected by PropertyDetail component
  const detailData: PropertyDetailType = {
    property: property,
    safety_score: safetyScore!,
    ai_verdict: aiVerdict!,
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="page-container">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/properties"
              className="hover:text-blue-600 transition-colors"
            >
              Properties
            </Link>
            <span>›</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">
              {property.address}
            </span>
          </nav>

          {/* Property Detail */}
          {safetyScore && aiVerdict ? (
            <PropertyDetail
              property={detailData}
              onSave={handleSave}
              isSaving={isSaving}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {property.address}
              </h1>
              <p className="text-gray-500">
                Safety analysis is being computed…
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
