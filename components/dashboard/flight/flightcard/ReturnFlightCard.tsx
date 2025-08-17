'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SendHorizonal, DollarSign, Briefcase, AlertCircle, Check, Package, Coffee, Users, ChevronRight, Shield, ShieldCheck, ShieldOff, Armchair, Luggage, Gem, Soup, Plane, Clock, Building2, FileText, AlertTriangle, Info } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { airports as allAirports, Airport } from '@/components/dashboard/flight/airport/airportUtils';
import { Skeleton } from "@/components/ui/skeleton";
import { fetchOfferPrice } from '@/lib/api';
import { getMarkupByAirline } from '@/lib/markup';
import { calculateTotalWithMarkup } from '@/lib/calculateTotalWithMarkup';
import FlightPathGraphic from './FlightPathGraphic';

// Place this at the very top of the file, before any usage:
type Price = {
  totalPayable: { total: number; curreny: string };
  gross?: { total: number; curreny: string };
  discount?: { total: number; curreny: string };
  totalVAT?: { total: number; curreny: string };
};

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

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

// Helper function to calculate total duration
const calculateTotalDuration = (segments: FlightSegment[]): string => {
  if (!segments || segments.length === 0) return '0h 0m';
  const startTime = new Date(segments[0].Departure.ScheduledTime);
  const endTime = new Date(segments[segments.length - 1].Arrival.ScheduledTime);
  const durationInMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const getStopInfo = (segments: FlightSegment[]): string => {
  if (!segments || segments.length <= 1) return 'Direct';
  const stops = segments.length - 1;
  return `${stops} Stop${stops > 1 ? 's' : ''}`;
};

const getConnectionCities = (segments: FlightSegment[]): string[] => {
  if (!segments || segments.length <= 1) return [];
  return segments.slice(1, -1).map(segment => segment.Departure.IATACode);
};

interface FlightSegment {
  Departure: {
    IATACode: string;
    Terminal?: string;
    ScheduledTime: string;
    AirportName?: string;
    CityName?: string;
  };
  Arrival: {
    IATACode: string;
    Terminal?: string;
    ScheduledTime: string;
    AirportName?: string;
    CityName?: string;
  };
  MarketingCarrier: {
    carrierDesigCode?: string;
    marketingCarrierFlightNumber?: string;
    carrierName: string;
  };
  OperatingCarrier?: {
    carrierDesigCode?: string;
    carrierName: string;
  };
  Logo?: string;
  AircraftType?: string;
  Duration?: string;
  CabinType?: string;
  FlightNumber?: string;
  ReturnJourney?: boolean;
  SegmentGroup?: number;
  RBD?: string;
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

interface PriceBreakdownDetail {
  totalPayable: {
    total: number;
    currency: string;
  };
  gross: {
    total: number;
    currency: string;
  };
  discount: {
    total: number;
    currency: string;
  };
  totalVAT: {
    total: number;
    currency: string;
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

interface PaxSegment {
  departure: {
    iatA_LocationCode: string;
    terminalName: string;
    aircraftScheduledDateTime: string;
  };
  arrival: {
    iatA_LocationCode: string;
    terminalName: string;
    aircraftScheduledDateTime: string;
  };
  marketingCarrierInfo: {
    carrierDesigCode: string;
    marketingCarrierFlightNumber: string;
    carrierName: string;
  };
  operatingCarrierInfo: {
    carrierDesigCode: string;
    carrierName: string;
  };
  iatA_AircraftType: {
    iatA_AircraftTypeCode: string;
  };
  rbd: string;
  flightNumber: string;
  duration: string;
  cabinType: string;
  segmentGroup: number;
  returnJourney: boolean;
}

interface FlightOffer {
  offer: {
    offerId: string;
    validatingCarrier: string;
    refundable: boolean;
    fareType: string;
    paxSegmentList: {
      paxSegment: PaxSegment;
    }[];
    fareDetailList: {
      fareDetail: FareDetail;
    }[];
    price: {
      totalPayable: {
        total: number;
        curreny: string;
      };
      gross: {
        total: number;
        curreny: string;
      };
      discount: {
        total: number;
        curreny: string;
      };
      totalVAT: {
        total: number;
        curreny: string;
      };
    };
    baggageAllowanceList: {
      baggageAllowance: {
        departure: string;
        arrival: string;
        checkIn: {
          paxType: string;
          allowance: string;
        }[];
        cabin: {
          paxType: string;
          allowance: string;
        }[];
      };
    }[];
    upSellBrandList: {
      upSellBrand: {
        offerId: string;
        brandName: string;
        refundable: boolean;
        fareDetailList: {
          fareDetail: FareDetail;
        }[];
        price: {
          totalPayable: {
            total: number;
            curreny: string;
          };
        };
        baggageAllowanceList: {
          baggageAllowance: {
            departure: string;
            arrival: string;
            checkIn: {
              paxType: string;
              allowance: string;
            }[];
            cabin: {
              paxType: string;
              allowance: string;
            }[];
          };
        }[];
        rbd: string;
        meal: boolean;
        refundAllowed: boolean;
        exchangeAllowed: boolean;
      };
    }[];
    seatsRemaining: string;
    source: number;
  };
}

// Helper function to determine if a segment is a return segment
const isReturnSegment = (segment: FlightSegment): boolean => {
  return segment.ReturnJourney === true || segment.SegmentGroup === 1;
};

function getCityNameByCode(code: string): string {
  if (!code) return 'Unknown City';
  const airport = allAirports.find(a => a.code.toUpperCase() === code.toUpperCase());
  return airport?.city || 'Unknown City';
}

interface ReturnFlightCardProps {
  flight: FlightOffer;
  traceId: string;
  amountType?: 'official' | 'offer' | '';
}

const ReturnFlightCard: React.FC<ReturnFlightCardProps> = (props) => {
  const { flight, traceId, amountType } = props;
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

  // Split segments into outbound and inbound
  const getFlightSegments = (flight: FlightOffer): { outbound: FlightSegment[], inbound: FlightSegment[] } => {
    const allSegments = flight.offer.paxSegmentList
      .map(({ paxSegment }) => ({
        Departure: {
          IATACode: paxSegment.departure.iatA_LocationCode,
          Terminal: paxSegment.departure.terminalName,
          ScheduledTime: paxSegment.departure.aircraftScheduledDateTime
        },
        Arrival: {
          IATACode: paxSegment.arrival.iatA_LocationCode,
          Terminal: paxSegment.arrival.terminalName,
          ScheduledTime: paxSegment.arrival.aircraftScheduledDateTime
        },
        MarketingCarrier: {
          carrierDesigCode: paxSegment.marketingCarrierInfo.carrierDesigCode,
          marketingCarrierFlightNumber: paxSegment.marketingCarrierInfo.marketingCarrierFlightNumber,
          carrierName: paxSegment.marketingCarrierInfo.carrierName
        },
        OperatingCarrier: {
          carrierDesigCode: paxSegment.operatingCarrierInfo.carrierDesigCode,
          carrierName: paxSegment.operatingCarrierInfo.carrierName
        },
        AircraftType: paxSegment.iatA_AircraftType.iatA_AircraftTypeCode,
        Duration: paxSegment.duration,
        CabinType: paxSegment.cabinType,
        FlightNumber: paxSegment.flightNumber,
        ReturnJourney: paxSegment.returnJourney,
        SegmentGroup: paxSegment.segmentGroup,
        RBD: paxSegment.rbd
      })) as FlightSegment[];

    // First try to split by segmentGroup
    const outboundByGroup = allSegments.filter(s => !s.ReturnJourney && s.SegmentGroup === 0);
    const inboundByGroup = allSegments.filter(s => s.ReturnJourney || s.SegmentGroup === 1);

    if (inboundByGroup.length > 0) {
      return {
        outbound: outboundByGroup,
        inbound: inboundByGroup
      };
    }

    // If no segments found by group, try splitting by ReturnJourney flag
    return {
      outbound: allSegments.filter(s => !s.ReturnJourney),
      inbound: allSegments.filter(s => s.ReturnJourney)
    };
  };

  const { outbound, inbound } = useMemo(() => getFlightSegments(flight), [flight]);

  // Determine if this is actually a return trip
  const isActuallyReturnTrip = useMemo(() => {
    return flight.offer.fareType === 'return' || 
      flight.offer.fareType === 'specialReturn' || 
      outbound.some(isReturnSegment);
  }, [flight.offer.fareType, outbound]);

  // Get segments
  const firstOutboundSegment = outbound[0];
  const lastOutboundSegment = outbound[outbound.length - 1];
  const firstInboundSegment = inbound[0];
  const lastInboundSegment = inbound[inbound.length - 1];

  // Helper function to normalize fare details
  const getNormalizedFareDetails = (flight: FlightOffer) => {
    const fareDetails = flight.offer.fareDetailList;
    const midPoint = Math.floor(fareDetails.length / 2);

    return {
      outbound: fareDetails.slice(0, midPoint).map(({ fareDetail }) => fareDetail),
      inbound: fareDetails.slice(midPoint).map(({ fareDetail }) => fareDetail)
    };
  };

  // Get baggage info
  const getBaggageInfo = (type: 'checkIn' | 'cabin') => {
    const baggage = flight.offer.baggageAllowanceList[0]?.baggageAllowance[type];
    return baggage?.[0]?.allowance || (type === 'checkIn' ? '2P' : 'SB');
  };

  // Create fare options from upSellBrandList
  const fareOptions = useMemo(() => {
    // Ensure upSellBrandList exists and has items
    const upSellBrands = flight.offer.upSellBrandList || [];
    
    // If no upsell brands, create a base fare option
    if (upSellBrands.length === 0) {
      return [{
        id: flight.offer.offerId,
        name: "Basic",
        price: flight.offer.price.totalPayable.total,
        gross: flight.offer.price.gross?.total,
        features: {
          refundable: flight.offer.refundable,
          baggage: getBaggageInfo('checkIn'),
          seatsRemaining: parseInt(flight.offer.seatsRemaining || '0', 10),
          discount: 0,
          benefits: [
            `${getBaggageInfo('checkIn')} Check-in baggage`,
            `${getBaggageInfo('cabin')} Cabin baggage`,
            flight.offer.refundable ? "Refundable" : "Non-refundable",
            "Standard seat selection",
            "Regular check-in"
          ]
        }
      }];
    }

    // Map upsell brands to fare options
    return upSellBrands.map(({ upSellBrand }) => ({
      id: upSellBrand.offerId,
      name: upSellBrand.brandName,
      price: upSellBrand.price.totalPayable.total,
      gross: (upSellBrand.price as any).gross?.total,
      features: {
        refundable: upSellBrand.refundable,
        baggage: getBaggageInfo('checkIn'),
        seatsRemaining: parseInt(flight.offer.seatsRemaining || '0', 10),
        discount: upSellBrand.price.totalPayable.total - flight.offer.price.totalPayable.total,
        benefits: [
          `${getBaggageInfo('checkIn')} Check-in baggage`,
          `${getBaggageInfo('cabin')} Cabin baggage`,
          upSellBrand.meal ? "Meal included" : "No meal included",
          upSellBrand.refundable ? "Refundable" : "Non-refundable",
          upSellBrand.exchangeAllowed ? "Exchange allowed" : "No exchange",
          upSellBrand.brandName.includes('PREMIUM') || upSellBrand.brandName.includes('BUSINESS') ? "Priority check-in" : "",
          upSellBrand.brandName.includes('BUSINESS') ? "Lounge access" : "",
        ].filter(Boolean)
      }
    }));
  }, [flight.offer, getBaggageInfo]);

  // Handle booking
  const handleSelect = async () => {
    if (isUnavailable) return;
    
    // Check if user is logged in
    if (!user) {
      // Store the intended destination URL
      const adults = searchParams.get('adults') || '1';
      const children = searchParams.get('children') || '0';
      const infants = searchParams.get('infants') || '0';

      // For return flights, the offer might be a single one for both ways,
      // or you might need to combine two. The logic here assumes a single offerId
      // for the selected fare, which is consistent with the `selectedFareId` state.
      const offerIdToCheck = selectedFareId;
      
      const params = new URLSearchParams({
        traceId,
        offerId: offerIdToCheck,
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

    // For return flights, the offer might be a single one for both ways,
    // or you might need to combine two. The logic here assumes a single offerId
    // for the selected fare, which is consistent with the `selectedFareId` state.
    const offerIdToCheck = selectedFareId;

    try {
      const offerData = await fetchOfferPrice(traceId, [offerIdToCheck], null);

      if (offerData.success === false || offerData.info?.error) {
        setIsUnavailable(true);
        toast({
          title: "Fare Unavailable",
          description: "The selected fare is no longer available. Please choose another flight.",
          variant: "destructive",
        });
      } else {
        const params = new URLSearchParams({
          traceId,
          offerId: offerIdToCheck,
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

  // Calculate total price
  const getTotalPrice = (flight: FlightOffer): number => {
    if (flight.offer.price.totalPayable.total) {
      return flight.offer.price.totalPayable.total;
    }

    if (flight.offer.price.totalVAT.total && 
        flight.offer.price.totalVAT.total) {
      return flight.offer.price.totalVAT.total;
    }

    return 0;
  };

  // Calculate outbound info
  const outboundStops = Math.max(0, outbound.length - 1);
  const outboundStopCities = outbound.length > 1
    ? outbound.slice(1, -1)
        .map(segment => segment.Departure?.IATACode)
        .filter(Boolean)
        .join(', ')
    : '';
  const outboundDuration = firstOutboundSegment?.Duration || calculateTotalDuration(outbound);

  // Calculate inbound info
  const inboundStops = Math.max(0, inbound.length - 1);
  const inboundStopCities = inbound.length > 1
    ? inbound.slice(1, -1)
        .map(segment => segment.Departure?.IATACode)
        .filter(Boolean)
        .join(', ')
    : '';
  const inboundDuration = firstInboundSegment?.Duration || calculateTotalDuration(inbound);

  // Format dates
  const outboundDeparture = firstOutboundSegment?.Departure?.ScheduledTime 
    ? formatDateTime(firstOutboundSegment.Departure.ScheduledTime)
    : { time: '', date: '' };
  const outboundArrival = lastOutboundSegment?.Arrival?.ScheduledTime
    ? formatDateTime(lastOutboundSegment.Arrival.ScheduledTime)
    : { time: '', date: '' };
  const inboundDeparture = firstInboundSegment?.Departure?.ScheduledTime
    ? formatDateTime(firstInboundSegment.Departure.ScheduledTime)
    : { time: '', date: '' };
  const inboundArrival = lastInboundSegment?.Arrival?.ScheduledTime
    ? formatDateTime(lastInboundSegment.Arrival.ScheduledTime)
    : { time: '', date: '' };

  // Get airline info
  const outboundAirline = firstOutboundSegment?.MarketingCarrier;
  const inboundAirline = firstInboundSegment?.MarketingCarrier;

  // Get airline code for logo
  const outboundAirlineCode = outboundAirline?.carrierDesigCode?.toUpperCase() || '';
  const inboundAirlineCode = inboundAirline?.carrierDesigCode?.toUpperCase() || '';

  useEffect(() => {
    if (!outboundAirlineCode) {
      setImgError(true);
      return;
    }
    
    const logoUrl = `https://images.kiwi.com/airlines/64x64/${outboundAirlineCode}.png`;
    setLogoUrl(logoUrl);
    setImgError(false);
  }, [outboundAirlineCode]);

  useEffect(() => {
    async function fetchAndApplyMarkup() {
      const airlineCode = flight.offer.paxSegmentList[0].paxSegment.marketingCarrierInfo.carrierDesigCode;
      let role = 'USER';
      if (user && user.role === 'AGENT') role = 'AGENT';
      const fromAirport = flight.offer.paxSegmentList[0].paxSegment.departure.iatA_LocationCode;
      const toAirport = flight.offer.paxSegmentList[flight.offer.paxSegmentList.length - 1].paxSegment.arrival.iatA_LocationCode;
      const markupValue = await getMarkupByAirline(airlineCode, role, fromAirport, toAirport);
      setMarkup(markupValue);
      
      // Always set the original fare details, markup will be applied during price calculation
      setFareDetailListWithMarkup(flight.offer.fareDetailList);
      setUpSellBrandListWithMarkup(flight.offer.upSellBrandList);
    }
    fetchAndApplyMarkup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight]);

  // Get selected fare details (will be updated with markup-adjusted prices later)

  const handleFareSelection = (value: string) => {
    setSelectedFareId(value);
  };

  const handleTabClick = (value: string) => {
    if (activeTab === value) {
      setActiveTab(null);
    } else {
      setActiveTab(value);
    }
  };

  const renderFlightSegment = (segment: FlightSegment, index: number, isReturn: boolean = false) => {
    const departure = formatDateTime(segment.Departure.ScheduledTime);
    const arrival = formatDateTime(segment.Arrival.ScheduledTime);

    return (
      <div key={`${segment.FlightNumber}-${index}`}>
        {/* Flight Segment Card */}
        <div className="bg-white dark:bg-gray-900/50 rounded-lg border p-4">
          {/* Flight Number and Aircraft */}
          <div className="flex items-center gap-2 mb-3">
            <SendHorizonal className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {segment.MarketingCarrier.carrierDesigCode}-{segment.MarketingCarrier.marketingCarrierFlightNumber}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-600 ml-auto">
              <Plane className="w-3.5 h-3.5" />
              <span>{segment.AircraftType || '777W'}</span>
            </div>
          </div>

          <div className="relative">
            {/* Departure */}
            <div>
              <div className="text-xl font-bold">{segment.Departure.IATACode}</div>
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {getCityNameByCode(segment.Departure.IATACode)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {segment.Departure.AirportName}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-600">
                  Terminal {segment.Departure.Terminal || '-'}
                </span>
              </div>
              <div className="text-sm font-medium mt-1">
                {departure.date}
              </div>
              <div className="text-lg font-bold text-primary">
                {departure.time}
              </div>
            </div>

            {/* Duration Line */}
            <div className="relative my-4">
              <div className="border-t border-dotted border-gray-300 dark:border-gray-600"></div>
              <div className="absolute -top-2 right-0 flex items-center gap-1 text-xs text-gray-500 bg-white dark:bg-gray-900 pl-2">
                Duration {formatDuration(parseInt(segment.Duration || '0'))}
                <SendHorizonal className="w-3 h-3 text-primary" />
              </div>
            </div>

            {/* Arrival */}
            <div>
              <div className="text-xl font-bold">{segment.Arrival.IATACode}</div>
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {getCityNameByCode(segment.Arrival.IATACode)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {segment.Arrival.AirportName}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-600">
                  Terminal {segment.Arrival.Terminal || '-'}
                </span>
              </div>
              <div className="text-sm font-medium mt-1">
                {arrival.date}
              </div>
              <div className="text-lg font-bold text-primary">
                {arrival.time}
              </div>
            </div>
          </div>
        </div>

        {/* Connection Information */}
        {index < (isReturn ? inbound.length - 1 : outbound.length - 1) && (
          <div className="flex items-center gap-2 my-3 px-4 py-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
            <Clock className="w-4 h-4 text-orange-500" />
            <div className="text-sm text-orange-600 dark:text-orange-400">
              Connection: 2h 30m in {segment.Arrival.CityName}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Get normalized fare details

  // Helper function to get connection info
  const getConnectionInfo = (segments: FlightSegment[]): { text: string, className: string } => {
    if (!segments || segments.length <= 1) {
      return { 
        text: 'Direct', 
        className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
      };
    }

    const stops = segments.length - 1;
    const viaAirports = segments
      .slice(1, -1)
      .map(segment => segment.Departure.IATACode)
      .join(', ');

    return {
      text: `${stops} Stop${stops > 1 ? 's' : ''} via ${viaAirports}`,
      className: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
    };
  };

  // Helper function to format cabin class and RBD
  const getCabinClassWithRBD = (segment: FlightSegment): string => {
    const cabinClass = segment.CabinType || 'Economy';
    const rbd = segment.RBD || 'E';
    return `${cabinClass} ${rbd}`;
  };

  // Helper to build all flight numbers string for both legs
  function getAllLegFlightNumbers(outbound: FlightSegment[], inbound: FlightSegment[]) {
    return [...outbound, ...inbound].map(seg => `${seg.MarketingCarrier.carrierDesigCode}-${seg.MarketingCarrier.marketingCarrierFlightNumber}`).join(', ');
  }

  // Helper to get stops and via airports
  function getLegStops(segments: FlightSegment[]) {
    if (segments.length <= 1) return 'Direct';
    const stops = segments.length - 1;
    const via = segments.slice(0, -1).map(seg => seg.Arrival.IATACode).join(', ');
    return `${stops} Stop${stops > 1 ? 's' : ''} via ${via}`;
  }
  // Helper to get total duration for a leg
  function getLegDuration(segments: FlightSegment[]) {
    if (!segments.length) return '';
    const start = new Date(segments[0].Departure.ScheduledTime);
    const end = new Date(segments[segments.length - 1].Arrival.ScheduledTime);
    const mins = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  // Add a helper function getLayoverDuration(segA, segB) that returns a formatted string like '16h 30m' for the layover between two segments.
  function getLayoverDuration(segA: FlightSegment, segB: FlightSegment) {
    const arr = new Date(segA.Arrival.ScheduledTime);
    const dep = new Date(segB.Departure.ScheduledTime);
    const mins = Math.floor((dep.getTime() - arr.getTime()) / (1000 * 60));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  // Add helper to format layover minutes as 'Xh Ym'
  function formatLayover(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  // Calculate total layover mins for outbound
  const outboundLayoverMins = outbound.length > 1 ? outbound.slice(0, -1).reduce((sum, seg, idx) => {
    const arr = new Date(seg.Arrival.ScheduledTime);
    const dep = new Date(outbound[idx + 1].Departure.ScheduledTime);
    return sum + Math.max(0, Math.floor((dep.getTime() - arr.getTime()) / (1000 * 60)));
  }, 0) : 0;

  // Calculate total layover mins for inbound
  const inboundLayoverMins = inbound.length > 1 ? inbound.slice(0, -1).reduce((sum, seg, idx) => {
    const arr = new Date(seg.Arrival.ScheduledTime);
    const dep = new Date(inbound[idx + 1].Departure.ScheduledTime);
    return sum + Math.max(0, Math.floor((dep.getTime() - arr.getTime()) / (1000 * 60)));
  }, 0) : 0;

  // After selectedFare is defined
  const payable = flight.offer.price.totalPayable.total || 0;
  const vat = flight.offer.price.totalVAT.total || 0;
  const markupPercent = markup;
  
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

  // Add this helper function inside the component:
  const getCurrentFareDetailList = () => {
    // Always check upsell brands first
    const selectedUpSell = upSellBrandListWithMarkup?.find(
      ({ upSellBrand }) => upSellBrand.offerId === selectedFareId
    );
    if (selectedUpSell) {
      return selectedUpSell.upSellBrand.fareDetailList;
    }
    // Fallback to base offer
    return fareDetailListWithMarkup;
  };

  const getCurrentPrice = (): Price => {
    // Always check upsell brands first
    const selectedUpSell = upSellBrandListWithMarkup?.find(
      ({ upSellBrand }) => upSellBrand.offerId === selectedFareId
    );
    if (selectedUpSell) {
      return selectedUpSell.upSellBrand.price as Price;
    }
    // Fallback to base offer
    return flight.offer.price as Price;
  };

  // Add this helper function inside the component, after upSellBrandListWithMarkup is defined:
  const getSelectedUpSellBrand = () => {
    return upSellBrandListWithMarkup?.find(
      ({ upSellBrand }) => upSellBrand.offerId === selectedFareId
    )?.upSellBrand;
  };

  return (
    <Card className="overflow-hidden bg-white dark:bg-black/95">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4">
          {/* Left Column */}
          <div>
            {/* Outbound Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                    {imgError || !logoUrl ? (
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
                        <SendHorizonal className="w-5 h-5 text-gray-400" />
                      </div>
                    ) : (
                      <img
                        src={logoUrl}
                        alt={firstOutboundSegment.MarketingCarrier.carrierName}
                        className="w-8 h-8 object-contain"
                        onError={() => setImgError(true)}
                        style={{ backgroundColor: 'transparent' }}
                      />
                    )}
                  </div>
                  <div>
                    <div className="text-base font-semibold">{firstOutboundSegment?.MarketingCarrier?.carrierName || 'Unknown Airline'}</div>
                    <div className="text-xs text-muted-foreground">
                      {getAllLegFlightNumbers(outbound, inbound)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                    <Plane className="w-4 h-4" />
                    <span>{firstOutboundSegment?.AircraftType || '777W'}</span>
                  </div>
                </div>
              </div>

              {/* Outbound Flight Details */}
              <div className="space-y-4">
                {/* Outbound Flight */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-2">
                    {/* Departure */}
                    <div className="flex flex-col items-start min-w-0 w-1/3">
                      <div className="text-base font-bold">{firstOutboundSegment?.Departure?.IATACode || '-'}</div>
                      <div className="text-xl md:text-3xl font-extrabold my-1">{outboundDeparture.time || '-'}</div>
                      <div className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">{getCityNameByCode(firstOutboundSegment?.Departure?.IATACode)}</div>
                      <div className="text-[13px] text-gray-600 dark:text-gray-400">{outboundDeparture.date || '-'}</div>
                      <div className="text-xs text-muted-foreground mt-1">Terminal: {firstOutboundSegment?.Departure?.Terminal || '-'}</div>
                    </div>
                    {/* Center: Route, Duration, Stops */}
                    <div className="flex flex-col items-center justify-center w-1/3">
                      <FlightPathGraphic duration={getLegDuration(outbound)} stops={getLegStops(outbound)} />
                      {outboundLayoverMins > 0 && (
                        <div className="text-xs text-gray-500 mt-1">Layover: {formatLayover(outboundLayoverMins)}</div>
                      )}
                    </div>
                    {/* Arrival */}
                    <div className="flex flex-col items-end min-w-0 w-1/3">
                      <div className="text-base font-bold">{lastOutboundSegment?.Arrival?.IATACode || '-'}</div>
                      <div className="text-xl md:text-3xl font-extrabold my-1">{outboundArrival.time || '-'}</div>
                      <div className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">{getCityNameByCode(lastOutboundSegment?.Arrival?.IATACode)}</div>
                      <div className="text-[13px] text-gray-600 dark:text-gray-400">{outboundArrival.date || '-'}</div>
                      <div className="text-xs text-muted-foreground mt-1">Terminal: {lastOutboundSegment?.Arrival?.Terminal || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Return Flight */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-2">
                    {/* Departure */}
                    <div className="flex flex-col items-start min-w-0 w-1/3">
                      <div className="text-base font-bold">{firstInboundSegment?.Departure?.IATACode || '-'}</div>
                      <div className="text-xl md:text-3xl font-extrabold my-1">{inboundDeparture.time || '-'}</div>
                      <div className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">{getCityNameByCode(firstInboundSegment?.Departure?.IATACode)}</div>
                      <div className="text-[13px] text-gray-600 dark:text-gray-400">{inboundDeparture.date || '-'}</div>
                      <div className="text-xs text-muted-foreground mt-1">Terminal: {firstInboundSegment?.Departure?.Terminal || '-'}</div>
                    </div>
                    {/* Center: Route, Duration, Stops */}
                    <div className="flex flex-col items-center justify-center w-1/3">
                      <FlightPathGraphic duration={getLegDuration(inbound)} stops={getLegStops(inbound)} />
                      {inboundLayoverMins > 0 && (
                        <div className="text-xs text-gray-500 mt-1">Layover: {formatLayover(inboundLayoverMins)}</div>
                      )}
                    </div>
                    {/* Arrival */}
                    <div className="flex flex-col items-end min-w-0 w-1/3">
                      <div className="text-base font-bold">{lastInboundSegment?.Arrival?.IATACode || '-'}</div>
                      <div className="text-xl md:text-3xl font-extrabold my-1">{inboundArrival.time || '-'}</div>
                      <div className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">{getCityNameByCode(lastInboundSegment?.Arrival?.IATACode)}</div>
                      <div className="text-[13px] text-gray-600 dark:text-gray-400">{inboundArrival.date || '-'}</div>
                      <div className="text-xs text-muted-foreground mt-1">Terminal: {lastInboundSegment?.Arrival?.Terminal || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Info Row */}
              <div className="flex items-center gap-4 mt-2">
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

                {/* Cabin Type and Booking Class */}
                <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                  <Gem className="w-4 h-4" />
                  <span>{getCabinClassWithRBD(firstOutboundSegment)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:border-l lg:pl-4">
            {/* Fare Selection Dropdown */}
            <div className="mb-4">
              <Select value={selectedFareId} onValueChange={handleFareSelection}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedFare.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {updatedFareOptions.map((option) => (
                    <SelectItem 
                      key={option.id} 
                      value={option.id}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{option.name}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            BDT {option.price.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                          </div>
                          {option.gross && option.gross !== option.price && (
                            <div className="text-xs text-gray-400 line-through">
                              BDT {option.gross.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Flight Summary Info */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-[11px] text-gray-600">
                <Luggage className="w-3.5 h-3.5 text-green-600" />
                <span>Adult Baggage: {selectedFare.features.baggage}</span>
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
                <span>{selectedFare.features.seatsRemaining} seats remaining</span>
              </div>
            </div>

            {/* Fare Amount */}
            <div className="mb-2">
              <div className="flex items-center justify-end gap-2">
                <div className="flex flex-col items-end">
                  <div className="text-2xl font-bold text-right">
                    <span>
                      BDT {getCurrentPrice().totalPayable.total.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                    </span>
                    {getCurrentPrice().gross && getCurrentPrice().gross?.total !== getCurrentPrice().totalPayable.total && (
                      <div className="text-xs text-gray-400 line-through">
                        BDT {getCurrentPrice().gross?.total?.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
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
            <Button onClick={handleSelect} disabled={isLoading || isUnavailable} className="w-full bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black">
              {isLoading ? "Checking..." : isUnavailable ? "Unavailable" : "Select"}
            </Button>
          </div>
        </div>

        {/* Bottom Tabs */}
        <div className="mt-2 border-t pt-2">
          <Tabs value={activeTab || ""} className="w-full">
            <div className="overflow-x-auto -mx-4 px-4 md:overflow-visible md:px-0 md:mx-0">
              <TabsList className="w-full grid grid-cols-5 min-w-[500px] md:min-w-0">
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
                    {/* Outbound Section */}
                    <div className="mb-8 rounded-lg border bg-gray-50 dark:bg-gray-900/50 p-4">
                      <div className="font-bold text-gray-700 text-sm mb-2 uppercase tracking-wide">Outbound</div>
                      {outbound.map((segment, idx) => (
                        <div key={idx} className="mb-2">
                          <div className="flex flex-col md:flex-row md:items-center md:gap-4 bg-white dark:bg-gray-900/50 rounded-lg border p-3 md:p-4">
                            {/* Airline and meta info */}
                            <div className="flex items-center gap-2 mb-2 md:mb-0 md:w-56 min-w-0">
                              <img src={`https://images.kiwi.com/airlines/64x64/${segment.MarketingCarrier.carrierDesigCode}.png`} alt={segment.MarketingCarrier.carrierName} className="w-8 h-8 rounded-md bg-white border" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-xs truncate">{segment.MarketingCarrier.carrierName}</span>
                                <span className="text-xs text-gray-500 truncate">{segment.MarketingCarrier.carrierDesigCode} {segment.FlightNumber} | {segment.AircraftType}</span>
                                <span className="text-xs text-gray-500 truncate">{segment.CabinType} - Q</span>
                              </div>
                            </div>
                            {/* Departure info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-row items-center justify-between gap-2">
                                <div className="flex flex-col items-start min-w-0">
                                  <span className="text-lg font-bold">{formatDateTime(segment.Departure.ScheduledTime).time}</span>
                                  <span className="text-xs text-gray-500">{formatDateTime(segment.Departure.ScheduledTime).date}</span>
                                  <span className="text-xs text-gray-700 truncate">Terminal: {segment.Departure.Terminal || '-'}</span>
                                  <span className="text-xs text-gray-700 truncate">{segment.Departure.AirportName || ''}</span>
                                </div>
                                {/* FlightPathGraphic with duration */}
                                <div className="flex flex-col items-center justify-center mx-2">
                                  <FlightPathGraphic duration={formatDuration(Number(segment.Duration) || 0)} stops="" />
                                </div>
                                <div className="flex flex-col items-end min-w-0">
                                  <span className="text-lg font-bold">{formatDateTime(segment.Arrival.ScheduledTime).time}</span>
                                  <span className="text-xs text-gray-500">{formatDateTime(segment.Arrival.ScheduledTime).date}</span>
                                  <span className="text-xs text-gray-700 truncate">Terminal: {segment.Arrival.Terminal || '-'}</span>
                                  <span className="text-xs text-gray-700 truncate">{segment.Arrival.AirportName || ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Layover row */}
                          {idx < outbound.length - 1 && (
                            <div className="flex items-center gap-2 my-2 px-4 py-2 bg-orange-50 border-l-4 border-orange-400 rounded">
                              <span className="font-semibold text-orange-700">Change of planes</span>
                              <span className="text-xs text-orange-700 font-medium">{getLayoverDuration(outbound[idx], outbound[idx + 1])} Layover in {outbound[idx].Arrival.IATACode}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Inbound Section */}
                    <div className="rounded-lg border bg-gray-50 dark:bg-gray-900/50 p-4">
                      <div className="font-bold text-gray-700 text-sm mb-2 uppercase tracking-wide">Return</div>
                      {inbound.map((segment, idx) => (
                        <div key={idx} className="mb-2">
                          <div className="flex flex-col md:flex-row md:items-center md:gap-4 bg-white dark:bg-gray-900/50 rounded-lg border p-3 md:p-4">
                            {/* Airline and meta info */}
                            <div className="flex items-center gap-2 mb-2 md:mb-0 md:w-56 min-w-0">
                              <img src={`https://images.kiwi.com/airlines/64x64/${segment.MarketingCarrier.carrierDesigCode}.png`} alt={segment.MarketingCarrier.carrierName} className="w-8 h-8 rounded-md bg-white border" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-xs truncate">{segment.MarketingCarrier.carrierName}</span>
                                <span className="text-xs text-gray-500 truncate">{segment.MarketingCarrier.carrierDesigCode} {segment.FlightNumber} | {segment.AircraftType}</span>
                                <span className="text-xs text-gray-500 truncate">{segment.CabinType} - Q</span>
                              </div>
                            </div>
                            {/* Departure info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-row items-center justify-between gap-2">
                                <div className="flex flex-col items-start min-w-0">
                                  <span className="text-lg font-bold">{formatDateTime(segment.Departure.ScheduledTime).time}</span>
                                  <span className="text-xs text-gray-500">{formatDateTime(segment.Departure.ScheduledTime).date}</span>
                                  <span className="text-xs text-gray-700 truncate">Terminal: {segment.Departure.Terminal || '-'}</span>
                                  <span className="text-xs text-gray-700 truncate">{segment.Departure.AirportName || ''}</span>
                                </div>
                                {/* FlightPathGraphic with duration */}
                                <div className="flex flex-col items-center justify-center mx-2">
                                  <FlightPathGraphic duration={formatDuration(Number(segment.Duration) || 0)} stops="" />
                                </div>
                                <div className="flex flex-col items-end min-w-0">
                                  <span className="text-lg font-bold">{formatDateTime(segment.Arrival.ScheduledTime).time}</span>
                                  <span className="text-xs text-gray-500">{formatDateTime(segment.Arrival.ScheduledTime).date}</span>
                                  <span className="text-xs text-gray-700 truncate">Terminal: {segment.Arrival.Terminal || '-'}</span>
                                  <span className="text-xs text-gray-700 truncate">{segment.Arrival.AirportName || ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Layover row */}
                          {idx < inbound.length - 1 && (
                            <div className="flex items-center gap-2 my-2 px-4 py-2 bg-orange-50 border-l-4 border-orange-400 rounded">
                              <span className="font-semibold text-orange-700">Change of planes</span>
                              <span className="text-xs text-orange-700 font-medium">{getLayoverDuration(inbound[idx], inbound[idx + 1])} Layover in {inbound[idx].Arrival.IATACode}</span>
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
                            <tr key={`outbound-${index}`} className="border-b last:border-b-0">
                              <td className="py-3 px-4">{fareDetail.paxType}</td>
                              <td className="py-3 px-4">{fareDetail.baseFare}</td>
                              <td className="py-3 px-4">{fareDetail.tax}</td>
                              <td className="py-3 px-4">{fareDetail.otherFee || 0}</td>
                              <td className="py-3 px-4">{fareDetail.vat}</td>
                              <td className="py-3 px-4">{fareDetail.paxCount}</td>
                              <td className="py-3 px-4 font-medium">BDT {((fareDetail.baseFare + fareDetail.tax + (fareDetail.otherFee || 0) + fareDetail.vat) * (fareDetail.paxCount || 1)).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t">
                          <tr>
                            <td colSpan={7} className="py-3 px-4 font-medium text-right">Total Price:</td>
                            <td className="py-3 px-4 font-medium">
                              BDT {getCurrentFareDetailList().reduce((sum, { fareDetail }) => sum + ((fareDetail.baseFare + fareDetail.tax + (fareDetail.otherFee || 0) + fareDetail.vat) * (fareDetail.paxCount || 1)), 0).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Mobile View - List */}
                    <div className="md:hidden space-y-4">
                      {/* Outbound Fares */}
                      <div>
                        <h4 className="font-semibold mb-2">Outbound Flight</h4>
                        {getCurrentFareDetailList().map(({ fareDetail }, index) => (
                          <div key={`outbound-${index}`} className="border rounded-lg overflow-hidden mb-4">
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
                                <span>{fareDetail.otherFee || 0}</span>
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
                                <span className="font-medium">BDT {((fareDetail.baseFare + fareDetail.tax + (fareDetail.otherFee || 0) + fareDetail.vat) * (fareDetail.paxCount || 1)).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="text-right mt-4">
                          <div className="text-sm text-gray-600">Total Price</div>
                          <div className="text-lg font-bold">
                            BDT {getCurrentFareDetailList().reduce((sum, { fareDetail }) => sum + ((fareDetail.baseFare + fareDetail.tax + (fareDetail.otherFee || 0) + fareDetail.vat) * (fareDetail.paxCount || 1)), 0).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="baggage">
                  <div className="p-4">
                    {/* Outbound Baggage */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold mb-4">Outbound Flight Baggage</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <Briefcase className="w-5 h-5 text-gray-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium mb-1">Check-in Baggage</h4>
                            {flight.offer.baggageAllowanceList[0]?.baggageAllowance.checkIn.length > 0 ? (
                              <div className="space-y-1">
                                {flight.offer.baggageAllowanceList[0].baggageAllowance.checkIn.map((item: any, index: number) => (
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
                                {flight.offer.baggageAllowanceList[0].baggageAllowance.cabin.map((item: any, index: number) => (
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
                      </div>
                    </div>

                    {/* Inbound Baggage */}
                    <div>
                      <h3 className="text-sm font-semibold mb-4">Return Flight Baggage</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <Briefcase className="w-5 h-5 text-gray-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium mb-1">Check-in Baggage</h4>
                            {flight.offer.baggageAllowanceList[0]?.baggageAllowance.checkIn.length > 0 ? (
                              <div className="space-y-1">
                                {flight.offer.baggageAllowanceList[0].baggageAllowance.checkIn.map((item: any, index: number) => (
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
                                {flight.offer.baggageAllowanceList[0].baggageAllowance.cabin.map((item: any, index: number) => (
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
                  <div className="p-4 overflow-x-auto">
                    <div className="min-w-[900px]">
                      <RadioGroup
                        value={selectedFareId}
                        onValueChange={handleFareSelection}
                        className="grid grid-cols-3 gap-4"
                      >
                        {updatedFareOptions.map((option) => (
                          <div
                            key={option.id}
                            className={cn(
                              "relative flex flex-col p-4 cursor-pointer rounded-lg border transition-all h-full",
                              selectedFareId === option.id
                                ? "border-primary ring-1 ring-primary/10"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => handleFareSelection(option.id)}
                            tabIndex={0}
                            role="button"
                            onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') handleFareSelection(option.id); }}
                          >
                            <RadioGroupItem
                              value={option.id}
                              id={option.id}
                              className="absolute right-4 top-4 pointer-events-none"
                            />
                            <div className="flex flex-col h-full">
                              <div className="mb-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {option.features.refundable ? (
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <ShieldOff className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="font-medium">{option.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Package className="w-3.5 h-3.5" />
                                  <span>{option.features.baggage} Check-in</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{option.features.seatsRemaining} seats left</span>
                                </div>
                              </div>
                              <div className="mt-2 space-y-1 flex-grow">
                                {option.features.benefits.map((benefit: string, index: number) => (
                                  <div key={index} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                                    <span>{benefit}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 pt-3 border-t">
                                <div className="text-lg font-bold">
                                  BDT {(() => {
                                    const selectedUpSell = upSellBrandListWithMarkup?.find(({ upSellBrand }) => upSellBrand.offerId === option.id)?.upSellBrand;
                                    const fareDetails = selectedUpSell ? selectedUpSell.fareDetailList : fareDetailListWithMarkup;
                                    return fareDetails.reduce((sum, { fareDetail }) => sum + ((fareDetail.baseFare + fareDetail.tax + (fareDetail.otherFee || 0) + fareDetail.vat) * (fareDetail.paxCount || 1)), 0).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
                                  })()}
                                </div>
                                {(option.features.discount ?? 0) > 0 && (
                                  <div className="text-[10px] text-green-600 font-medium">
                                    Save BDT {(option.features.discount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
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

export function ReturnFlightCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-white dark:bg-black/95">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4">
          {/* Left Column: Outbound and Return Sections */}
          <div>
            {/* Outbound Section Skeleton */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
              {/* Outbound Flight Details Skeleton */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-6 items-start">
                    {/* Departure */}
                    <div>
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    {/* Duration */}
                    <div className="flex flex-col items-center pt-2">
                      <Skeleton className="h-3 w-10 mb-2" />
                      <Skeleton className="h-1 w-12 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    {/* Arrival */}
                    <div className="text-right">
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
                {/* Return Flight Details Skeleton */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-6 items-start">
                    {/* Departure */}
                    <div>
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    {/* Duration */}
                    <div className="flex flex-col items-center pt-2">
                      <Skeleton className="h-3 w-10 mb-2" />
                      <Skeleton className="h-1 w-12 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    {/* Arrival */}
                    <div className="text-right">
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Flight Info Row Skeleton */}
              <div className="flex items-center gap-4 mt-2">
                <Skeleton className="h-4 w-20" />
                <div className="h-4 w-px bg-gray-200" />
                <Skeleton className="h-4 w-24" />
              </div>
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
            <div className="mb-2 flex flex-col items-end">
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReturnFlightCard;