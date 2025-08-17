'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Memoize the dashboard route to prevent unnecessary recalculations
  const dashboardRoute = useMemo(() => {
    if (!user) return null;
    
    switch (user.role) {
      case 'SUPER_ADMIN':
        return '/dashboard/super-admin';
      case 'ACCOUNT_ADMIN':
        return '/dashboard/account-admin';
      case 'SUPPORT_ADMIN':
        return '/dashboard/support-admin';
      case 'AGENT':
        return '/dashboard/agent';
      case 'TOUR_ORGANIZER_ADMIN':
        return '/dashboard/tour-organizer';
      case 'VISA_ORGANIZER_ADMIN':
        return '/dashboard/visa-organizer';
      case 'INSURRANCE_ORGANIZER_ADMIN':
        return '/dashboard/insurance-organizer';
      case 'CAR_ADMIN':
        return '/dashboard/car-admin';
      case 'USER_ADMIN':
        return '/dashboard/user-admin';
      default:
        return null;
    }
  }, [user]);

  useEffect(() => {
    if (!loading && dashboardRoute) {
      router.replace(dashboardRoute);
    }
  }, [loading, dashboardRoute, router]);

  // Skeleton loading state for the entire dashboard
  if (loading) {
    return (
      <div className="flex flex-col space-y-8 p-8">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Left Column - Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          {/* Right Column - Recent Activity */}
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-8 w-[100px]" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This page will redirect, but showing content in case there's a delay
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Redirecting to your dashboard...</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Loading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Please wait</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}