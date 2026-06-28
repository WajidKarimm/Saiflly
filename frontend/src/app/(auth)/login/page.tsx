'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Button } from '@/components/common/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Invalid email or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-500 mt-1">Sign in to your NestSafely account</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="form-label">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="login-password" className="form-label mb-0">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                  Remember me for 30 days
                </label>
              </div>

              <Button type="submit" isLoading={isLoading} fullWidth size="lg">
                Sign In
              </Button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
