import Link from 'next/link'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found | TripFeels',
  description:
    'The page you are looking for could not be found. Return to TripFeels dashboard or sign in to access your account.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--tf-text-primary)] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[var(--tf-text-secondary)] mb-4">
          Page Not Found
        </h2>
        <p className="text-[var(--tf-text-secondary)] mb-8 max-w-md">
          The page you are looking for could not be found. It might have been moved, deleted, or you
          entered the wrong URL.
        </p>
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
