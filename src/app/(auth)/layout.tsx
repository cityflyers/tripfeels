import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | TripFeels',
  description:
    'Sign in to your TripFeels account to access your personalized dashboard and travel management platform. Secure authentication with role-based access.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_0%,color-mix(in_srgb,var(--tf-primary)_16%,transparent),transparent_48%),radial-gradient(circle_at_94%_0%,color-mix(in_srgb,var(--tf-info)_30%,transparent),transparent_46%),linear-gradient(165deg,var(--tf-page-bg)_0%,var(--tf-surface)_100%)]">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 h-80 w-80 animate-blob rounded-full bg-[var(--tf-primary)]/18 opacity-45 mix-blend-screen blur-xl filter"></div>
        <div className="absolute -bottom-40 -left-32 h-80 w-80 animate-blob rounded-full bg-[var(--tf-info)]/28 opacity-45 mix-blend-screen blur-xl filter animation-delay-2000"></div>
        <div className="absolute left-40 top-40 h-80 w-80 animate-blob rounded-full bg-[var(--tf-success)]/22 opacity-40 mix-blend-screen blur-xl filter animation-delay-4000"></div>
      </div>
      {children}
    </div>
  )
}
