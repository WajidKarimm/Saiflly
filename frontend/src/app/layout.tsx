'use client';

import { Inter } from 'next/font/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="NestSafely — AI-powered property safety intelligence platform. Evaluate properties with comprehensive safety scores before buying or renting."
        />
        <title>NestSafely — Property Safety Intelligence</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 antialiased`}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
