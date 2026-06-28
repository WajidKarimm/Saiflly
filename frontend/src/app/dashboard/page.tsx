'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSavedProperties } from '@/lib/hooks/useSavedProperties';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { properties: savedProperties, isLoading: savedLoading } =
    useSavedProperties();

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
            <div className="space-y-6">
              <div className="h-10 skeleton w-64" />
              <div className="grid md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 skeleton rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated || !user) return null;

  const stats = [
    {
      icon: '🏠',
      label: 'Saved Properties',
      value: savedLoading ? '...' : savedProperties.length.toString(),
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/saved',
    },
    {
      icon: '🔍',
      label: 'Searches Today',
      value: '—',
      color: 'from-emerald-500 to-emerald-600',
      href: '/properties',
    },
    {
      icon: '📊',
      label: 'Safety Reports',
      value: '—',
      color: 'from-purple-500 to-purple-600',
      href: '#',
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Welcome banner */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, {user.first_name}!
            </h1>
            <p className="text-blue-100">
              Here&apos;s an overview of your property safety dashboard
            </p>
          </div>
        </section>

        <div className="page-container">
          {/* Stats cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{stat.icon}</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${stat.color}`}
                  >
                    View →
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/properties">
                <Button variant="primary" fullWidth>
                  🔍 Search Properties
                </Button>
              </Link>
              <Link href="/dashboard/saved">
                <Button variant="secondary" fullWidth>
                  ❤️ Saved Properties
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="secondary" fullWidth>
                  🗺️ Map Explorer
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="secondary" fullWidth>
                  📊 Compare Areas
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile summary */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Your Profile
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="font-medium text-gray-900 capitalize">
                  {user.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-900">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
