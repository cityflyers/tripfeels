'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BookingRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get all search params
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    // Construct the new URL with all existing query parameters
    const newPath = `/dashboard/booking${params.toString() ? `?${params.toString()}` : ''}`;
    
    // Redirect to the dashboard booking page
    router.replace(newPath);
  }, [router, searchParams]);

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting to booking page...</p>
      </div>
    </div>
  );
} 