import { OnewayFlightCardSkeleton } from '@/components/dashboard/flight/flightcard/OnewayFlightCard';

export default function ResultsLoading() {
  return (
    <div className="container mx-auto p-4">
      <div className="mt-8">
        <h1 className="text-2xl font-bold mb-6">Flight Search Results</h1>
        <div className="space-y-4">
          <OnewayFlightCardSkeleton />
          <OnewayFlightCardSkeleton />
          <OnewayFlightCardSkeleton />
        </div>
      </div>
    </div>
  );
}