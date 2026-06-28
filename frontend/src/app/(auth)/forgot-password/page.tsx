'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Button } from '@/components/common/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // NOTE: Backend forgot-password endpoint is not implemented yet.
      // This is a placeholder that simulates success for the UI flow.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          'Something went wrong. Please try again.'
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
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
                <span className="text-2xl">🔑</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
              <p className="text-gray-500 mt-1">
                {isSubmitted
                  ? 'Check your inbox for further instructions'
                  : 'Enter your email and we'll send you a reset link'}
              </p>
            </div>

            {isSubmitted ? (
              /* ── Success state ──────────────────────────────────── */
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <span className="text-3xl">✉️</span>
                </div>
                <div>
                  <p className="text-gray-700 mb-1">
                    If an account exists for <strong>{email}</strong>, you will receive a
                    password reset email shortly.
                  </p>
                  <p className="text-sm text-gray-400">
                    Didn&apos;t receive the email? Check your spam folder.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button onClick={() => setIsSubmitted(false)} variant="secondary" fullWidth>
                    Try another email
                  </Button>
                  <Link href="/login">
                    <Button variant="ghost" fullWidth>
                      ← Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* ── Form state ─────────────────────────────────────── */
              <>
                {error && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="forgot-email" className="form-label">
                      Email Address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="form-input"
                    />
                  </div>

                  <Button type="submit" isLoading={isLoading} fullWidth size="lg">
                    Send Reset Link
                  </Button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Remember your password?{' '}
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
