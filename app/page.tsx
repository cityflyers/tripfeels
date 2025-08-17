"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import HomePageSkeleton from '@/components/dashboard/HomePageSkeleton';
import PublicDashboardShell from '@/components/dashboard/public-dashboard-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useRef } from 'react';

// Lazy load heavy components
const ServiceTabs = lazy(() => import('@/components/ui/ServiceTabs'));
const RecentSearches = lazy(() => import("@/components/dashboard/flight/RecentSearches"));
const FlightSearchForm = lazy(() => import('@/components/dashboard/flight/FlightSearchForm'));
const MulticityFlightSearchForm = lazy(() => import('@/components/dashboard/flight/MulticityFlightSearchForm'));

// Loading component for ServiceTabs
function ServiceTabsSkeleton() {
  return (
    <div>
      <div className="flex border-b bg-background h-14 mb-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center h-14">
            <Skeleton className="mb-1 h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-12 hidden sm:block" />
          </div>
        ))}
      </div>
      <div className="w-full bg-background rounded-none md:rounded-none px-6 py-10 shadow-lg mb-8">
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <Skeleton className="h-32 w-full md:flex-[1.5]" />
          <div className="flex flex-row gap-2 w-full md:flex-[2]">
            <Skeleton className="h-32 flex-1" />
            <Skeleton className="h-32 flex-1" />
          </div>
          <Skeleton className="h-32 w-full md:flex-[1]" />
        </div>
        <div className="flex flex-wrap gap-4 items-center mt-2 mb-6 ml-1">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <Skeleton className="h-12 w-64 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Memoized skeleton component to prevent unnecessary re-renders
const MemoizedSkeleton = React.memo(ServiceTabsSkeleton);

function ServiceTabsWithSuspense() {
  return (
    <Suspense fallback={<MemoizedSkeleton />}>
      <ServiceTabs />
    </Suspense>
  );
}

export default function HomePage() {
  const { loading } = useAuth();
  const [initialData, setInitialData] = useState<any>(null);
  const flightFormRef = useRef<any>(null);
  const multicityFormRef = useRef<any>(null);

  // Helper to determine if the search is multicity
  const isMulticity = initialData?.tripType === 'multicity' || initialData?.type === 'Multicity';

  // Handler for recent search card click
  const handleRecentSearchSelect = (item: any) => {
    // Build initialData for the form
    if (item.type === 'Multicity' && item.segments) {
      setInitialData({
        tripType: 'multicity',
        segments: item.segments,
        travellers: item.travellers,
        fareType: item.fareType || 'regular',
      });
      setTimeout(() => {
        multicityFormRef.current?.triggerSearch();
      }, 0);
    } else {
      // Handle both oneway and roundtrip
      const segments = [
        {
          from: { city: item.from.city, code: item.from.code },
          to: { city: item.to.city, code: item.to.code },
          date: item.date ? new Date(item.date) : undefined,
        },
      ];
      
      // Add return segment for roundtrip
      if (item.type === 'Roundtrip' && item.returnDate) {
        segments.push({
          from: { city: item.to.city, code: item.to.code }, // Return is reversed
          to: { city: item.from.city, code: item.from.code },
          date: new Date(item.returnDate),
        });
      }
      
      setInitialData({
        tripType: item.type === 'Roundtrip' ? 'roundtrip' : 'oneway',
        segments: segments,
        travellers: { adults: item.travelers || 1, kids: 0, children: 0, infants: 0, travelClass: 'Economy' },
        fareType: 'regular',
      });
      setTimeout(() => {
        flightFormRef.current?.triggerSearch();
      }, 0);
    }
  };

  const formKey = initialData ? JSON.stringify(initialData) : "default";

  return (
    <PublicDashboardShell loading={loading}>
      {loading ? (
        <MemoizedSkeleton />
      ) : (
        <>
          <ServiceTabsWithSuspense />
          {/* Render the correct form with ref and initialData, and force remount with key */}
          {isMulticity ? (
            <Suspense fallback={<div className="w-full h-96 flex items-center justify-center"><Skeleton className="h-96 w-full" /></div>}>
              <MulticityFlightSearchForm key={formKey} ref={multicityFormRef} initialData={initialData} />
            </Suspense>
          ) : (
            <Suspense fallback={<div className="w-full h-96 flex items-center justify-center"><Skeleton className="h-96 w-full" /></div>}>
              <FlightSearchForm key={formKey} ref={flightFormRef} initialData={initialData} />
            </Suspense>
          )}
          <Suspense fallback={<div className="w-full h-32 flex items-center justify-center"><Skeleton className="h-32 w-full" /></div>}>
            <RecentSearches onSelect={handleRecentSearchSelect} />
          </Suspense>
        </>
      )}
    </PublicDashboardShell>
  );
}