'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import LoginForm, { LoginFormSkeleton } from '@/components/auth/login-form';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      try {
        // Check for redirect URL in localStorage set by components before login
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          console.log('Redirecting to stored URL:', redirectUrl);
          localStorage.removeItem('redirectAfterLogin');
          // Use window.location.href for a full page navigation to handle state properly
          window.location.href = redirectUrl;
          return;
        }

        // Remove any lingering pending booking data if no redirect URL was found
        localStorage.removeItem('pendingBooking');

        // If no specific redirect URL, go to the dashboard
        console.log('No specific redirect found, going to dashboard');
        window.location.href = '/dashboard';

      } catch (error) {
        console.error('Error in redirect after login:', error);
        // Fallback to dashboard on error
        window.location.href = '/dashboard';
      }
    }
  }, [user, loading]);

  // Show splash screen initially
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left: Branding/Testimonial */}
        <div className="hidden md:flex w-full md:w-1/2 bg-muted dark:bg-muted/40 flex-col justify-between p-10 border-r">
          <div>
            <span className="flex items-center gap-2 text-lg font-semibold">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary"><rect width="24" height="24" rx="12" fill="currentColor" /></svg>
              AppDashboard
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <blockquote className="text-lg font-medium">
              "This dashboard has saved me countless hours of work and helped me deliver stunning designs to my clients faster than ever before."
            </blockquote>
            <span className="text-sm text-muted-foreground">Sofia Davis</span>
          </div>
        </div>
        {/* Right: Login Form Skeleton */}
        <div className="flex w-full md:w-1/2 items-center justify-center py-12">
          <div className="mx-auto w-full max-w-md flex flex-col justify-center space-y-6">
            <LoginFormSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Don't show login form if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Branding/Testimonial */}
      <div className="hidden md:flex w-full md:w-1/2 bg-muted dark:bg-muted/40 flex-col justify-between p-10 border-r">
        <div>
          <span className="flex items-center gap-2 text-lg font-semibold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary"><rect width="24" height="24" rx="12" fill="currentColor" /></svg>
            AppDashboard
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <blockquote className="text-lg font-medium">
            "This dashboard has saved me countless hours of work and helped me deliver stunning designs to my clients faster than ever before."
          </blockquote>
          <span className="text-sm text-muted-foreground">Sofia Davis</span>
        </div>
      </div>
      {/* Right: Login Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md flex flex-col justify-center space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>
          <LoginForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{' '}and{' '}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}