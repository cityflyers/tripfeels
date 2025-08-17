import React, { useState, useEffect } from "react"
import { SendHorizonal, DollarSign, Briefcase, AlertCircle, ChevronRight } from 'lucide-react'
import { airports as allAirports } from '@/components/dashboard/flight/airport/airportUtils';
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OnewayFlightCardSkeleton } from './OnewayFlightCard'
import { fetchOfferPrice } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getMarkupByAirline } from '@/lib/markup'
import OnewayFlightCard from "./OnewayFlightCard"
import FlightPathGraphic from './FlightPathGraphic';
import { calculateTotalWithMarkup } from '@/lib/calculateTotalWithMarkup';

function getCityNameByCode(code: string): string {
  if (!code) return 'Unknown City';
  const airport = allAirports.find(a => a.code.toUpperCase() === code.toUpperCase());
  return airport?.city || 'Unknown City';
}

function formatDuration(minutes: string) {
  const mins = parseInt(minutes, 10);
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  return `${hours > 0 ? hours + 'h ' : ''}${remainingMinutes}m`;
}

interface PairedOnewayFlightCardProps {
  onwardFlights: any[]
  returnFlights: any[]
  traceId: string
  amountType?: 'official' | 'offer' | '';
}

const PairedOnewayFlightCard: React.FC<PairedOnewayFlightCardProps> = ({ onwardFlights, returnFlights, traceId, amountType }) => {
  const [selectedOnward, setSelectedOnward] = useState<string | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [onwardTotalWithMarkup, setOnwardTotalWithMarkup] = useState<number>(0);
  const [returnTotalWithMarkup, setReturnTotalWithMarkup] = useState<number>(0);

  // Find selected flight objects
  const selectedOnwardFlight = onwardFlights.find(f => (f.offer.offerId || f.offerId) === selectedOnward)
  const selectedReturnFlight = returnFlights.find(f => (f.offer.offerId || f.offerId) === selectedReturn)

  // Helper to get summary info
  const getSummary = (flight: any) => {
    if (!flight?.offer?.paxSegmentList?.length) return null
    const first = flight.offer.paxSegmentList[0].paxSegment
    const last = flight.offer.paxSegmentList[flight.offer.paxSegmentList.length - 1].paxSegment
    return `${first.departure.iatA_LocationCode} ${first.departure.aircraftScheduledDateTime.slice(11,16)} → ${last.arrival.iatA_LocationCode} ${last.arrival.aircraftScheduledDateTime.slice(11,16)}`
  }

  // Helper to get the correct calculated total (baseFare + tax + otherFee + vat - discount)
  const getSummaryTotal = (flight: any) => {
    if (!flight?.offer?.fareDetailList?.length) return 0;
    const fare = flight.offer.fareDetailList[0].fareDetail;
    return Math.round(
      (fare.baseFare || 0) +
      (fare.tax || 0) +
      (fare.otherFee || 0) +
      (fare.vat || 0) -
      (fare.discount || 0)
    );
  }

  // Helper to get markup-adjusted total price for a flight
  const getMarkupAdjustedTotal = (flight: any) => {
    if (!flight?.offer?.fareDetailList) return 0;
    const airlineCode = flight.offer.paxSegmentList[0].paxSegment.marketingCarrierInfo.carrierDesigCode;
    if (flight.offer.fareDetailList[0]?.fareDetail.discount !== undefined) {
      // Markup already applied
      return flight.offer.fareDetailList.reduce((sum: number, { fareDetail }: any) => sum + (fareDetail.subTotal || 0), 0);
    } else {
      // No markup applied, fallback to original subtotal
      return flight.offer.fareDetailList.reduce((sum: number, { fareDetail }: any) => sum + (fareDetail.subTotal || 0), 0);
    }
  };

  useEffect(() => {
    async function recalcMarkupTotals() {
      // Determine role: 'USER' for public/not-logged-in, 'AGENT' for agent, 'USER' for regular user
      let role = 'USER';
      if (user && user.role === 'AGENT') role = 'AGENT';
      // Onward
      if (selectedOnwardFlight) {
        const airlineCode = selectedOnwardFlight.offer.paxSegmentList[0].paxSegment.marketingCarrierInfo.carrierDesigCode;
        const fromAirport = selectedOnwardFlight.offer.paxSegmentList[0].paxSegment.departure.iatA_LocationCode;
        const toAirport = selectedOnwardFlight.offer.paxSegmentList[selectedOnwardFlight.offer.paxSegmentList.length - 1].paxSegment.arrival.iatA_LocationCode;
        const markupOnward = await getMarkupByAirline(airlineCode, role, fromAirport, toAirport);
        
        // Use the same logic as OnewayFlightCard
        const payable = selectedOnwardFlight.offer.price.totalPayable.total || 0;
        const vat = (selectedOnwardFlight.offer.price.totalVAT && selectedOnwardFlight.offer.price.totalVAT.total) || 0;
        const { totalAmount } = calculateTotalWithMarkup({
          payable,
          vat,
          markupPercent: markupOnward,
        });
        setOnwardTotalWithMarkup(totalAmount);
      } else {
        setOnwardTotalWithMarkup(0);
      }
      // Return
      if (selectedReturnFlight) {
        const airlineCode = selectedReturnFlight.offer.paxSegmentList[0].paxSegment.marketingCarrierInfo.carrierDesigCode;
        const fromAirport = selectedReturnFlight.offer.paxSegmentList[0].paxSegment.departure.iatA_LocationCode;
        const toAirport = selectedReturnFlight.offer.paxSegmentList[selectedReturnFlight.offer.paxSegmentList.length - 1].paxSegment.arrival.iatA_LocationCode;
        const markupReturn = await getMarkupByAirline(airlineCode, role, fromAirport, toAirport);
        
        // Use the same logic as OnewayFlightCard
        const payable = selectedReturnFlight.offer.price.totalPayable.total || 0;
        const vat = (selectedReturnFlight.offer.price.totalVAT && selectedReturnFlight.offer.price.totalVAT.total) || 0;
        const { totalAmount } = calculateTotalWithMarkup({
          payable,
          vat,
          markupPercent: markupReturn,
        });
        setReturnTotalWithMarkup(totalAmount);
      } else {
        setReturnTotalWithMarkup(0);
      }
    }
    recalcMarkupTotals();
  }, [selectedOnwardFlight, selectedReturnFlight]);

  // Handle select button in popup
  const handleSelect = async () => {
    if (!selectedOnward || !selectedReturn) {
      toast({
        title: "Selection Incomplete",
        description: "Please select both an onward and a return flight.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is logged in
    if (!user) {
      // Store the intended destination URL
      const adults = searchParams.get('adults') || '1';
      const children = searchParams.get('children') || '0';
      const infants = searchParams.get('infants') || '0';

      // For paired one-way, we check both selected offers.
      // The API should handle multiple offerIds in the request.
      const offerIdsToCheck = [selectedOnward, selectedReturn];
      
      const params = new URLSearchParams({
        traceId,
        adults,
        children,
        infants,
      });
      // Add both offerIds to the params
      offerIdsToCheck.forEach(id => params.append('offerId', id));
      const redirectUrl = `/offerprice?${params.toString()}`;
      localStorage.setItem('redirectAfterLogin', redirectUrl);
      
      // Redirect to login page
      router.push('/auth/login');
      return;
    }

    if (isUnavailable) return;
    setIsLoading(true);

    const adults = searchParams.get('adults') || '1';
    const children = searchParams.get('children') || '0';
    const infants = searchParams.get('infants') || '0';

    // For paired one-way, we check both selected offers.
    // The API should handle multiple offerIds in the request.
    const offerIdsToCheck = [selectedOnward, selectedReturn];

    try {
      // We assume the traceId is the same for both legs of the journey.
      const offerData = await fetchOfferPrice(traceId, offerIdsToCheck, null);

      if (offerData.success === false || offerData.info?.error) {
        setIsUnavailable(true);
        toast({
          title: "Fare Unavailable",
          description: "One or both of the selected fares are no longer available. Please make a new selection.",
          variant: "destructive",
        });
      } else {
        const params = new URLSearchParams({
          traceId,
          adults,
          children,
          infants,
        });
        // Add both offerIds to the params
        offerIdsToCheck.forEach(id => params.append('offerId', id));
        router.push(`/offerprice?${params.toString()}`);
      }
    } catch (error) {
      console.error("Failed to verify offer price:", error);
      toast({
        title: "Error",
        description: "Could not verify the fares. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Card click handler
  const handleCardClick = (type: 'onward' | 'return', id: string) => {
    if (type === 'onward') setSelectedOnward(id)
    if (type === 'return') setSelectedReturn(id)
  }

  return (
    <>
      {/* On mobile, vertical timeline cards with radio selection inside card */}
      <div className="block md:hidden w-full">
        <div className="flex flex-row gap-2">
          {/* Departure column */}
          <div className="w-1/2 min-w-0 flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 mb-1">Select Departure</div>
            {onwardFlights.map((flight, idx) => {
              const id = flight.offer.offerId || idx
              const firstSegment = flight.offer.paxSegmentList[0].paxSegment;
              const lastSegment = flight.offer.paxSegmentList[flight.offer.paxSegmentList.length - 1].paxSegment;
              const depTime = firstSegment.departure.aircraftScheduledDateTime.slice(11, 16);
              const arrTime = lastSegment.arrival.aircraftScheduledDateTime.slice(11, 16);
              const depCode = firstSegment.departure.iatA_LocationCode;
              const arrCode = lastSegment.arrival.iatA_LocationCode;
              const depCity = getCityNameByCode(depCode);
              const arrCity = getCityNameByCode(arrCode);
              const depTimeStr = depTime;
              const arrTimeStr = arrTime;
              const durationStr = formatDuration(firstSegment.duration);
              const airlineId = firstSegment.marketingCarrierInfo.carrierDesigCode?.toUpperCase() || '';
              const logoUrl = `https://images.kiwi.com/airlines/64x64/${airlineId}.png`;
              const flightNumber = firstSegment.marketingCarrierInfo.flightNumber || '';
              const stopsText = 'Non-stop';
              return (
                <div
                  key={id}
                  className={`relative w-full rounded-lg border shadow p-4 mb-2 cursor-pointer transition ring-offset-2 flex flex-col border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${selectedOnward === id ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-primary dark:ring-yellow-400' : 'hover:ring-2 hover:ring-primary/30 dark:hover:ring-yellow-400/30'}`}
                  onClick={() => handleCardClick('onward', id)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedOnward === id}
                >
                  {/* Header: Radio + Airline Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      name="onward"
                      checked={selectedOnward === id}
                      onChange={() => setSelectedOnward(id)}
                      className="accent-primary"
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{firstSegment.marketingCarrierInfo.carrierName}</span>
                  </div>
                  {/* Logo + Flight number & Aircraft info */}
                  <div className="flex items-center mb-2">
                    <img src={logoUrl} alt={firstSegment.marketingCarrierInfo.carrierName} className="w-8 h-8 mr-2" />
                    <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
                      <span>Flight {flightNumber}</span>
                      <span>{firstSegment.iatA_AircraftType.iatA_AircraftTypeCode}</span>
                    </div>
                  </div>
                  {/* Flight Route & Timing */}
                  <div className="flex flex-col w-full">
                    {/* Departure */}
                    <div className="flex flex-col items-start gap-0">
                      <span className="text-xs font-normal text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{depCity}</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{depCode}</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{depTimeStr}</span>
                    </div>
                    {/* Vertical line + stops + duration */}
                    <div className="flex flex-col items-start my-0">
                      <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-700" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{stopsText}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{durationStr}</span>
                      <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-700" />
                    </div>
                    {/* Arrival */}
                    <div className="flex flex-col items-start gap-0">
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{arrTimeStr}</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{arrCode}</span>
                      <span className="text-xs font-normal text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{arrCity}</span>
                    </div>
                  </div>
                  {/* Fare Section */}
                  <div className="my-2 flex flex-col items-start text-left">
                    <span className="text-base font-bold text-primary dark:text-yellow-400 px-4 py-1 rounded">
                      {(() => {
                        if (amountType === 'official') {
                          // Show gross amount (original price without markup)
                          return `BDT ${flight.offer.price.gross?.total?.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) || getSummaryTotal(flight).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
                        } else {
                          // Show markup amount (price with markup applied)
                          if (selectedOnwardFlight && (flight.offer.offerId || flight.offerId) === (selectedOnwardFlight.offer.offerId || selectedOnwardFlight.offerId)) {
                            return `BDT ${onwardTotalWithMarkup.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
                          }
                          if (selectedReturnFlight && (flight.offer.offerId || flight.offerId) === (selectedReturnFlight.offer.offerId || selectedReturnFlight.offerId)) {
                            return `BDT ${returnTotalWithMarkup.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
                          }
                          // Fallback to summary total
                          return `BDT ${getSummaryTotal(flight).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
                        }
                      })()}
                    </span>
                    {/* Show strikethrough only for offer fare when gross is different */}
                    {amountType !== 'official' && flight.offer.price.gross?.total && flight.offer.price.gross.total > getSummaryTotal(flight) && (
                      <span className="text-xs text-gray-400 line-through font-semibold px-4">BDT {flight.offer.price.gross.total.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Return column */}
          <div className="w-1/2 min-w-0 flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 mb-1">Select Return</div>
            {returnFlights.map((flight, idx) => {
              const id = flight.offer.offerId || idx
              const firstSegment = flight.offer.paxSegmentList[0].paxSegment;
              const lastSegment = flight.offer.paxSegmentList[flight.offer.paxSegmentList.length - 1].paxSegment;
              const depTime = firstSegment.departure.aircraftScheduledDateTime.slice(11, 16);
              const arrTime = lastSegment.arrival.aircraftScheduledDateTime.slice(11, 16);
              const depCode = firstSegment.departure.iatA_LocationCode;
              const arrCode = lastSegment.arrival.iatA_LocationCode;
              const depCity = getCityNameByCode(depCode);
              const arrCity = getCityNameByCode(arrCode);
              const depTimeStr = depTime;
              const arrTimeStr = arrTime;
              const durationStr = formatDuration(firstSegment.duration);
              const airlineId = firstSegment.marketingCarrierInfo.carrierDesigCode?.toUpperCase() || '';
              const logoUrl = `https://images.kiwi.com/airlines/64x64/${airlineId}.png`;
              const flightNumber = firstSegment.marketingCarrierInfo.flightNumber || '';
              const stopsText = 'Non-stop';
              return (
                <div
                  key={id}
                  className={`relative w-full rounded-lg border shadow p-4 mb-2 cursor-pointer transition ring-offset-2 flex flex-col border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${selectedReturn === id ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-primary dark:ring-yellow-400' : 'hover:ring-2 hover:ring-primary/30 dark:hover:ring-yellow-400/30'}`}
                  onClick={() => handleCardClick('return', id)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedReturn === id}
                >
                  {/* Header: Radio + Airline Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      name="return"
                      checked={selectedReturn === id}
                      onChange={() => setSelectedReturn(id)}
                      className="accent-primary"
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{firstSegment.marketingCarrierInfo.carrierName}</span>
                  </div>
                  {/* Logo + Flight number & Aircraft info */}
                  <div className="flex items-center mb-2">
                    <img src={logoUrl} alt={firstSegment.marketingCarrierInfo.carrierName} className="w-8 h-8 mr-2" />
                    <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
                      <span>Flight {flightNumber}</span>
                      <span>{firstSegment.iatA_AircraftType.iatA_AircraftTypeCode}</span>
                    </div>
                  </div>
                  {/* Flight Route & Timing */}
                  <div className="flex flex-col w-full">
                    {/* Departure */}
                    <div className="flex flex-col items-start gap-0">
                      <span className="text-xs font-normal text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{depCity}</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{depCode}</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{depTimeStr}</span>
                    </div>
                    {/* Vertical line + stops + duration */}
                    <div className="flex flex-col items-start my-0">
                      <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-700" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{stopsText}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{durationStr}</span>
                      <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-700" />
                    </div>
                    {/* Arrival */}
                    <div className="flex flex-col items-start gap-0">
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{arrTimeStr}</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{arrCode}</span>
                      <span className="text-xs font-normal text-gray-900 dark:text-gray-100 m-0 p-0 leading-tight">{arrCity}</span>
                    </div>
                  </div>
                  {/* Fare Section */}
                  <div className="my-2 flex flex-col items-start text-left">
                    <span className="text-base font-bold text-primary dark:text-yellow-400 px-4 py-1 rounded">
                      {(() => {
                        if (amountType === 'official') {
                          // Show gross amount (original price without markup)
                          return `BDT ${flight.offer.price.gross?.total?.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) || getSummaryTotal(flight).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
                        } else {
                          // Show markup amount (price with markup applied)
                          if (selectedOnwardFlight && (flight.offer.offerId || flight.offerId) === (selectedOnwardFlight.offer.offerId || selectedOnwardFlight.offerId)) {
                            return `BDT ${onwardTotalWithMarkup.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
                          }
                          if (selectedReturnFlight && (flight.offer.offerId || flight.offerId) === (selectedReturnFlight.offer.offerId || selectedReturnFlight.offerId)) {
                            return `BDT ${returnTotalWithMarkup.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
                          }
                          // Fallback to summary total
                          return `BDT ${getSummaryTotal(flight).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
                        }
                      })()}
                    </span>
                    {/* Show strikethrough only for offer fare when gross is different */}
                    {amountType !== 'official' && flight.offer.price.gross?.total && flight.offer.price.gross.total > getSummaryTotal(flight) && (
                      <span className="text-xs text-gray-400 line-through font-semibold px-4">BDT {flight.offer.price.gross.total.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Desktop flex-row layout with radio selection inside card */}
      <div className="w-full h-px bg-gray-300 my-2" />
      <div className="paired-oneway-flight-card flex flex-row gap-0 w-full md:overflow-x-auto md:min-w-[640px]">
        {/* Departure column - use full width if no return flights */}
        <div className={`${returnFlights.length === 0 ? 'flex-[2] w-full' : 'flex-1'} flex flex-col gap-1 md:gap-2 min-w-0 md:min-w-[320px]`}>
          <div className="text-center font-bold text-primary mb-1 md:mb-2 uppercase tracking-wide text-xs md:text-base">
            Departure
          </div>
          {onwardFlights.map((flight, idx) => {
            const id = flight.offer.offerId || idx
            return (
              <div
                key={id}
                className={`relative w-full text-xs md:text-base p-0 flex items-start gap-2 cursor-pointer transition ring-offset-2`}
                onClick={() => handleCardClick('onward', id)}
                tabIndex={0}
                role="button"
                aria-pressed={selectedOnward === id}
              >
                {/* Radio input absolutely positioned top left */}
                <input
                  type="radio"
                  name="onward-desktop"
                  checked={selectedOnward === id}
                  onChange={e => { e.stopPropagation(); setSelectedOnward(id); }}
                  className="accent-primary absolute top-4 left-4 z-10"
                  aria-label="Select this onward flight"
                  onClick={e => e.stopPropagation()}
                />
                <OnewayFlightCard
                  flight={flight}
                  traceId={traceId}
                  hideSelectButton={true}
                  disableUpsellOptions={true}
                  selected={selectedOnward === id}
                  amountType={amountType}
                />
              </div>
            )
          })}
        </div>
        {/* Return column - only render if there are return flights */}
        {returnFlights.length > 0 && (
          <div className="flex-1 flex flex-col gap-1 md:gap-2 min-w-0 md:min-w-[320px]">
            <div className="text-center font-bold text-primary mb-1 md:mb-2 uppercase tracking-wide text-xs md:text-base">
              Return
            </div>
            {returnFlights.map((flight, idx) => {
              const id = flight.offer.offerId || idx
              return (
                <div
                  key={id}
                  className={`relative w-full text-xs md:text-base p-0 flex items-start gap-2 cursor-pointer transition ring-offset-2`}
                  onClick={() => handleCardClick('return', id)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedReturn === id}
                >
                  {/* Radio input absolutely positioned top left */}
                  <input
                    type="radio"
                    name="return-desktop"
                    checked={selectedReturn === id}
                    onChange={e => { e.stopPropagation(); setSelectedReturn(id); }}
                    className="accent-primary absolute top-4 left-4 z-10"
                    aria-label="Select this return flight"
                    onClick={e => e.stopPropagation()}
                  />
                  <OnewayFlightCard
                    flight={flight}
                    traceId={traceId}
                    hideSelectButton={true}
                    disableUpsellOptions={true}
                    selected={selectedReturn === id}
                    amountType={amountType}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Bottom popup for selection - MOBILE */}
      {(selectedOnwardFlight && selectedReturnFlight) && (
        <div className="block md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 p-4">
          <div className="flex flex-col gap-2">
            {([selectedOnwardFlight, selectedReturnFlight].map((flight: any, idx: number) => {
              if (!flight) return null;
              const dep = flight.offer.paxSegmentList[0].paxSegment.departure;
              const arrv = flight.offer.paxSegmentList[flight.offer.paxSegmentList.length - 1].paxSegment.arrival;
              const carrier = flight.offer.paxSegmentList[0].paxSegment.marketingCarrierInfo;
              const logoUrl = `https://images.kiwi.com/airlines/64x64/${carrier.carrierDesigCode?.toUpperCase()}.png`;
              const depTime = dep.aircraftScheduledDateTime.slice(11, 16);
              const arrTime = arrv.aircraftScheduledDateTime.slice(11, 16);
                              // Use the Fare Summary calculation for each flight
                const netAmount = getSummaryTotal(flight);
                const gross = flight.offer.price.gross?.total;
                const displayAmount = amountType === 'official' 
                  ? (gross || netAmount) 
                  : (() => {
                      // For offer fare, use markup-adjusted totals for selected flights
                      if (selectedOnwardFlight && (flight.offer.offerId || flight.offerId) === (selectedOnwardFlight.offer.offerId || selectedOnwardFlight.offerId)) {
                        return onwardTotalWithMarkup;
                      }
                      if (selectedReturnFlight && (flight.offer.offerId || flight.offerId) === (selectedReturnFlight.offer.offerId || selectedReturnFlight.offerId)) {
                        return returnTotalWithMarkup;
                      }
                      return netAmount;
                    })();
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <img src={logoUrl} alt={carrier.carrierName} className="w-6 h-6 rounded-md bg-white border" />
                    <span className="font-bold text-base text-gray-900 dark:text-gray-100">{dep.iatA_LocationCode}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{depTime}</span>
                    <span className="mx-1">→</span>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{arrTime}</span>
                    <span className="font-bold text-base text-gray-900 dark:text-gray-100">{arrv.iatA_LocationCode}</span>
                    <span className="ml-2 font-bold text-black dark:text-white text-base">BDT {displayAmount.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                    {amountType !== 'official' && gross && gross > netAmount && (
                      <span className="text-xs text-gray-400 line-through font-semibold ml-1">BDT {gross.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                    )}
                  </div>
                );
            }))}
          </div>
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <div className="flex items-center justify-between mb-2 flex-col items-end">
            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">TOTAL PRICE</span>
            <span className="font-bold text-lg text-black dark:text-white">
              BDT {(() => {
                const onwardAmount = amountType === 'official' 
                  ? (selectedOnwardFlight.offer.price.gross?.total || getSummaryTotal(selectedOnwardFlight))
                  : onwardTotalWithMarkup;
                const returnAmount = amountType === 'official' 
                  ? (selectedReturnFlight.offer.price.gross?.total || getSummaryTotal(selectedReturnFlight))
                  : returnTotalWithMarkup;
                return (onwardAmount + returnAmount).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
              })()}
            </span>
            {amountType !== 'official' && selectedOnwardFlight?.offer?.price?.gross && selectedReturnFlight?.offer?.price?.gross && (() => {
              const grossSum = selectedOnwardFlight.offer.price.gross.total + selectedReturnFlight.offer.price.gross.total;
              const netSum = getSummaryTotal(selectedOnwardFlight) + getSummaryTotal(selectedReturnFlight);
              return grossSum > netSum ? (
                <span className="text-sm text-gray-400 line-through font-semibold">
                  BDT {grossSum.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                </span>
              ) : null;
            })()}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-full bg-gray-800 text-white dark:bg-white dark:text-gray-900 font-semibold text-sm">Make Proposal</button>
            <button className="flex-1 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black font-semibold text-sm">Book Now</button>
          </div>
        </div>
      )}
      {/* Bottom popup for selection - DESKTOP */}
      {(selectedOnwardFlight && selectedReturnFlight) && (
        <div className="hidden md:flex fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 p-4 flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
            <div className="w-full flex items-center justify-center gap-8 py-3">
              {([selectedOnwardFlight, selectedReturnFlight].map((flight: any, idx: number) => {
                if (!flight) return null;
                const dep = flight.offer.paxSegmentList[0].paxSegment.departure;
                const arrv = flight.offer.paxSegmentList[flight.offer.paxSegmentList.length - 1].paxSegment.arrival;
                const carrier = flight.offer.paxSegmentList[0].paxSegment.marketingCarrierInfo;
                const logoUrl = `https://images.kiwi.com/airlines/64x64/${carrier.carrierDesigCode?.toUpperCase()}.png`;
                const depTime = dep.aircraftScheduledDateTime.slice(11, 16);
                const arrTime = arrv.aircraftScheduledDateTime.slice(11, 16);
                // Use the Fare Summary calculation for each flight
                const netAmount = getSummaryTotal(flight);
                const gross = flight.offer.price.gross?.total;
                const displayAmount = amountType === 'official' 
                  ? (gross || netAmount) 
                  : (() => {
                      // For offer fare, use markup-adjusted totals for selected flights
                      if (selectedOnwardFlight && (flight.offer.offerId || flight.offerId) === (selectedOnwardFlight.offer.offerId || selectedOnwardFlight.offerId)) {
                        return onwardTotalWithMarkup;
                      }
                      if (selectedReturnFlight && (flight.offer.offerId || flight.offerId) === (selectedReturnFlight.offer.offerId || selectedReturnFlight.offerId)) {
                        return returnTotalWithMarkup;
                      }
                      return netAmount;
                    })();
                return (
                  <div key={idx} className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <img src={logoUrl} alt={carrier.carrierName} className="w-7 h-7 rounded-full bg-white border" />
                      <div className="text-xs text-gray-500 dark:text-gray-300">{dep.iatA_LocationCode}</div>
                      <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{depTime}</div>
                      <span className="mx-1">→</span>
                      <div className="text-xs text-gray-500 dark:text-gray-300">{arrv.iatA_LocationCode}</div>
                      <div className="font-bold text-lg text-gray-900 dark:text-gray-100">{arrTime}</div>
                    </div>
                    <span className="font-bold text-black dark:text-white text-base">BDT {displayAmount.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                    {amountType !== 'official' && gross && gross > netAmount && (
                      <span className="text-xs text-gray-400 line-through font-semibold">BDT {gross.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                    )}
                  </div>
                );
              }))}
              {/* Total price at the end */}
              <div className="ml-6 flex flex-col items-end">
                <span className="font-bold text-black dark:text-white text-lg">
                  BDT {(() => {
                    const onwardAmount = amountType === 'official' 
                      ? (selectedOnwardFlight.offer.price.gross?.total || getSummaryTotal(selectedOnwardFlight))
                      : onwardTotalWithMarkup;
                    const returnAmount = amountType === 'official' 
                      ? (selectedReturnFlight.offer.price.gross?.total || getSummaryTotal(selectedReturnFlight))
                      : returnTotalWithMarkup;
                    return (onwardAmount + returnAmount).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
                  })()}
                </span>
                {amountType !== 'official' && selectedOnwardFlight?.offer?.price?.gross && selectedReturnFlight?.offer?.price?.gross && (() => {
                  const grossSum = selectedOnwardFlight.offer.price.gross.total + selectedReturnFlight.offer.price.gross.total;
                  const netSum = getSummaryTotal(selectedOnwardFlight) + getSummaryTotal(selectedReturnFlight);
                  return grossSum > netSum ? (
                    <span className="text-sm text-gray-400 line-through font-semibold">
                      BDT {grossSum.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Button
              onClick={handleSelect}
              disabled={!selectedOnward || !selectedReturn || isLoading || isUnavailable}
              className="w-full bg-black text-white dark:bg-white dark:text-black"
            >
              {isLoading ? "Checking..." : isUnavailable ? "Unavailable" : "Confirm Selection"}
            </Button>
          </div>
        </div>
      )}
      {/* Desktop font size and spacing reduction for PairedOnewayFlightCard only */}
      <style>{`
        @media (min-width: 768px) {
          .paired-oneway-flight-card .text-base {
            font-size: 0.95rem !important;
          }
          .paired-oneway-flight-card .text-xs {
            font-size: 0.75rem !important;
          }
          .paired-oneway-flight-card .p-4 {
            padding: 0.75rem !important;
          }
          .paired-oneway-flight-card .md\:p-4 {
            padding: 0.75rem !important;
          }
          .paired-oneway-flight-card .mb-1, .paired-oneway-flight-card .mb-2 {
            margin-bottom: 0.5rem !important;
          }
          .paired-oneway-flight-card .gap-2 {
            gap: 0.5rem !important;
          }
          .paired-oneway-flight-card .md\:gap-2 {
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </>
  )
}

export default PairedOnewayFlightCard

export function PairedOnewayFlightCardSkeleton() {
  return (
    <>
      {/* On mobile, vertical timeline cards with radio selection inside card */}
      <div className="block md:hidden w-full">
        <div className="flex flex-row gap-2">
          {/* Departure column */}
          <div className="w-1/2 min-w-0 flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 mb-1">Select Departure</div>
            <OnewayFlightCardSkeleton />
            <OnewayFlightCardSkeleton />
          </div>
          {/* Return column */}
          <div className="w-1/2 min-w-0 flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 mb-1">Select Return</div>
            <OnewayFlightCardSkeleton />
            <OnewayFlightCardSkeleton />
          </div>
        </div>
      </div>
      {/* Desktop flex-row layout with radio selection inside card */}
      <div className="w-full h-px bg-gray-300 my-2" />
      <div className="paired-oneway-flight-card flex flex-row gap-[2px] w-full overflow-x-auto" style={{ minWidth: 640 }}>
        {/* Departure column */}
        <div className="flex-1 flex flex-col gap-1 md:gap-2 min-w-0 md:min-w-[320px]">
          <div className="text-center font-bold text-primary mb-1 md:mb-2 uppercase tracking-wide text-xs md:text-base">
            Departure
          </div>
          <OnewayFlightCardSkeleton />
          <OnewayFlightCardSkeleton />
        </div>
        {/* Return column */}
        <div className="flex-1 flex flex-col gap-1 md:gap-2 min-w-0 md:min-w-[320px]">
          <div className="text-center font-bold text-primary mb-1 md:mb-2 uppercase tracking-wide text-xs md:text-base">
            Return
          </div>
          <OnewayFlightCardSkeleton />
          <OnewayFlightCardSkeleton />
        </div>
      </div>
    </>
  );
}
