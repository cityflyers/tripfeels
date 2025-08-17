import './globals.css';
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from 'react';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';
import { ServiceWorkerRegistration } from '@/components/ui/ServiceWorkerRegistration';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'City Flyers Dashboard',
  description: 'A secure, modern travel agency dashboard featuring seamless sign-in/sign-up and built with cutting-edge technology for efficient management.',
  keywords: ['travel', 'flights', 'dashboard', 'booking'],
  authors: [{ name: 'City Flyers' }],
  creator: 'City Flyers',
  publisher: 'City Flyers',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cityflyers.com'),
  openGraph: {
    title: 'City Flyers Dashboard',
    description: 'A secure, modern travel agency dashboard',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'City Flyers Dashboard',
    description: 'A secure, modern travel agency dashboard',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.className}>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/NordiquePro-Semibold.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//apis.google.com" />
        <link rel="dns-prefetch" href="//firebaseapp.com" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="//va.vercel-scripts.com" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://firebaseapp.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://va.vercel-scripts.com" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="City Flyers" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        
        {/* Resource hints for better performance */}
        <link rel="modulepreload" href="/_next/static/chunks/webpack.js" />
        <link rel="modulepreload" href="/_next/static/chunks/main-app.js" />
      </head>
      <body>
        <Providers>
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </div>
          }>
            {children}
          </Suspense>
        </Providers>
        <Analytics />
        <SpeedInsights />
        <PerformanceMonitor />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}