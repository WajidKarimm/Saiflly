'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/hooks/useAuth';
import { logout } from '../../lib/auth';
import { Button } from './Button';

export const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">🏠</div>
            <span className="text-xl font-bold text-gray-900">NestSafely</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/properties" className="text-gray-700 hover:text-blue-600">
              Properties
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">{user?.email}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
