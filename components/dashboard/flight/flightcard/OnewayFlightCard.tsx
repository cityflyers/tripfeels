"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SendHorizonal, DollarSign, Briefcase, AlertCircle, Check, Package, Coffee, Users, ChevronRight, Shield, ShieldCheck, ShieldOff, Armchair, Luggage, Gem, Soup, Plane, Clock, Building2, FileText, AlertTriangle, Info } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from '@/context/auth-context';
import { airports as allAirports, Airport } from '@/components/dashboard/flight/airport/airportUtils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchOfferPrice } from '@/lib/api';
import { getMarkupByAirline } from '@/lib/markup';
import { calculateTotalWithMarkup } from '@/lib/calculateTotalWithMarkup';
import FlightPathGraphic from './FlightPathGraphic';

// Updated Type Definitions
interface Price {
  total: number;
  curreny: string;  // Note: API has a typo in 'currency'
}

interface PricingInfo {
  totalPayable: Price;
  gross: Price;
  discount?: Price;
  totalVAT?: Price;
}

interface LocationInfo {
  iatA_LocationCode: string;
  terminalName: string;
  aircraftScheduledDateTime: string;
}

interface CarrierInfo {
  carrierDesigCode: string;
  carrierName: string;
  marketingCarrierFlightNumber?: string;
}

interface AircraftInfo {
  iatA_AircraftTypeCode: string;
}

interface PaxSegment {
  departure: LocationInfo;
  arrival: LocationInfo;
  marketingCarrierInfo: CarrierInfo;
  operatingCarrierInfo: CarrierInfo;
  iatA_AircraftType: AircraftInfo;
  rbd: string;
  flightNumber: string;
  duration: string;
  cabinType: string;
  segmentGroup: number;
  returnJourney: boolean;
}

interface FareDetail {
  baseFare: number;
  tax: number;
  otherFee: number;
  discount: number;
  vat: number;
  currency: string;
  paxType: string;
  paxCount: number;
  subTotal: number;
}

interface BaggageInfo {
  paxType: string;
  allowance: string;
}

interface BaggageAllowance {
  departure: string;
  arrival: string;
  checkIn: BaggageInfo[];
  cabin: BaggageInfo[];
}

interface UpSellBrand {
  offerId: string;
  brandName: string;
  refundable: boolean;
  fareDetailList: { fareDetail: FareDetail }[];
  price: PricingInfo;
  baggageAllowanceList: { baggageAllowance: BaggageAllowance }[];
  rbd: string;
  meal: boolean;
  refundAllowed: boolean;
  exchangeAllowed: boolean;
}

interface FlightOffer {
  offer: {
    offerId: string;
    validatingCarrier: string;
    refundable: boolean;
    fareType: string;
    paxSegmentList: { paxSegment: PaxSegment }[];
    fareDetailList: { fareDetail: FareDetail }[];
    price: PricingInfo;
    baggageAllowanceList: { baggageAllowance: BaggageAllowance }[];
    upSellBrandList: { upSellBrand: UpSellBrand }[];
    seatsRemaining: string;
    source?: string;
    traceId?: string;
  };
}

interface FareOption {
  id: string;
  name: string;
  price: number;
  gross?: number;
  features: {
    refundable: boolean;
    baggage: string;
    seatsRemaining: number;
    discount?: number;
    benefits: string[];
  };
}

function getCityNameByCode(code: string): string {
  if (!code) return 'Unknown City';
  const airport = allAirports.find(a => a.code.toUpperCase() === code.toUpperCase());
  return airport?.city || 'Unknown City';
}

const formatDateTime = (dateTimeString: string) => {
  try {
    const time = dateTimeString.slice(11, 16);
    // Extract date part
    const [year, month, day] = dateTimeString.slice(0, 10).split('-');
    // Create a UTC date object for correct weekday/month
    const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    const date = utcDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
    return { time, date };
  } catch (e) {
    return { date: 'Invalid Date', time: '' };
  }
};

const formatDuration = (minutes: string) => {
  const mins = parseInt(minutes, 10);
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// Helper to calculate total trip duration in minutes between two ISO datetime strings
function getTotalTripDurationMins(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60)));
}

interface OnewayFlightCardProps {
  flight: FlightOffer;
  traceId: string;
  hideSelectButton?: boolean;
  customRadio?: React.ReactNode;
  disableUpsellOptions?: boolean;
  selected?: boolean;
  amountType?: 'official' | 'offer' | '';
}

const OnewayFlightCard: React.FC<OnewayFlightCardProps> = ({ flight, traceId, hideSelectButton, customRadio, disableUpsellOptions, selected, amountType }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedFareId, setSelectedFareId] = useState<string>(flight.offer.offerId);
  const [imgError, setImgError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [markup, setMarkup] = useState<number>(0);
  const [fareDetailListWithMarkup, setFareDetailListWithMarkup] = useState(flight.offer.fareDetailList);
  const [upSellBrandListWithMarkup, setUpSellBrandListWithMarkup] = useState(flight.offer.upSellBrandList);

  const firstSegment = flight.offer.paxSegmentList[0].paxSegment;
  const lastSegment = flight.offer.paxSegmentList[flight.offer.paxSegmentList.length - 1].paxSegment;
  const departure = formatDateTime(firstSegment.departure.aircraftScheduledDateTime);
  console.log('DEBUG departure time:', firstSegment.departure.aircraftScheduledDateTime);
  const arrival = formatDateTime(lastSegment.arrival.aircraftScheduledDateTime);

  // Calculate number of stops
  const numStops = flight.offer.paxSegmentList.length - 1;
  const stopInfo = numStops === 0 
    ? "Direct"
    : `${numStops} Stop${numStops > 1 ? 's' : ''} ${flight.offer.paxSegmentList[0].paxSegment.arrival.iatA_LocationCode}`;

  // Get total trip duration from first departure to last arrival
  const totalTripDurationMins = getTotalTripDurationMins(
    firstSegment.departure.aircraftScheduledDateTime,
    lastSegment.arrival.aircraftScheduledDateTime
  );

  // Calculate total layover time in minutes (sum of all layovers between segments)
  let totalLayoverMins = 0;
  for (let i = 0; i < flight.offer.paxSegmentList.length - 1; i++) {
    const segA = flight.offer.paxSegmentList[i].paxSegment;
    const segB = flight.offer.paxSegmentList[i + 1].paxSegment;
    const arr = new Date(segA.arrival.aircraftScheduledDateTime);
    const dep = new Date(segB.departure.aircraftScheduledDateTime);
    totalLayoverMins += Math.max(0, Math.floor((dep.getTime() - arr.getTime()) / (1000 * 60)));
  }

  // Helper to format layover minutes as 'Xh Ym'
  function formatLayover(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  // Get airline code in uppercase for the logo URL
  const airlineId = firstSegment.marketingCarrierInfo.carrierDesigCode?.toUpperCase() || '';

  // Get all flight numbers for all segments, e.g. "AI-238, AI-2332"
  const flightNumbers = flight.offer.paxSegmentList
    .map(segObj => `${segObj.paxSegment.marketingCarrierInfo.carrierDesigCode}-${segObj.paxSegment.flightNumber}`)
    .join(', ');

  useEffect(() => {
    if (!airlineId) {
      setImgError(true);
      return;
    }
    
    // Use the kiwi.com URL format for airline logos
    const logoUrl = `https://images.kiwi.com/airlines/64x64/${airlineId}.png`;
    setLogoUrl(logoUrl);
    setImgError(false);
  }, [airlineId]);

  useEffect(() => {
    async function fetchAndApplyMarkup() {
      const airlineCode = flight.offer.paxSegmentList[0].paxSegment.marketingCarrierInfo.carrierDesigCode;
      let role = 'USER';
      if (user && user.role === 'AGENT') role = 'AGENT';
      const fromAirport = flight.offer.paxSegmentList[0].paxSegment.departure.iatA_LocationCode;
      const toAirport = flight.offer.paxSegmentList[flight.offer.paxSegmentList.length - 1].paxSegment.arrival.iatA_LocationCode;
      const markupValue = await getMarkupByAirline(airlineCode, role, fromAirport, toAirport);
      console.log('Fetched markup:', markupValue, 'for airline', airlineCode, 'role', role);
      setMarkup(markupValue);
      
      // Always set the original fare details, markup will be applied during price calculation
      setFareDetailListWithMarkup(flight.offer.fareDetailList);
      setUpSellBrandListWithMarkup(flight.offer.upSellBrandList);
    }
    fetchAndApplyMarkup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight]);

  // Build fareOptions from markup-adjusted fare details
  const baseFareDetail = fareDetailListWithMarkup[0]?.fareDetail;
  const baseFareOption = baseFareDetail ? {
    id: flight.offer.offerId,
    name: "Basic",
    price: baseFareDetail.subTotal, // Use original subtotal, will be updated after markup calculation
    gross: flight.offer.price.gross?.total,
    features: {
      refundable: flight.offer.refundable,
      baggage: flight.offer.baggageAllowanceList?.[0]?.baggageAllowance.checkIn?.[0]?.allowance || "20kg",
      seatsRemaining: parseInt(flight.offer.seatsRemaining || '1', 10),
      discount: baseFareDetail.discount || 0,
      benefits: [
        "Standard seat selection",
        (flight.offer.baggageAllowanceList?.[0]?.baggageAllowance.checkIn?.[0]?.allowance || "20kg") + " Check-in baggage",
        (flight.offer.baggageAllowanceList?.[0]?.baggageAllowance.cabin?.[0]?.allowance || "7kg") + " Cabin baggage",
        flight.offer.refundable ? "Refundable" : "Non-refundable"
      ]
    }
  } : null;

  const upSellOptions = upSellBrandListWithMarkup
    ? upSellBrandListWithMarkup.map(({ upSellBrand }) => {
        const fareDetail = upSellBrand.fareDetailList[0]?.fareDetail;
        return {
          id: upSellBrand.offerId,
          name: upSellBrand.brandName,
          price: fareDetail ? fareDetail.subTotal : upSellBrand.price.totalPayable.total, // Use original price, will be updated after markup calculation
          gross: upSellBrand.price.gross?.total,
          features: {
            refundable: upSellBrand.refundable,
            baggage: upSellBrand.baggageAllowanceList?.[0]?.baggageAllowance.checkIn?.[0]?.allowance || "20kg",
            seatsRemaining: parseInt(flight.offer.seatsRemaining || '1', 10),
            discount: fareDetail ? fareDetail.discount : 0,
            benefits: [
              "Premium seat selection",
              (upSellBrand.baggageAllowanceList?.[0]?.baggageAllowance.checkIn?.[0]?.allowance || "20kg") + " Check-in baggage",
              (upSellBrand.baggageAllowanceList?.[0]?.baggageAllowance.cabin?.[0]?.allowance || "7kg") + " Cabin baggage",
              upSellBrand.meal ? "Meal included" : "No meal",
              upSellBrand.refundAllowed ? "Free changes" : "Changes with fee",
              upSellBrand.exchangeAllowed ? "Exchange allowed" : "No exchange"
            ]
          }
        };
      })
    : [];

  // Ensure fareOptions is always a non-null array
  const fareOptions: NonNullable<typeof baseFareOption>[] = [baseFareOption, ...upSellOptions].filter((opt): opt is NonNullable<typeof baseFareOption> => Boolean(opt));

  // After building fareOptions and selectedFare, add debug logs:
  console.log('fareOptions:', fareOptions);

  // Handle fare selection
  const handleFareSelection = (value: string) => {
    setSelectedFareId(value);
  };

  // Handle tab click
  const handleTabClick = (value: string) => {
    if (activeTab === value) {
      setActiveTab(null);
    } else {
      setActiveTab(value);
    }
  };

  const handleSelect = async () => {
    if (isUnavailable) return;
    
    // Check if user is logged in
    if (!user) {
      // Store the intended destination URL
      const adults = searchParams.get('adults') || '1';
      const children = searchParams.get('children') || '0';
      const infants = searchParams.get('infants') || '0';
      
      const params = new URLSearchParams({
        traceId,
        offerId: selectedFareId,
        adults,
        children,
        infants,
      });
      const redirectUrl = `/offerprice?${params.toString()}`;
      localStorage.setItem('redirectAfterLogin', redirectUrl);
      
      // Redirect to login page
      router.push('/auth/login');
      return;
    }
    
    setIsLoading(true);

    const adults = searchParams.get('adults') || '1';
    const children = searchParams.get('children') || '0';
    const infants = searchParams.get('infants') || '0';

    try {
      // Use the centralized fetchOfferPrice function
      const offerData = await fetchOfferPrice(traceId, [selectedFareId], null);

      if (offerData.success === false || offerData.info?.error) {
        setIsUnavailable(true);
        toast({
          title: "Fare Unavailable",
          description: "The selected fare is no longer available. Please choose another flight.",
          variant: "destructive",
        });
      } else {
        // Construct the URL and redirect
        const params = new URLSearchParams({
          traceId,
          offerId: selectedFareId,
          adults,
          children,
          infants,
        });
        router.push(`/offerprice?${params.toString()}`);
      }
    } catch (error) {
      console.error("Failed to verify offer price:", error);
      toast({
        title: "Error",
        description: "Could not verify the fare. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate markup-adjusted total price for fare summary
  const totalPrice = fareDetailListWithMarkup.reduce((sum, { fareDetail }) => sum + (fareDetail.subTotal || 0), 0);

  // Helper to get the correct calculated total (baseFare + tax + otherFee + vat - discount)
  function getSummaryTotal(flight: any) {
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

  const getCurrentFareDetailList = () => {
    if (selectedFareId === flight.offer.offerId) {
      return fareDetailListWithMarkup;
    }
    const selectedUpSell = upSellBrandListWithMarkup?.find(
      ({ upSellBrand }) => upSellBrand.offerId === selectedFareId
    );
    return selectedUpSell?.upSellBrand.fareDetailList || [];
  };

  const getCurrentPrice = () => {
    if (selectedFareId === flight.offer.offerId) {
      return flight.offer.price;
    }
    const selectedUpSell = upSellBrandListWithMarkup?.find(
      ({ upSellBrand }) => upSellBrand.offerId === selectedFareId
    );
    return selectedUpSell?.upSellBrand.price || flight.offer.price;
  };

  // Helper to calculate Amount as (BaseFare + Tax + Other + AIT VAT) x Pax Count
  function calculateAmount(fareDetail: FareDetail) {
    return (
      (fareDetail.baseFare + fareDetail.tax + fareDetail.otherFee + fareDetail.vat) *
      fareDetail.paxCount
    );
  }

  if (!flight?.offer || !flight.offer.paxSegmentList || flight.offer.paxSegmentList.length === 0) {
    return <div className="border rounded-lg p-4 text-red-500">Invalid flight data provided.</div>;
  }

  const currentPrice = getCurrentPrice();
  const payable = currentPrice.totalPayable.total || 0;
  const gross = currentPrice.gross?.total || 0;
  const vat = (currentPrice.totalVAT && currentPrice.totalVAT.total) || 0;
  const markupPercent = markup; // from your markup logic
  
  // Calculate markup amount and total with markup
  const { totalAmount, markupAmount } = calculateTotalWithMarkup({
    payable,
    vat,
    markupPercent,
  });

  // Update fare options with markup-adjusted prices
  const updatedFareOptions = fareOptions.map(option => {
    if (option.id === flight.offer.offerId) {
      // Base fare option - use markup-adjusted total
      return { ...option, price: totalAmount };
    } else {
      // Upsell options - calculate markup for each upsell
      const upsellPayable = option.price; // Original price
      const upsellVat = 0; // Default VAT for upsells
      const { totalAmount: upsellTotalAmount } = calculateTotalWithMarkup({
        payable: upsellPayable,
        vat: upsellVat,
        markupPercent,
      });
      return { ...option, price: upsellTotalAmount };
    }
  });

  const selectedFare = updatedFareOptions.find(option => option.id === selectedFareId) || updatedFareOptions[0];

  return (
    <Card className={`overflow-hidden dark:bg-black/95 ${disableUpsellOptions && selected ? 'bg-blue-50' : 'bg-white'}`}>
      <CardContent className="p-4">
        <div className={`w-full ${disableUpsellOptions ? '' : 'grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4'}`}>
          {/* Left Column */}
          <div className="w-full">
            {/* Airline Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {customRadio}
                <div className="relative w-10 h-10 rounded-md bg-[#E3E3E3] flex items-center justify-center ml-7">
                  {imgError || !logoUrl ? (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <SendHorizonal className="w-4 h-4 text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={logoUrl}
                      alt={firstSegment.marketingCarrierInfo.carrierName}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  )}
                </div>
                <div>
                  <div className="text-base font-semibold">{firstSegment.marketingCarrierInfo.carrierName}</div>
                  <div className="text-xs text-muted-foreground">
                    {flightNumbers}
                  </div>
                </div>
              </div>
              {/* Aircraft info top right for OnewayFlightCard only */}
              {!disableUpsellOptions && (
                <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                  <Plane className="w-4 h-4" />
                  <span>{firstSegment.iatA_AircraftType.iatA_AircraftTypeCode}</span>
                </div>
              )}
              {/* Fare top right for PairedOnewayFlightCard and mobile cards */}
              {disableUpsellOptions && (
                                  <div className="flex flex-col items-end min-w-[120px]">
                    <div className="text-2xl font-bold text-right">
                      {amountType === 'official' ? (
                        // Show gross amount (original price without markup)
                        <span>
                          BDT {currentPrice.gross?.total.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) || payable.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                        </span>
                      ) : (
                        // Show markup amount (price with markup applied)
                        <span>
                          BDT {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                    {/* Show strikethrough only for offer fare when gross is different */}
                    {amountType !== 'official' && currentPrice.gross && currentPrice.gross.total !== totalAmount && (
                      <div className="text-xs text-gray-400 line-through">
                        BDT {currentPrice.gross.total.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-600">
                      {amountType === 'official' ? 'Official Price' : 'Total Price'}
                    </div>
                  </div>
              )}
            </div>

            {/* Flight Details */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 w-full">
              <div className="grid grid-cols-[1fr,auto,1fr] gap-6 items-start">
                {/* Departure */}
                <div>
                  <div className="text-base font-bold">
                    {firstSegment.departure.iatA_LocationCode}
                  </div>
                  <div className="text-xl md:text-3xl font-extrabold my-1">{departure.time}</div>
                  <div className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">
                    {getCityNameByCode(firstSegment.departure.iatA_LocationCode)}
                  </div>
                  <div className="text-[13px] text-gray-600 dark:text-gray-400">
                    {departure.date}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Terminal: {firstSegment.departure.terminalName || '-'}
                  </div>
                </div>

                {/* Duration */}
                <div className="flex flex-col items-center justify-center">
                  <FlightPathGraphic duration={formatDuration(totalTripDurationMins.toString())} stops={stopInfo} />
                  {totalLayoverMins > 0 && (
                    <div className="text-xs text-gray-500 mt-1">Layover: {formatLayover(totalLayoverMins)}</div>
                  )}
                </div>

                {/* Arrival */}
                <div className="text-right">
                  <div className="text-base font-bold">
                    {lastSegment.arrival.iatA_LocationCode}
                  </div>
                  <div className="text-xl md:text-3xl font-extrabold my-1">{arrival.time}</div>
                  <div className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">
                    {getCityNameByCode(lastSegment.arrival.iatA_LocationCode)}
                  </div>
                  <div className="text-[13px] text-gray-600 dark:text-gray-400">
                    {arrival.date}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Terminal: {lastSegment.arrival.terminalName || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Info Row */}
            <div className={`flex items-center gap-4 w-full${disableUpsellOptions ? '' : ' mt-2'}`}>
              {/* Refundable Status */}
              {flight.offer.refundable ? (
                <div className="flex items-center gap-1.5 text-[13px] text-green-600 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Refundable</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[13px] text-red-400 font-medium">
                  <ShieldOff className="w-4 h-4" />
                  <span>Non-Refundable</span>
                </div>
              )}

              {/* Divider */}
              <div className="h-4 w-px bg-gray-200"></div>

              {/* Cabin Type and Booking Class (aircraft info only for paired) */}
              <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                <Gem className="w-4 h-4" />
                <span>{(firstSegment.cabinType || 'Economy') + ' ' + (firstSegment.rbd || 'E')}</span>
                {/* Aircraft info beside cabin class only for paired */}
                {disableUpsellOptions && <><Plane className="w-4 h-4 ml-3" /><span>{firstSegment.iatA_AircraftType.iatA_AircraftTypeCode}</span></>}
              </div>
            </div>
          </div>

          {/* Right Column */}
          {!disableUpsellOptions && (
            <div className="lg:border-l lg:pl-4">
              {/* Fare Selection Dropdown (hidden if disableUpsellOptions) */}
              <div className="mb-4">
                <Select value={selectedFareId} onValueChange={handleFareSelection}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedFare && selectedFare.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {updatedFareOptions.map((option, index) => {
                      if (!option) return null;
                      return (
                        <SelectItem key={`${option.id}-${index}`} value={option.id} className="cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <span>{option.name}</span>
                            <span className="text-sm font-medium">BDT {option.price.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Flight Summary Info (features) - hidden if disableUpsellOptions */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Luggage className="w-3.5 h-3.5 text-green-600" />
                  <span>Adult Baggage: {selectedFare && selectedFare.features.baggage}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Gem className="w-3.5 h-3.5 text-green-600" />
                  <span>Booking Class: E</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Soup className="w-3.5 h-3.5 text-green-600" />
                  <span>Meal Included</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Armchair className="w-3.5 h-3.5 text-green-600" />
                  <span>{selectedFare && selectedFare.features.seatsRemaining} seats remaining</span>
                </div>
              </div>

              {/* Fare Amount: right column only if not disableUpsellOptions */}
              <div className="mb-2">
                <div className="flex items-center justify-end gap-2">
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold text-right">
                      {amountType === 'official' ? (
                        // Show gross amount (original price without markup)
                        <span>
                          BDT {currentPrice.gross?.total.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) || payable.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                        </span>
                      ) : (
                        // Show markup amount (price with markup applied)
                        <span>
                          BDT {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                        </span>
                      )}
                      {/* Show strikethrough only for offer fare when gross is different */}
                      {amountType !== 'official' && currentPrice.gross && currentPrice.gross.total !== totalAmount && (
                        <div className="text-xs text-gray-400 line-through">
                          BDT {currentPrice.gross.total.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {amountType === 'official' ? 'Official Price' : 'Total Price'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Select Button */}
              <div>
                {customRadio ? customRadio : (
                  !hideSelectButton && (
                    <Button onClick={handleSelect} disabled={isLoading || isUnavailable} className="w-full bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black">
                      {isLoading ? "Checking..." : isUnavailable ? "Unavailable" : "Select"}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Tabs */}
        <div className="mt-2 border-t pt-2">
          <Tabs value={activeTab || ""} className="w-full">
            <div className={`${disableUpsellOptions ? 'overflow-x-auto whitespace-nowrap min-w-0' : 'overflow-x-auto -mx-4 px-4 md:overflow-visible md:px-0 md:mx-0'}`}>
              <TabsList className={`w-full ${disableUpsellOptions ? 'flex min-w-max' : 'grid grid-cols-5 min-w-[500px] md:min-w-0'}`}>
                <TabsTrigger 
                  value="flight" 
                  className="text-xs whitespace-nowrap"
                  onClick={() => handleTabClick('flight')}
                >
                  <SendHorizonal className="w-3.5 h-3.5 mr-1" />
                  Flight Details
                </TabsTrigger>
                <TabsTrigger 
                  value="fare" 
                  className="text-xs whitespace-nowrap"
                  onClick={() => handleTabClick('fare')}
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1" />
                  Fare Summary
                </TabsTrigger>
                <TabsTrigger 
                  value="baggage" 
                  className="text-xs whitespace-nowrap"
                  onClick={() => handleTabClick('baggage')}
                >
                  <Briefcase className="w-3.5 h-3.5 mr-1" />
                  Baggage
                </TabsTrigger>
                <TabsTrigger 
                  value="notice" 
                  className="text-xs whitespace-nowrap"
                  onClick={() => handleTabClick('notice')}
                >
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Notice
                </TabsTrigger>
                <TabsTrigger 
                  value="select" 
                  className="text-xs whitespace-nowrap"
                  onClick={() => handleTabClick('select')}
                >
                  <ChevronRight className="w-3.5 h-3.5 mr-1" />
                  Select Fare
                </TabsTrigger>
              </TabsList>
            </div>

            {activeTab && (
              <>
                <TabsContent value="flight">
                  <div className="p-4">
                    {/* Flight Segments - parent box for all segments */}
                    <div className="mb-8 rounded-lg border bg-gray-50 dark:bg-gray-900/50 p-4">
                      <div className="font-bold text-gray-700 text-sm mb-2 uppercase tracking-wide">Flight Segments</div>
                      {flight.offer.paxSegmentList.map(({ paxSegment }, index, arr) => (
                        <div key={index}>
                          {/* Segment Card */}
                          <div className="flex flex-col md:flex-row md:items-center md:gap-4 bg-white dark:bg-gray-900/50 rounded-lg border p-3 md:p-4">
                            {/* Airline and meta info */}
                            <div className="flex items-center gap-2 mb-2 md:mb-0 md:w-56 min-w-0">
                              <img src={`https://images.kiwi.com/airlines/64x64/${paxSegment.marketingCarrierInfo.carrierDesigCode}.png`} alt={paxSegment.marketingCarrierInfo.carrierName} className="w-8 h-8 rounded-md bg-white border" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-xs truncate">{paxSegment.marketingCarrierInfo.carrierName}</span>
                                <span className="text-xs text-gray-500 truncate">{paxSegment.marketingCarrierInfo.carrierDesigCode} {paxSegment.flightNumber} | {paxSegment.iatA_AircraftType.iatA_AircraftTypeCode}</span>
                                <span className="text-xs text-gray-500 truncate">{paxSegment.cabinType} {paxSegment.rbd}</span>
                              </div>
                            </div>
                            {/* Departure/Arrival info and FlightPathGraphic */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-row items-center justify-between gap-2">
                                <div className="flex flex-col items-start min-w-0">
                                  <span className="text-lg font-bold">{formatDateTime(paxSegment.departure.aircraftScheduledDateTime).time}</span>
                                  <span className="text-xs text-gray-500">{formatDateTime(paxSegment.departure.aircraftScheduledDateTime).date}</span>
                                  <span className="text-xs text-gray-700 truncate">Terminal: {paxSegment.departure.terminalName || '-'}</span>
                                  <span className="text-xs text-gray-700 truncate">{getCityNameByCode(paxSegment.departure.iatA_LocationCode)}</span>
                                </div>
                                {/* FlightPathGraphic with duration */}
                                <div className="flex flex-col items-center justify-center mx-2">
                                  <FlightPathGraphic duration={formatDuration(paxSegment.duration)} stops="" />
                                </div>
                                <div className="flex flex-col items-end min-w-0">
                                  <span className="text-lg font-bold">{formatDateTime(paxSegment.arrival.aircraftScheduledDateTime).time}</span>
                                  <span className="text-xs text-gray-500">{formatDateTime(paxSegment.arrival.aircraftScheduledDateTime).date}</span>
                                  <span className="text-xs text-gray-700 truncate">Terminal: {paxSegment.arrival.terminalName || '-'}</span>
                                  <span className="text-xs text-gray-700 truncate">{getCityNameByCode(paxSegment.arrival.iatA_LocationCode)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Layover row */}
                          {index < arr.length - 1 && (
                            <div className="flex items-center gap-2 my-2 px-4 py-2 bg-orange-50 border-l-4 border-orange-400 rounded">
                              <span className="font-semibold text-orange-700">Change of planes</span>
                              <span className="text-xs text-orange-700 font-medium">{getLayoverDuration(paxSegment, arr[index + 1].paxSegment)} Layover in {paxSegment.arrival.iatA_LocationCode}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fare">
                  <div className="p-4">
                    {/* Desktop View - Table */}
                    <div className="hidden md:block">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4 font-bold text-sm text-gray-600">Pax Type</th>
                            <th className="text-left py-2 px-4 font-bold text-sm text-gray-600">Base Fare</th>
                            <th className="text-left py-2 px-4 font-bold text-sm text-gray-600">Tax</th>
                            <th className="text-left py-2 px-4 font-bold text-sm text-gray-600">Other</th>
                            <th className="text-left py-2 px-4 font-bold text-sm text-gray-600">AIT VAT</th>
                            <th className="text-left py-2 px-4 font-bold text-sm text-gray-600">Pax Count</th>
                            <th className="text-left py-2 px-4 font-bold text-sm text-gray-600">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCurrentFareDetailList().map(({ fareDetail }, index) => (
                            <tr key={index} className="border-b last:border-b-0">
                              <td className="py-3 px-4">{fareDetail.paxType}</td>
                              <td className="py-3 px-4">{fareDetail.baseFare}</td>
                              <td className="py-3 px-4">{fareDetail.tax}</td>
                              <td className="py-3 px-4">{fareDetail.otherFee}</td>
                              <td className="py-3 px-4">{fareDetail.vat}</td>
                              <td className="py-3 px-4">{fareDetail.paxCount}</td>
                              <td className="py-3 px-4 font-medium">
                                BDT {calculateAmount(fareDetail).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t">
                          <tr>
                            <td colSpan={6} className="py-3 px-4 font-medium text-right">Total Price:</td>
                            <td className="py-3 px-4 font-medium">
                              BDT {getCurrentFareDetailList().reduce((sum, { fareDetail }) => sum + calculateAmount(fareDetail), 0).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Mobile View - List */}
                    <div className="md:hidden">
                      {getCurrentFareDetailList().map(({ fareDetail }, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden mb-4">
                          <div className="grid grid-cols-2 text-sm">
                            <div className="border-b border-r p-3 bg-gray-50">
                              <span className="text-gray-600">Pax Type</span>
                            </div>
                            <div className="border-b p-3">
                              <span>{fareDetail.paxType}</span>
                            </div>

                            <div className="border-b border-r p-3 bg-gray-50">
                              <span className="text-gray-600">Base Fare</span>
                            </div>
                            <div className="border-b p-3">
                              <span>{fareDetail.baseFare}</span>
                            </div>

                            <div className="border-b border-r p-3 bg-gray-50">
                              <span className="text-gray-600">Tax</span>
                            </div>
                            <div className="border-b p-3">
                              <span>{fareDetail.tax}</span>
                            </div>

                            <div className="border-b border-r p-3 bg-gray-50">
                              <span className="text-gray-600">Other</span>
                            </div>
                            <div className="border-b p-3">
                              <span>{fareDetail.otherFee}</span>
                            </div>

                            <div className="border-b border-r p-3 bg-gray-50">
                              <span className="text-gray-600">AIT VAT</span>
                            </div>
                            <div className="border-b p-3">
                              <span>{fareDetail.vat}</span>
                            </div>

                            <div className="border-b border-r p-3 bg-gray-50">
                              <span className="text-gray-600">Pax Count</span>
                            </div>
                            <div className="border-b p-3">
                              <span>{fareDetail.paxCount}</span>
                            </div>

                            <div className="border-r p-3 bg-gray-50">
                              <span className="text-gray-600">Amount</span>
                            </div>
                            <div className="p-3">
                              <span className="font-medium">BDT {calculateAmount(fareDetail).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-right mt-4">
                        <div className="text-sm text-gray-600">Total Price</div>
                        <div className="text-lg font-bold">
                          BDT {getCurrentFareDetailList().reduce((sum, { fareDetail }) => sum + calculateAmount(fareDetail), 0).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="baggage">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-4">Baggage Information</h3>
                    
                    {/* Check-in Baggage */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <Briefcase className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium mb-1">Check-in Baggage</h4>
                          {flight.offer.baggageAllowanceList[0]?.baggageAllowance.checkIn.length > 0 ? (
                            <div className="space-y-1">
                              {flight.offer.baggageAllowanceList[0].baggageAllowance.checkIn.map((item, index) => (
                                <div key={index} className="text-sm text-gray-600">
                                  {item.paxType}: {item.allowance}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              Adult Baggage: 20kg
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Maximum dimensions per piece: 158cm (L + W + H)
                          </div>
                        </div>
                      </div>

                      {/* Cabin Baggage */}
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <Package className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium mb-1">Cabin Baggage</h4>
                          {flight.offer.baggageAllowanceList[0]?.baggageAllowance.cabin.length > 0 ? (
                            <div className="space-y-1">
                              {flight.offer.baggageAllowanceList[0].baggageAllowance.cabin.map((item, index) => (
                                <div key={index} className="text-sm text-gray-600">
                                  {item.paxType}: {item.allowance}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              1 piece up to 7kg
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Maximum dimensions: 55 x 35 x 25cm
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="text-xs text-gray-500 mt-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Additional baggage can be purchased during check-in or through manage booking.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notice">
                  <div className="p-4">
                    {/* Reporting Time */}
                    <div className="space-y-4">
                      <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-400 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Reporting & Check-in Time
                        </h3>
                        <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                          <li>• Please arrive at the airport at least 3 hours before departure for international flights</li>
                          <li>• Check-in counter closes 1 hour before departure</li>
                          <li>• Boarding gate closes 30 minutes before departure</li>
                        </ul>
                      </div>

                      {/* Travel Documents */}
                      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Required Travel Documents
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                          <li>• Valid passport with minimum 6 months validity</li>
                          <li>• Valid visa (if required)</li>
                          <li>• Printed or digital copy of your e-ticket</li>
                          <li>• Any required health documents or certificates</li>
                        </ul>
                      </div>

                      {/* Prohibited Items */}
                      <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Prohibited Items
                        </h3>
                        <ul className="space-y-2 text-sm text-red-700 dark:text-red-300">
                          <li>• Weapons and firearms</li>
                          <li>• Explosives and flammable items</li>
                          <li>• Sharp objects and cutting tools</li>
                          <li>• Toxic and radioactive materials</li>
                          <li>• Compressed gases and aerosols</li>
                          <li>• Illegal drugs and narcotics</li>
                        </ul>
                      </div>

                      {/* Additional Information */}
                      <div className="bg-gray-50 dark:bg-gray-900/10 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-400 mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Additional Information
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <li>• Liquids in carry-on must be in containers of 100ml or less</li>
                          <li>• Electronic devices must be charged and functional</li>
                          <li>• Special assistance must be requested at least 48 hours before departure</li>
                          <li>• Currency declaration may be required as per customs regulations</li>
                        </ul>
                      </div>

                      {/* Disclaimer */}
                      <div className="text-xs text-gray-500 mt-4">
                        <p className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>This information is provided as a general guide. Requirements may vary based on destination, airline policy, and current regulations. Please verify specific requirements with the airline or relevant authorities.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="select">
                  {/* Render fare options as cards with radio selection, similar to ReturnFlightCard */}
                  <div className="flex flex-wrap gap-4 p-2">
                    {updatedFareOptions.map((option, idx) => (
                      <div
                        key={`${option.id}-${idx}`}
                        className={`flex-1 min-w-[260px] max-w-[340px] border rounded-lg p-4 cursor-pointer transition-all ${selectedFareId === option.id ? 'ring-2 ring-primary border-primary bg-gray-50' : 'border-gray-200 bg-white hover:border-primary/60'}`}
                        onClick={() => setSelectedFareId(option.id)}
                        tabIndex={0}
                        role="button"
                        onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedFareId(option.id); }}
                        style={{ position: 'relative' }}
                      >
                        <div className="flex items-center mb-2">
                          <input
                            type="radio"
                            checked={selectedFareId === option.id}
                            onChange={() => setSelectedFareId(option.id)}
                            className="accent-green-600 mr-2 pointer-events-none"
                            name="fareOptionRadio"
                            style={{ accentColor: '#22c55e' }}
                          />
                          <span className="font-semibold text-base">{option.name}</span>
                          {option.features.refundable && (
                            <ShieldCheck className="w-4 h-4 text-green-600 ml-2" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-700 mb-2">
                          <div><Users className="inline w-4 h-4 mr-1" />{option.features.seatsRemaining} seats left</div>
                          <div><Luggage className="inline w-4 h-4 mr-1" />{option.features.baggage} Check-in</div>
                          <div><Package className="inline w-4 h-4 mr-1" />Cabin baggage</div>
                          <div><Soup className="inline w-4 h-4 mr-1" />Meal included</div>
                          {option.features.refundable && <div><ShieldCheck className="inline w-4 h-4 mr-1" />Refundable</div>}
                        </div>
                        <ul className="list-disc pl-5 text-xs text-gray-600 mb-2">
                          {option.features.benefits.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                        <div className="mt-2 flex items-end justify-between">
                          <div className="text-lg font-bold">
                            BDT {option.price.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                            {option.gross && option.gross !== option.price && (
                              <div className="text-xs text-gray-400 line-through">
                                BDT {option.gross.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                              </div>
                            )}
                          </div>
                          {option.gross && option.gross > option.price && (
                            <div className="text-xs text-green-600 font-semibold ml-2">Save BDT {(option.gross - option.price).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnewayFlightCard;

export function OnewayFlightCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-white dark:bg-black/95">
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4">
          {/* Left Column Skeleton */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-md" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-2">
              <div className="grid grid-cols-[1fr,auto,1fr] gap-6 items-start">
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <Skeleton className="h-10 w-32 mb-2" />
                  <Skeleton className="h-1 w-12 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <Skeleton className="h-4 w-20" />
              <div className="h-4 w-px bg-gray-200" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          {/* Right Column Skeleton */}
          <div className="lg:border-l lg:pl-4">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function getLayoverDuration(segA: PaxSegment, segB: PaxSegment) {
  const arr = new Date(segA.arrival.aircraftScheduledDateTime);
  const dep = new Date(segB.departure.aircraftScheduledDateTime);
  const mins = Math.floor((dep.getTime() - arr.getTime()) / (1000 * 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

