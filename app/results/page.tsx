'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { searchFlights, FlightSearchRequest, FlightSearchResponse } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ModifyFlightSearch from '@/components/dashboard/flight/modify/ModifyFlightSearch';
import OnewayFlightCard from '@/components/dashboard/flight/flightcard/OnewayFlightCard';
import ReturnFlightCard from '@/components/dashboard/flight/flightcard/ReturnFlightCard';
import MulticityFlightCard from '@/components/dashboard/flight/flightcard/MulticityFlightCard';
import PairedOnewayFlightCard from '@/components/dashboard/flight/flightcard/PairedOnewayFlightCard';
import { OnewayFlightCardSkeleton } from '@/components/dashboard/flight/flightcard/OnewayFlightCard';
import { ReturnFlightCardSkeleton } from '@/components/dashboard/flight/flightcard/ReturnFlightCard';
import { MulticityFlightCardSkeleton } from '@/components/dashboard/flight/flightcard/MulticityFlightCard';
import { PairedOnewayFlightCardSkeleton } from '@/components/dashboard/flight/flightcard/PairedOnewayFlightCard';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function useBreakpoint() {
  // Returns 'desktop', 'tablet', or 'mobile'
  const [bp, setBp] = useState('desktop');
  useEffect(() => {
    function check() {
      if (window.innerWidth < 600) setBp('mobile');
      else if (window.innerWidth < 900) setBp('tablet');
      else setBp('desktop');
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return bp;
}

function ResultsPageInner() {
  const searchParams = useSearchParams();
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(2);
  const [maxCount, setMaxCount] = useState(8); // Placeholder for progressive loading
  const [activeSort, setActiveSort] = useState<null | 'departure' | 'price' | 'stops' | 'layover'>(null);
  const [departureOrder, setDepartureOrder] = useState<null | 'asc' | 'desc'>(null);
  const [priceOrder, setPriceOrder] = useState<null | 'asc' | 'desc'>(null);
  const [stopsFilter, setStopsFilter] = useState<null | string>(null); // '0', '1', '2', '3+' or null
  const [layoverOrder, setLayoverOrder] = useState<null | 'shortest' | 'longest'>(null);
  const [amountType, setAmountType] = useState<'' | 'official' | 'offer'>('');
  const [selectedAirline, setSelectedAirline] = useState<string | null>(null);

  const { user } = useAuth();
  const showAmountSort = user && user.role && user.role.toUpperCase() !== 'USER';

  // Normalize tripType to lowercase
  const rawTripType = searchParams.get('tripType') || '';
  const tripType = rawTripType.toLowerCase();

  // Start progress bar and card reveal immediately
  useEffect(() => {
    setVisibleCount(2);
    setMaxCount(8); // Reset to placeholder on new search
    let timer: NodeJS.Timeout | null = null;
    let cancelled = false;
    const runProgress = (count: number) => {
      if (cancelled) return;
      setVisibleCount(count);
      if (count < maxCount) {
        const totalProgressTime = 2000; // 2 seconds
        const minInterval = 50;
        const interval = Math.max(totalProgressTime / maxCount, minInterval);
        timer = setTimeout(() => runProgress(count + 1), interval);
      }
    };
    runProgress(2);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [searchParams, maxCount]);

  // When flights arrive, update maxCount to real length
  useEffect(() => {
    if (flights.length > 0) {
      setMaxCount(flights.length);
    }
  }, [flights.length]);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        setError(null);

        // Map normalized tripType to API expected case
        const apiTripType =
          tripType === 'oneway' ? 'Oneway' :
          tripType === 'return' ? 'Return' :
          tripType === 'circle' ? 'Circle' : 'Oneway';

        const segments = [];
        let segmentCount = 1;
        
        // Get outbound segment
        const origin1 = searchParams.get('origin1');
        const destination1 = searchParams.get('destination1');
        const date1 = searchParams.get('date1');

        if (!origin1 || !destination1 || !date1) {
          throw new Error('Outbound flight details are required');
        }

        segments.push({
          originDepRequest: {
            iatA_LocationCode: origin1,
            date: date1,
          },
          destArrivalRequest: {
            iatA_LocationCode: destination1,
          },
        });

        // For return flights, add return segment
        if (apiTripType === 'Return') {
          const origin2 = searchParams.get('origin2');
          const destination2 = searchParams.get('destination2');
          const date2 = searchParams.get('date2');

          if (!origin2 || !destination2 || !date2) {
            throw new Error('Return flight details are required');
          }

          segments.push({
            originDepRequest: {
              iatA_LocationCode: origin2,
              date: date2,
            },
            destArrivalRequest: {
              iatA_LocationCode: destination2,
            },
          });
        }
        
        // For circle flights, add all segments
        if (apiTripType === 'Circle') {
          let segmentIndex = 2;
          while (true) {
            const origin = searchParams.get(`origin${segmentIndex}`);
            const destination = searchParams.get(`destination${segmentIndex}`);
            const date = searchParams.get(`date${segmentIndex}`);
            
            if (!origin || !destination || !date) break;
            
            segments.push({
              originDepRequest: {
                iatA_LocationCode: origin,
                date: date,
              },
              destArrivalRequest: {
                iatA_LocationCode: destination,
              },
            });
            
            segmentIndex++;
          }
        }

        // Get passenger counts and generate PaxInfo array
        const pax = [];
        const adults = parseInt(searchParams.get('adults') || '1', 10);
        const children = parseInt(searchParams.get('children') || '0', 10);
        const infants = parseInt(searchParams.get('infants') || '0', 10);
        
        // Add adult passengers
        for (let i = 1; i <= adults; i++) {
          pax.push({ paxID: `PAX${i}`, ptc: 'ADT' });
        }
        
        // Add child passengers with C05 PTC
        for (let i = 1; i <= children; i++) {
          pax.push({ paxID: `PAX${adults + i}`, ptc: 'C05' });
        }

        // Add infant passengers with INF PTC
        for (let i = 1; i <= infants; i++) {
          pax.push({ paxID: `PAX${adults + children + i}`, ptc: 'INF' });
        }

        const cabin = searchParams.get('cabin') || 'Economy';

        // Detect PairedOneway from searchParams
        const isPairedOneway = searchParams.get('pairedOneway') === '1';

        // Build request
        const request: FlightSearchRequest = {
          pointOfSale: 'BD',
          request: {
            originDest: segments,
            pax,
            shoppingCriteria: {
              tripType: apiTripType as 'Oneway' | 'Return' | 'Circle',
              travelPreferences: {
                vendorPref: [],
                cabinCode: cabin as 'Economy' | 'Business' | 'First',
              },
              returnUPSellInfo: true,
              ...(apiTripType === 'Oneway' && { preferCombine: true }),
              ...(apiTripType === 'Return' && isPairedOneway && { preferCombine: false }),
            },
          },
        };

        console.log('Sending search request:', request);
        const response: any = await searchFlights(request);
        console.log('Received search response:', response);
        
        // Handle backend error object
        if (response?.error) {
          setError(response.error.errorMessage || response.error.message || 'Server error');
          setLoading(false);
          return;
        }

        // Check if response has the expected structure
        let offers = response?.response?.offersGroup;
        let isSpecialReturn = false;
        let onwardFlights: any[] = [];
        let returnFlights: any[] = [];

        // If offersGroup is null, check for specialReturnOffersGroup
        if (!offers && response?.response?.specialReturn && response?.response?.specialReturnOffersGroup) {
          const ob = response.response.specialReturnOffersGroup.ob || [];
          const ib = response.response.specialReturnOffersGroup.ib || [];
          if (ob.length || ib.length) {
            isSpecialReturn = true;
            onwardFlights = ob;
            returnFlights = ib;
            offers = [];
          }
        }

        // Attach parent traceId to each offer group
        const traceId = response?.response?.traceId;
        if (offers && Array.isArray(offers)) {
          offers = offers.map(group => ({ ...group, traceId }));
        }
        // Also attach traceId to specialReturnOffersGroup if present
        if (isSpecialReturn) {
          onwardFlights = onwardFlights.map(group => ({ ...group, traceId }));
          returnFlights = returnFlights.map(group => ({ ...group, traceId }));
        }

        if ((!offers || !Array.isArray(offers) || offers.length === 0) && !isSpecialReturn) {
          setFlights([]);
        } else {
          if (offers && offers.length > 0) {
            setFlights(offers);
          } else if (isSpecialReturn) {
            setFlights([{ onwardFlights, returnFlights, isSpecialReturn: true }]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching flights:', err);
        if (err.message && err.message.includes('502')) {
          setError('The flight search service is temporarily unavailable. Please try again later.');
        } else {
          setError(err.message || 'Failed to fetch flights');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchParams, tripType]);

  // Debug log for flights array before rendering
  console.log('flights array before render:', flights);
  console.log('visibleCount before render:', visibleCount);

  // Sorting/filter handlers (move above JSX for linter)
  const handleDepartureSortChange = (value: string) => {
    setActiveSort('departure');
    setDepartureOrder(value as 'asc' | 'desc');
    setPriceOrder(null);
    setStopsFilter(null);
    setLayoverOrder(null);
  };
  const handlePriceSortChange = (value: string) => {
    setActiveSort('price');
    setPriceOrder(value as 'asc' | 'desc');
    setDepartureOrder(null);
    setStopsFilter(null);
    setLayoverOrder(null);
  };
  const handleStopsFilterChange = (value: string) => {
    setActiveSort('stops');
    setStopsFilter(value || null);
    setDepartureOrder(null);
    setPriceOrder(null);
    setLayoverOrder(null);
  };
  const handleLayoverSortChange = (value: string) => {
    setLayoverOrder(value as 'shortest' | 'longest');
    setActiveSort('layover');
    setDepartureOrder(null);
    setPriceOrder(null);
    setStopsFilter(null);
  };

  // Helper to get departure time for sorting
  const getDepartureTime = (flight: any) => {
    if (tripType === 'oneway' || tripType === 'return' || tripType === 'circle') {
      // Oneway/Return/Multicity: always use first segment's departure time
      const seg = flight.offer?.paxSegmentList?.[0]?.paxSegment || flight?.onwardFlights?.[0]?.offer?.paxSegmentList?.[0]?.paxSegment;
      return seg?.departure?.aircraftScheduledDateTime || '';
    }
    return '';
  };

  // Helper to get price for sorting
  const getTotalPrice = (flight: any) => {
    // Try to get the total price from the offer object
    if (flight.offer?.price?.totalPayable?.total) {
      return flight.offer.price.totalPayable.total;
    }
    // For special return, try onwardFlights/returnFlights
    if (flight?.onwardFlights?.[0]?.offer?.price?.totalPayable?.total) {
      return flight.onwardFlights[0].offer.price.totalPayable.total;
    }
    return 0;
  };

  // Helper to get number of stops for a flight
  const getStops = (flight: any) => {
    // Oneway/Return/Multicity: number of stops = segments - 1
    if (flight.offer?.paxSegmentList) {
      return Math.max(0, flight.offer.paxSegmentList.length - 1);
    }
    // For special return, use onwardFlights/returnFlights if needed
    if (flight?.onwardFlights?.[0]?.offer?.paxSegmentList) {
      return Math.max(0, flight.onwardFlights[0].offer.paxSegmentList.length - 1);
    }
    return 0;
  };

  // Helper to extract legs and count stops per leg for all trip types
  const getLegStops = (flight: any): number[] => {
    // Special return (PairedOneway)
    if (flight?.onwardFlights && flight?.returnFlights) {
      const onward = flight.onwardFlights[0]?.offer?.paxSegmentList || [];
      const ret = flight.returnFlights[0]?.offer?.paxSegmentList || [];
      // Each is a leg, count stops per leg
      return [Math.max(0, onward.length - 1), Math.max(0, ret.length - 1)];
    }
    // Normal return: group by segmentGroup or returnJourney
    if (flight.offer?.paxSegmentList && Array.isArray(flight.offer.paxSegmentList)) {
      // Group by segmentGroup or returnJourney
      const groups: { [key: string]: any[] } = {};
      flight.offer.paxSegmentList.forEach((seg: any) => {
        const groupKey = seg.paxSegment.segmentGroup != null ? seg.paxSegment.segmentGroup : (seg.paxSegment.returnJourney ? '1' : '0');
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(seg);
      });
      return Object.values(groups).map(leg => Math.max(0, leg.length - 1));
    }
    // Oneway: single leg
    if (flight.offer?.paxSegmentList) {
      return [Math.max(0, flight.offer.paxSegmentList.length - 1)];
    }
    return [0];
  };

  // Helper to calculate layover durations for a given paxSegmentList and optional segmentGroup
  function getLayoverDurations(paxSegmentList: any[], group?: number) {
    let segments: any[] = paxSegmentList;
    if (typeof group === 'number') {
      segments = paxSegmentList.filter((seg: any) => seg.paxSegment.segmentGroup === group);
    }
    // Sort by departure time
    segments = [...segments].sort((a: any, b: any) =>
      new Date(a.paxSegment.departure.aircraftScheduledDateTime).getTime() -
      new Date(b.paxSegment.departure.aircraftScheduledDateTime).getTime()
    );
    const layovers: number[] = [];
    for (let i = 0; i < segments.length - 1; i++) {
      const arr = new Date(segments[i].paxSegment.arrival.aircraftScheduledDateTime);
      const dep = new Date(segments[i + 1].paxSegment.departure.aircraftScheduledDateTime);
      layovers.push((dep.getTime() - arr.getTime()) / (1000 * 60)); // in minutes
    }
    return layovers;
  }

  // Helper to get the layover value for sorting (min or max layover across all segment groups)
  function getLayoverSortValue(flight: any, order: 'shortest' | 'longest') {
    if (!flight.offer?.paxSegmentList) return Number.MAX_SAFE_INTEGER;
    const paxSegmentList: any[] = flight.offer.paxSegmentList;
    // Find all unique segmentGroups
    const groupSet = new Set<number>();
    paxSegmentList.forEach((seg: any) => {
      if (typeof seg.paxSegment.segmentGroup === 'number') {
        groupSet.add(seg.paxSegment.segmentGroup);
      }
    });
    // If no segmentGroup, treat as single group (oneway)
    if (groupSet.size === 0) {
      const layovers = getLayoverDurations(paxSegmentList);
      if (layovers.length === 0) return Number.MAX_SAFE_INTEGER;
      return order === 'shortest' ? Math.min(...layovers) : Math.max(...layovers);
    }
    // For each group, get layovers and flatten
    let allLayovers: number[] = [];
    groupSet.forEach((group: number) => {
      const layovers = getLayoverDurations(paxSegmentList, group);
      allLayovers = allLayovers.concat(layovers);
    });
    if (allLayovers.length === 0) return Number.MAX_SAFE_INTEGER;
    return order === 'shortest' ? Math.min(...allLayovers) : Math.max(...allLayovers);
  }

  // Scan all flights to find max stops
  let maxStops = 0;
  for (const flight of flights) {
    maxStops = Math.max(maxStops, getStops(flight));
  }

  // Build stops options dynamically (do not use value="" for SelectItem)
  const stopsOptions = [];
  if (maxStops >= 0) stopsOptions.push({ value: '0', label: 'Non-stop' });
  if (maxStops >= 1) stopsOptions.push({ value: '1', label: '1 Stop' });
  if (maxStops >= 2) stopsOptions.push({ value: '2', label: '2 Stops' });
  if (maxStops >= 3) stopsOptions.push({ value: '3+', label: '3+ Stops' });

  // Filter and sort flights before rendering
  let filteredFlights = [...flights];
  if (
    flights.length > 0 &&
    (tripType === 'oneway' || tripType === 'return' || tripType === 'circle') &&
    activeSort === 'stops' && stopsFilter !== null && stopsFilter !== ''
  ) {
    filteredFlights = filteredFlights.filter(flight => {
      const legStops = getLegStops(flight);
      if (stopsFilter === '0') {
        // All legs must be non-stop (0 stops)
        return legStops.every(stops => stops === 0);
      } else if (stopsFilter === '1') {
        // At least one leg has exactly 1 stop, all others 0 or 1
        return legStops.some(stops => stops === 1) && legStops.every(stops => stops <= 1);
      } else if (stopsFilter === '2') {
        // At least one leg has exactly 2 stops, all others 0, 1, or 2
        return legStops.some(stops => stops === 2) && legStops.every(stops => stops <= 2);
      } else if (stopsFilter === '3+') {
        // At least one leg has 3 or more stops
        return legStops.some(stops => stops >= 3);
      }
      return true;
    });
  }
  // Now sort if needed
  const sortedFlights = [...filteredFlights];
  if (
    filteredFlights.length > 0 &&
    (tripType === 'oneway' || tripType === 'return' || tripType === 'circle') &&
    activeSort && ((activeSort === 'departure' && departureOrder) || (activeSort === 'price' && priceOrder) || (activeSort === 'layover' && layoverOrder))
  ) {
    sortedFlights.sort((a, b) => {
      if (activeSort === 'departure' && departureOrder) {
        const aTime = getDepartureTime(a);
        const bTime = getDepartureTime(b);
        if (!aTime || !bTime) return 0;
        if (departureOrder === 'asc') {
          return aTime.localeCompare(bTime);
        } else {
          return bTime.localeCompare(aTime);
        }
      } else if (activeSort === 'price' && priceOrder) {
        const aPrice = getTotalPrice(a);
        const bPrice = getTotalPrice(b);
        if (priceOrder === 'asc') {
          return aPrice - bPrice;
        } else {
          return bPrice - aPrice;
        }
      } else if (activeSort === 'layover' && layoverOrder) {
        const aLayover = getLayoverSortValue(a, layoverOrder);
        const bLayover = getLayoverSortValue(b, layoverOrder);
        return layoverOrder === 'shortest' ? aLayover - bLayover : bLayover - aLayover;
      }
      return 0;
    });
  }

  // Filter flights by selected airline if set
  const displayedFlights = selectedAirline
    ? flights.filter(flight => {
        let airlineId = '';
        if (flight.offer && flight.offer.paxSegmentList && flight.offer.paxSegmentList.length > 0) {
          airlineId = flight.offer.paxSegmentList[0].paxSegment.marketingCarrierInfo.carrierDesigCode?.toUpperCase() || '';
        } else if (flight.onwardFlights && flight.onwardFlights[0]?.offer?.paxSegmentList?.length > 0) {
          airlineId = flight.onwardFlights[0].offer.paxSegmentList[0].paxSegment.marketingCarrierInfo.carrierDesigCode?.toUpperCase() || '';
        }
        return airlineId === selectedAirline;
      })
    : sortedFlights;

  const breakpoint = useBreakpoint();
  const [moreSortsOpen, setMoreSortsOpen] = useState(false);

  // Helper: is any hidden sort/filter active?
  const hiddenSortActive = (
    (breakpoint === 'mobile' && (stopsFilter || layoverOrder || (showAmountSort && amountType))) ||
    (breakpoint === 'tablet' && (layoverOrder || (showAmountSort && amountType)))
  );

  return (
    <>
      <div className="container mx-auto p-4">
        <ModifyFlightSearch />
        {/* Airline Sorting Bar */}
        <AirlineBar
          flights={
            flights[0]?.isSpecialReturn
              ? [...(flights[0].onwardFlights || []), ...(flights[0].returnFlights || [])]
              : flights
          }
          selectedAirline={selectedAirline}
          setSelectedAirline={setSelectedAirline}
        />
        
        {/* Responsive Sorting Controls */}
        {/* Mobile: Departure & Price side by side, More sorts below full width */}
        {breakpoint === 'mobile' && (
          <div className="w-full flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <Select value={departureOrder ?? ''} onValueChange={v => { handleDepartureSortChange(v); setMoreSortsOpen(false); }}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      departureOrder === 'asc'
                        ? 'Departure: Earliest to Latest'
                        : departureOrder === 'desc'
                          ? 'Departure: Latest to Earliest'
                          : 'Departure: Select'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Earliest to Latest</SelectItem>
                  <SelectItem value="desc">Latest to Earliest</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priceOrder ?? ''} onValueChange={v => { handlePriceSortChange(v); setMoreSortsOpen(false); }}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      priceOrder === 'asc'
                        ? 'Price: Lowest to Highest'
                        : priceOrder === 'desc'
                          ? 'Price: Highest to Lowest'
                          : 'Price: Select'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Lowest to Highest</SelectItem>
                  <SelectItem value="desc">Highest to Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Popover open={moreSortsOpen} onOpenChange={setMoreSortsOpen}>
              <PopoverTrigger asChild>
                <button
                  className={`flex items-center gap-1 px-3 py-2 rounded border bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-black/40 transition text-sm font-medium w-full ${hiddenSortActive ? 'border-primary text-primary' : 'border-gray-200 text-gray-700 dark:text-gray-200'}`}
                  aria-expanded={moreSortsOpen}
                >
                  More sorts
                  <span className={`transition-transform ${moreSortsOpen ? 'rotate-180' : ''}`}><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-2 space-y-2">
                <Select value={stopsFilter ?? undefined} onValueChange={v => { handleStopsFilterChange(v); setMoreSortsOpen(false); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        stopsFilter == null
                          ? 'Stops: Select'
                          : stopsOptions.find(opt => opt.value === stopsFilter)?.label || 'Stops: Select'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {stopsOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={layoverOrder ?? ''} onValueChange={v => { handleLayoverSortChange(v); setMoreSortsOpen(false); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        layoverOrder === 'shortest'
                          ? 'Layover: Shortest First'
                          : layoverOrder === 'longest'
                            ? 'Layover: Longest First'
                            : 'Layover: Select'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shortest">Shortest Layover First</SelectItem>
                    <SelectItem value="longest">Longest Layover First</SelectItem>
                  </SelectContent>
                </Select>
                {showAmountSort && (
                  <Select value={amountType} onValueChange={v => { setAmountType(v as '' | 'official' | 'offer'); setMoreSortsOpen(false); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          amountType === 'official'
                            ? 'Amount: Official Fare'
                            : amountType === 'offer'
                              ? 'Amount: Offer Fare'
                              : 'Amount: Select'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="official">Official Fare</SelectItem>
                      <SelectItem value="offer">Offer Fare</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </PopoverContent>
            </Popover>
          </div>
        )}
        {/* Tablet and Desktop: All visible sorts in a single row */}
        {(breakpoint === 'desktop' || breakpoint === 'tablet') && (
          <div className="w-full flex flex-row gap-2">
            {/* Departure */}
            <Select value={departureOrder ?? ''} onValueChange={v => { handleDepartureSortChange(v); setMoreSortsOpen(false); }}>
              <SelectTrigger className="w-40 md:w-48">
                <SelectValue
                  placeholder={
                    departureOrder === 'asc'
                      ? 'Departure: Earliest to Latest'
                      : departureOrder === 'desc'
                        ? 'Departure: Latest to Earliest'
                        : 'Departure: Select'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Earliest to Latest</SelectItem>
                <SelectItem value="desc">Latest to Earliest</SelectItem>
              </SelectContent>
            </Select>
            {/* Price */}
            <Select value={priceOrder ?? ''} onValueChange={v => { handlePriceSortChange(v); setMoreSortsOpen(false); }}>
              <SelectTrigger className="w-40 md:w-48">
                <SelectValue
                  placeholder={
                    priceOrder === 'asc'
                      ? 'Price: Lowest to Highest'
                      : priceOrder === 'desc'
                        ? 'Price: Highest to Lowest'
                        : 'Price: Select'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Lowest to Highest</SelectItem>
                <SelectItem value="desc">Highest to Lowest</SelectItem>
              </SelectContent>
            </Select>
            {/* Stops (always on tablet/desktop) */}
            <Select value={stopsFilter ?? undefined} onValueChange={v => { handleStopsFilterChange(v); setMoreSortsOpen(false); }}>
              <SelectTrigger className="w-40 md:w-48">
                <SelectValue
                  placeholder={
                    stopsFilter == null
                      ? 'Stops: Select'
                      : stopsOptions.find(opt => opt.value === stopsFilter)?.label || 'Stops: Select'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {stopsOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Layover (always on desktop, in popover on tablet) */}
            {breakpoint === 'desktop' && (
              <Select value={layoverOrder ?? ''} onValueChange={v => { handleLayoverSortChange(v); setMoreSortsOpen(false); }}>
                <SelectTrigger className="w-40 md:w-48">
                  <SelectValue
                    placeholder={
                      layoverOrder === 'shortest'
                        ? 'Layover: Shortest First'
                        : layoverOrder === 'longest'
                          ? 'Layover: Longest First'
                          : 'Layover: Select'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shortest">Shortest Layover First</SelectItem>
                  <SelectItem value="longest">Longest Layover First</SelectItem>
                </SelectContent>
              </Select>
            )}
            {/* Amount (always on desktop, in popover on tablet) */}
            {breakpoint === 'desktop' && showAmountSort && (
              <Select value={amountType} onValueChange={v => { setAmountType(v as '' | 'official' | 'offer'); setMoreSortsOpen(false); }}>
                <SelectTrigger className="w-40 md:w-48">
                  <SelectValue
                    placeholder={
                      amountType === 'official'
                        ? 'Amount: Official Fare'
                        : amountType === 'offer'
                          ? 'Amount: Offer Fare'
                          : 'Amount: Select'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="official">Official Fare</SelectItem>
                  <SelectItem value="offer">Offer Fare</SelectItem>
                </SelectContent>
              </Select>
            )}
            {/* Tablet: More sorts for Layover and Amount */}
            {breakpoint === 'tablet' && (
              <Popover open={moreSortsOpen} onOpenChange={setMoreSortsOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`flex items-center gap-1 px-3 py-2 rounded border bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-black/40 transition text-sm font-medium ${hiddenSortActive ? 'border-primary text-primary' : 'border-gray-200 text-gray-700 dark:text-gray-200'}`}
                    aria-expanded={moreSortsOpen}
                  >
                    More sorts
                    <span className={`transition-transform ${moreSortsOpen ? 'rotate-180' : ''}`}><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2 space-y-2">
                  <Select value={layoverOrder ?? ''} onValueChange={v => { handleLayoverSortChange(v); setMoreSortsOpen(false); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          layoverOrder === 'shortest'
                            ? 'Layover: Shortest First'
                            : layoverOrder === 'longest'
                              ? 'Layover: Longest First'
                              : 'Layover: Select'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shortest">Shortest Layover First</SelectItem>
                      <SelectItem value="longest">Longest Layover First</SelectItem>
                    </SelectContent>
                  </Select>
                  {showAmountSort && (
                    <Select value={amountType} onValueChange={v => { setAmountType(v as '' | 'official' | 'offer'); setMoreSortsOpen(false); }}>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            amountType === 'official'
                              ? 'Amount: Official Fare'
                              : amountType === 'offer'
                                ? 'Amount: Offer Fare'
                                : 'Amount: Select'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="official">Official Fare</SelectItem>
                        <SelectItem value="offer">Offer Fare</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
        
        <div className="mt-8">
          {/* Progress Bar */}
          {maxCount > 0 && visibleCount < maxCount && (
            <div className="mb-2 w-full h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-2 rounded transition-all duration-500"
                style={{
                  width: `${Math.round((visibleCount / maxCount) * 100)}%`,
                  background: '#22c55e',
                }}
              />
            </div>
          )}
          
          {loading ? (
            <div className="space-y-4">
              {tripType === 'circle'
                ? <><MulticityFlightCardSkeleton /><MulticityFlightCardSkeleton /><MulticityFlightCardSkeleton /></>
                : tripType === 'return'
                  ? <><ReturnFlightCardSkeleton /><ReturnFlightCardSkeleton /><ReturnFlightCardSkeleton /></>
                  : <><OnewayFlightCardSkeleton /><OnewayFlightCardSkeleton /><OnewayFlightCardSkeleton /></>
              }
            </div>
          ) : error ? (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center text-center">
                {error === "No results found" ? (
                  <>
                    <div className="text-yellow-500 font-semibold mb-2">No flights match your search.</div>
                    <div>Try adjusting your dates, destinations, or passenger details and search again.</div>
                  </>
                ) : (
                  <>
                <div className="text-red-500 font-semibold mb-2">{error}</div>
                <div>Please try again or modify your search.</div>
                  </>
                )}
              </div>
            </Card>
          ) : displayedFlights.length === 0 ? (
            <Card className="p-6 text-center">
              {tripType === 'circle' ? (
                <>No flights found matching your multicity trip criteria. Please try different dates or routes.</>
              ) : tripType === 'return' ? (
                <>No return flights found matching your criteria. Please try different dates or routes.</>
              ) : (
                <>No flights found matching your criteria. Please try different dates or routes.</>
              )}
            </Card>
          ) : tripType === 'oneway' ? (
            <>
              {displayedFlights.map((flight, index) => {
                const offerObj = flight.offer ? flight : { offer: flight };
                const uniqueKey = `${flight.offer?.offerId || index}-${index}`;
                return <OnewayFlightCard key={uniqueKey} flight={offerObj} traceId={flight.traceId || ''} amountType={amountType} />;
              })}
            </>
          ) : tripType === 'circle' ? (
            <>
              {displayedFlights.map((flight, index) => {
                const uniqueKey = `${flight.offer.offerId}-${index}`;
                return <MulticityFlightCard key={uniqueKey} flight={flight} traceId={flight.offer.traceId || flight.traceId || ''} amountType={amountType} />;
              })}
            </>
          ) : tripType === 'return' ? (
            <>
              {displayedFlights[0]?.isSpecialReturn ? (
                <>
                  <PairedOnewayFlightCard key="paired" onwardFlights={displayedFlights[0].onwardFlights} returnFlights={displayedFlights[0].returnFlights} traceId={displayedFlights[0].onwardFlights?.[0]?.traceId || displayedFlights[0].returnFlights?.[0]?.traceId || ''} amountType={amountType} />
                </>
              ) : (
                <>
                  {displayedFlights.map((flight, index) => {
                    const uniqueKey = `${flight.offer.offerId}-${index}`;
                    return <ReturnFlightCard key={uniqueKey} flight={flight} traceId={flight.offer.traceId || flight.traceId || ''} amountType={amountType} />;
                  })}
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

// AirlineBar component (inline for now)
type AirlineBarProps = { flights: any[], selectedAirline?: string | null, setSelectedAirline?: (code: string | null) => void };
type AirlineAgg = { code: string; name: string; logo: string; minPrice: number; count: number };
function AirlineBar({ flights, selectedAirline, setSelectedAirline }: AirlineBarProps) {
  // Aggregate by airline code
  const airlineMap: Record<string, AirlineAgg> = {};
  flights.forEach((flight: any) => {
    // Use the same logic as OnewayFlightCard for extracting the airline code
    let airlineId = '';
    if (flight.offer && flight.offer.paxSegmentList && flight.offer.paxSegmentList.length > 0) {
      airlineId = flight.offer.paxSegmentList[0].paxSegment.marketingCarrierInfo.carrierDesigCode?.toUpperCase() || '';
    } else if (flight.onwardFlights && flight.onwardFlights[0]?.offer?.paxSegmentList?.length > 0) {
      airlineId = flight.onwardFlights[0].offer.paxSegmentList[0].paxSegment.marketingCarrierInfo.carrierDesigCode?.toUpperCase() || '';
    }
    if (!airlineId) return;
    const name = flight.offer?.paxSegmentList?.[0]?.paxSegment?.marketingCarrierInfo?.carrierName || airlineId;
    const logo = `https://images.kiwi.com/airlines/64x64/${airlineId}.png`;
    const gross = flight.offer?.price?.gross?.total || flight?.onwardFlights?.[0]?.offer?.price?.gross?.total || 0;
    if (!airlineMap[airlineId]) {
      airlineMap[airlineId] = { code: airlineId, name, logo, minPrice: gross, count: 1 };
    } else {
      airlineMap[airlineId].minPrice = Math.min(airlineMap[airlineId].minPrice, gross);
      airlineMap[airlineId].count += 1;
    }
  });
  const airlines: AirlineAgg[] = Object.values(airlineMap).sort((a, b) => a.minPrice - b.minPrice);

  // Calculate min and max fare for gradient
  const minFare = airlines.length > 0 ? airlines[0].minPrice : 0;
  const maxFare = airlines.length > 0 ? airlines[airlines.length - 1].minPrice : 1;
  // Helper to interpolate color between dark green, light green, yellow, and orange
  function getFareColor(fare: number) {
    if (maxFare === minFare) return '#22c55e'; // light green
    const t = Math.max(0, Math.min(1, (fare - minFare) / (maxFare - minFare)));
    // 0.0: light green #22c55e (34,197,94)
    // 0.5: yellow #FFD600 (255,214,0)
    // 0.75: orange #FF9100 (255,145,0)
    // 1.0: dark orange #FF6A00 (255,106,0)
    let r, g, b;
    if (t <= 0.5) {
      // light green to yellow
      const localT = t / 0.5;
      r = Math.round(34 + (255 - 34) * localT);
      g = Math.round(197 + (214 - 197) * localT);
      b = Math.round(94 + (0 - 94) * localT);
    } else if (t <= 0.75) {
      // yellow to orange
      const localT = (t - 0.5) / 0.25;
      r = Math.round(255 + (255 - 255) * localT); // stays 255
      g = Math.round(214 + (145 - 214) * localT);
      b = Math.round(0 + (0 - 0) * localT); // stays 0
    } else {
      // orange to dark orange
      const localT = (t - 0.75) / 0.25;
      r = Math.round(255 + (255 - 255) * localT); // stays 255
      g = Math.round(145 + (106 - 145) * localT);
      b = Math.round(0 + (0 - 0) * localT); // stays 0
    }
    return `rgb(${r},${g},${b})`;
  }

  // Scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  if (airlines.length === 0) return null;
  return (
    <div className="flex items-center my-4">
      <button onClick={() => scroll(-1)} className="px-2 text-xl text-gray-400 hover:text-primary" aria-label="Scroll left">&#x25C0;</button>
      <div ref={scrollRef} className="flex overflow-x-auto gap-2 px-2 hide-scrollbar" style={{scrollbarWidth:'none'}}>
        {airlines.map((a: AirlineAgg) => (
          <div
            key={a.code}
            className={`flex flex-row items-center min-w-[120px] max-w-[160px] border rounded-md py-1 px-2 bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-sm gap-2 cursor-pointer transition-all ${selectedAirline === a.code ? 'ring-2 ring-primary border-primary dark:ring-green-400 dark:border-green-400' : ''}`}
            onClick={() => setSelectedAirline && setSelectedAirline(selectedAirline === a.code ? null : a.code)}
          >
            <div className="w-10 h-10 flex items-center justify-center rounded bg-white dark:bg-zinc-800">
              <img src={a.logo} alt={a.code} className="h-8 w-8 object-contain" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/airlines/default.png'; }} />
            </div>
            <div className="flex flex-col items-start justify-center pl-1">
              <div className="text-xs font-semibold text-black dark:text-white leading-tight">
                {a.code}<span className="ml-1 text-xs font-normal dark:text-zinc-300">({a.count})</span>
              </div>
              <div className="text-base font-bold leading-tight dark:text-white" style={{ color: getFareColor(a.minPrice) }}>
                {a.minPrice.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => scroll(1)} className="px-2 text-xl text-gray-400 hover:text-primary" aria-label="Scroll right">&#x25B6;</button>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsPageInner />
    </Suspense>
  );
}