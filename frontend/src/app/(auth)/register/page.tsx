'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/auth';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Button } from '@/components/common/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, firstName, lastName);
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Registration failed. Please try again.'
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
              <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
              <p className="text-gray-500 mt-1">
                Join NestSafely and find your safe home
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-first-name" className="form-label">
                    First Name
                  </label>
                  <input
                    id="reg-first-name"
                    type="text"
                    required
                    minLength={2}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="form-input"
                  />
                </div>
                <div>
                  <label htmlFor="reg-last-name" className="form-label">
                    Last Name
                  </label>
                  <input
                    id="reg-last-name"
                    type="text"
                    required
                    minLength={2}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="form-label">
                  Email Address
                </label>
                <input
                  id="reg-email"
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
                <label htmlFor="reg-password" className="form-label">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="form-input"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Must include uppercase, lowercase, number, and special character
                </p>
              </div>

              <div>
                <label htmlFor="reg-confirm-password" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="form-input"
                />
              </div>

              <Button type="submit" isLoading={isLoading} fullWidth size="lg">
                Create Account
              </Button>
            </form>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
