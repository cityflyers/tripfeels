import { Skeleton } from '@/components/ui/skeleton';

export default function HomePageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 md:px-6 gap-4">
          {/* Logo */}
          <Skeleton className="h-8 w-32 rounded-md" />
          {/* Search bar (desktop) */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <Skeleton className="h-9 w-full max-w-md rounded-md" />
          </div>
          {/* Search icon (mobile) */}
          <div className="flex md:hidden flex-1 min-w-0">
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          {/* Theme/user buttons */}
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full ml-2" />
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        {/* Sidebar Skeleton */}
        <div className="hidden md:flex flex-col border-r bg-background w-64 p-4 gap-4">
          <Skeleton className="h-8 w-32 mb-6" />
          {/* Nav items */}
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-6 w-36 mb-2" />
          <Skeleton className="h-6 w-28 mb-2" />
          <Skeleton className="h-6 w-24 mb-2" />
          <div className="mt-auto">
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>
        </div>
        {/* Sidebar mobile (sheet style) */}
        <div className="md:hidden flex flex-col border-r bg-background w-20 p-2 gap-2">
          <Skeleton className="h-8 w-8 mb-2" />
          <Skeleton className="h-6 w-8 mb-2" />
          <Skeleton className="h-6 w-8 mb-2" />
          <Skeleton className="h-6 w-8 mb-2" />
        </div>
        {/* Main Content Skeleton */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-gray-50 dark:bg-gray-800">
          {/* Booking Tabs Skeleton */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-md" />
            ))}
          </div>
          {/* Flight Search Form Skeleton */}
          <div className="w-full max-w-4xl mx-auto bg-background rounded-lg shadow-lg p-6 md:p-10 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Skeleton className="h-20 w-full md:w-64 rounded-lg" />
              <Skeleton className="h-20 w-full md:w-64 rounded-lg" />
              <Skeleton className="h-20 w-full md:w-64 rounded-lg" />
            </div>
            <div className="flex gap-4 mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex justify-center mt-6">
              <Skeleton className="h-12 w-64 rounded-md" />
            </div>
          </div>
          {/* Cards/Sections Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
} 