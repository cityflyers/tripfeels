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
    <div className="min-h-screen bg-gradient-to-br from-[var(--tf-page-bg)] via-[var(--tf-surface)] to-[var(--tf-surface-alt)] flex items-center justify-center">
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
            className="inline-flex items-center px-4 py-2 bg-[var(--tf-primary)] text-white rounded-lg hover:bg-[var(--tf-primary-hover)] transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center px-4 py-2 bg-[var(--tf-text-secondary)] text-white rounded-lg hover:bg-[var(--tf-text-primary)] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
