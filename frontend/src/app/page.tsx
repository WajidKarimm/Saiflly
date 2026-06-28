'use client';

import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Button } from '@/components/common/Button';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Find Your Safe Home
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              AI-powered property safety intelligence platform
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/properties">
                <Button size="lg">Search Properties</Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="lg">Get Started</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Why Choose NestSafely?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🔍',
                  title: 'AI-Powered Analysis',
                  description: 'Advanced algorithms analyze property safety from multiple data sources',
                },
                {
                  icon: '📊',
                  title: 'Comprehensive Scoring',
                  description: 'Get detailed safety scores covering crime, facilities, and area statistics',
                },
                {
                  icon: '🗺️',
                  title: 'Location Intelligence',
                  description: 'Interactive maps and neighborhood data to help you make informed decisions',
                },
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { number: '10K+', label: 'Properties' },
                { number: '95%', label: 'Accuracy' },
                { number: '50K+', label: 'Users' },
                { number: '24/7', label: 'Support' },
              ].map((stat, index) => (
                <div key={index}>
                  <p className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Safe Home?</h2>
            <p className="text-lg mb-8 text-blue-100">
              Start searching for properties with comprehensive safety analysis today
            </p>
            <Link href="/properties">
              <Button variant="secondary" size="lg">Start Searching</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
