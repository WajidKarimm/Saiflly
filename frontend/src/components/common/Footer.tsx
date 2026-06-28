'use client';

import Link from 'next/link';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4">NestSafely</h3>
            <p className="text-gray-400">Property Safety Intelligence Platform</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/properties" className="text-gray-400 hover:text-white">
                  Search Properties
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-400">
            © {currentYear} NestSafely. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
