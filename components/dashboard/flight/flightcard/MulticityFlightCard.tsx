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
import { useAuth } from "@/context/auth-context"
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { airports as allAirports, Airport } from "@/components/dashboard/flight/airport/airportUtils"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchOfferPrice } from '@/lib/api';
import { getMarkupByAirline } from '@/lib/markup';
import { calculateTotalWithMarkup } from '@/lib/calculateTotalWithMarkup';

// --- Type Definitions ---
interface LocationDateTimeInfo {
  iatA_LocationCode: string;
  terminalName: string;
  aircraftScheduledDateTime: string;
}

interface CarrierInfo {
  carrierDesigCode: string;
  marketingCarrierFlightNumber: string;
  carrierName: string;
}

interface FlightSegment {
  departure: LocationDateTimeInfo;
  arrival: LocationDateTimeInfo;
  marketingCarrierInfo: CarrierInfo;
  operatingCarrierInfo: CarrierInfo;
  iatA_AircraftType: {
    iatA_AircraftTypeCode: string;
  };
  rbd: string;
  flightNumber: string;
  segmentGroup: number;
  returnJourney: boolean;
  duration: string;
  cabinType: string;
  seatsLeft?: string; // Added for new FlightDetailsSection
  technicalStop?: { airport: string; duration: string }; // Added for new FlightDetailsSection
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

interface BaggageAllowance {
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
}

interface FlightOffer {
  offer: {
    offerId: string;
    validatingCarrier: string;
    refundable: boolean;
    fareType: string;
    paxSegmentList: {
      paxSegment: FlightSegment;
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
      baggageAllowance: BaggageAllowance;
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
          baggageAllowance: BaggageAllowance;
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

interface Trip {
  tripNumber: number;
  segments: FlightSegment[];
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

// Helper functions
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

const formatDuration = (duration: string) => {
  const minutes = parseInt(duration.split(' ')[0]);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const getConnectionInfo = (segments: FlightSegment[]): { text: string; className: string } => {
  if (!segments || segments.length <= 1) {
    return { 
      text: 'Direct', 
      className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
    };
  }

  const stops = segments.length - 1;
  const viaAirports = segments
    .slice(1, -1)
    .map(segment => segment.departure.iatA_LocationCode)
    .join(', ');

  return {
    text: `${stops} Stop${stops > 1 ? 's' : ''} via ${viaAirports}`,
    className: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
  };
};

const TripSection = ({ 
  trip, 
  index,
  formatDuration,
  getConnectionInfo,
  showAirlineLogo,
  showFlightNumber
}: { 
  trip: Trip; 
  index: number;
  formatDuration: (duration: string) => string;
  getConnectionInfo: (segments: FlightSegment[]) => { text: string; className: string };
  showAirlineLogo: boolean;
  showFlightNumber: boolean;
}) => {
  const firstSegment = trip.segments[0];
  const lastSegment = trip.segments[trip.segments.length - 1];
  const connectionInfo = getConnectionInfo(trip.segments);

  if (!firstSegment || !lastSegment) return null;

  const departure = formatDateTime(firstSegment.departure.aircraftScheduledDateTime);
  const arrival = formatDateTime(lastSegment.arrival.aircraftScheduledDateTime);

  return (
    <div className="mb-2 last:mb-0">
      <div className="text-xs font-medium mb-0.5 text-muted-foreground">Trip {index + 1}</div>
      <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800">
        {showAirlineLogo && (
          <div className="relative w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 bg-white border border-gray-100">
            {firstSegment.marketingCarrierInfo.carrierDesigCode ? (
              <img
                src={`https://images.kiwi.com/airlines/64x64/${firstSegment.marketingCarrierInfo.carrierDesigCode.toUpperCase()}.png`}
                alt={firstSegment.marketingCarrierInfo.carrierName}
                className="w-6 h-6 object-contain rounded-[4px]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '';
                  target.parentElement?.classList.add('bg-gray-100');
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>';
                  target.parentElement?.appendChild(icon);
                }}
                style={{ backgroundColor: 'transparent' }}
              />
            ) : (
              <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-[4px]">
                <SendHorizonal className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium">
              {showAirlineLogo && firstSegment.marketingCarrierInfo.carrierName}
              {showFlightNumber && (
                <span className="text-xs text-muted-foreground ml-1">
                  {firstSegment.marketingCarrierInfo.carrierDesigCode}-
                  {firstSegment.marketingCarrierInfo.marketingCarrierFlightNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Plane className="w-3.5 h-3.5" />
              <span>{firstSegment.iatA_AircraftType.iatA_AircraftTypeCode || '777'}</span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* Departure */}
            <div className="flex flex-col items-start">
              <div className="text-base font-bold">
                {firstSegment.departure.iatA_LocationCode}
              </div>
              <div className="text-xl font-extrabold leading-tight">
                {departure.time}
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-400 font-semibold my-0.5">
                {getCityNameByCode(firstSegment.departure.iatA_LocationCode)}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {departure.date}
              </div>
            </div>

            {/* Duration */}
            <div className="flex flex-col items-center -mt-2">
              <div className="text-[11px] font-medium mb-1">{formatDuration(firstSegment.duration || "0")}</div>
              <div className="w-16 h-px bg-primary/30 relative">
                <SendHorizonal className="w-3 h-3 absolute -top-1.5 right-0 text-primary" />
              </div>
              <div className={cn(
                "text-[11px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap mt-1",
                connectionInfo.className
              )}>
                {connectionInfo.text}
              </div>
            </div>

            {/* Arrival */}
            <div className="flex flex-col items-end">
              <div className="text-base font-bold">
                {lastSegment.arrival.iatA_LocationCode}
              </div>
              <div className="text-xl font-extrabold leading-tight">
                {arrival.time}
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-400 font-semibold my-0.5">
                {getCityNameByCode(lastSegment.arrival.iatA_LocationCode)}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {arrival.date}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add these type definitions
interface SectionProps {
  flight: FlightOffer;
  selectedFare: FareOption;
  trips?: Trip[];
}

const FlightDetailsSection = ({ flight, trips = [] }: SectionProps) => {
  // Helper to get stop info
  function getStopsText(segments: FlightSegment[]) {
    if (!segments || segments.length <= 1) return 'Non-Stop';
    const stops = segments.length - 1;
    return `${stops} Stop${stops > 1 ? 's' : ''}`;
  }
  // Helper to get route string
  function getRoute(segments: FlightSegment[]) {
    if (!segments || segments.length === 0) return '';
    return `${segments[0].departure.iatA_LocationCode} → ${segments[segments.length-1].arrival.iatA_LocationCode}`;
  }
  // Helper to get date string
  function getDate(segments: FlightSegment[]) {
    if (!segments || segments.length === 0) return '';
    const dt = segments[0].departure.aircraftScheduledDateTime;
    return formatDateTime(dt).date;
  }
  // Helper to get layover duration
  function getLayoverDuration(segA: FlightSegment, segB: FlightSegment) {
    const arr = new Date(segA.arrival.aircraftScheduledDateTime);
    const dep = new Date(segB.departure.aircraftScheduledDateTime);
    const mins = Math.floor((dep.getTime() - arr.getTime()) / (1000 * 60));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }
  // Helper to get seats left (if available)
  function getSeatsLeft(segment: FlightSegment) {
    // You may need to adjust this if seats left is elsewhere
    return segment.seatsLeft || null;
  }
  // Helper to get technical stop info (stub, adjust as needed)
  function getTechnicalStop(segment: FlightSegment) {
    // Example: segment.technicalStop = { airport: 'IST', duration: '1h 20m' }
    return segment.technicalStop || null;
  }
  return (
    <div className="p-4">
      {trips.map((trip, index) => (
        <div key={index} className="mb-8 rounded-lg border bg-gray-50 dark:bg-gray-900/50 p-4">
          {/* Trip Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 text-base font-semibold">
              <span>{getRoute(trip.segments)}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span>{getDate(trip.segments)}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-sm font-medium text-gray-600">{getStopsText(trip.segments)}</span>
            </div>
          </div>
          <div className="space-y-4">
            {trip.segments.map((segment, segmentIndex) => (
              <div key={segmentIndex}>
                {/* Segment Card */}
                <div className="flex flex-col md:flex-row md:items-center md:gap-4 bg-white dark:bg-gray-900/50 rounded-lg border p-3 md:p-4">
                  {/* Airline and meta info */}
                  <div className="flex items-center gap-2 mb-2 md:mb-0 md:w-56 min-w-0">
                    <img src={`https://images.kiwi.com/airlines/64x64/${segment.marketingCarrierInfo.carrierDesigCode}.png`} alt={segment.marketingCarrierInfo.carrierName} className="w-8 h-8 rounded-md bg-white border" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs truncate">{segment.marketingCarrierInfo.carrierName}</span>
                      <span className="text-xs text-gray-500 truncate">{segment.marketingCarrierInfo.carrierDesigCode} {segment.marketingCarrierInfo.marketingCarrierFlightNumber} | {segment.iatA_AircraftType.iatA_AircraftTypeCode}</span>
                      <span className="text-xs text-gray-500 truncate">{segment.cabinType} {segment.rbd} {getSeatsLeft(segment) ? <span className='text-red-500 font-semibold'>- {getSeatsLeft(segment)} Seats Left</span> : null}</span>
                    </div>
                  </div>
                  {/* Departure/Arrival info and FlightPathGraphic */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-row items-center justify-between gap-2">
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-lg font-bold">{formatDateTime(segment.departure.aircraftScheduledDateTime).time}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(segment.departure.aircraftScheduledDateTime).date}</span>
                        <span className="text-xs text-gray-700 truncate">Terminal: {segment.departure.terminalName || '-'}</span>
                        <span className="text-xs text-gray-700 truncate">{getCityNameByCode(segment.departure.iatA_LocationCode)}</span>
                      </div>
                      {/* FlightPathGraphic with duration */}
                      <div className="flex flex-col items-center justify-center mx-2">
                        {/* Replace with your FlightPathGraphic if available */}
                        <span className="text-xs text-gray-500 font-semibold">{formatDuration(segment.duration)}</span>
                        <div className="w-24 h-6 flex items-center justify-center">
                          <svg width="100%" height="100%" viewBox="0 0 96 24"><path d="M8 20 Q48 0 88 20" stroke="#bbb" strokeWidth="2" fill="none" strokeDasharray="4 4"/><circle cx="8" cy="20" r="2" fill="#bbb"/><circle cx="88" cy="20" r="2" fill="#bbb"/><polygon points="48,6 52,14 44,14" fill="#bbb"/></svg>
                        </div>
                      </div>
                      <div className="flex flex-col items-end min-w-0">
                        <span className="text-lg font-bold">{formatDateTime(segment.arrival.aircraftScheduledDateTime).time}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(segment.arrival.aircraftScheduledDateTime).date}</span>
                        <span className="text-xs text-gray-700 truncate">Terminal: {segment.arrival.terminalName || '-'}</span>
                        <span className="text-xs text-gray-700 truncate">{getCityNameByCode(segment.arrival.iatA_LocationCode)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Technical Stop Row */}
                {getTechnicalStop(segment) && (
                  <div className="flex items-center gap-2 my-2 px-4 py-2 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <span className="font-semibold text-blue-700">Technical Stop at {getTechnicalStop(segment)?.airport}</span>
                    <span className="text-xs text-blue-700 font-medium">{getTechnicalStop(segment)?.duration}</span>
                  </div>
                )}
                {/* Layover row */}
                {segmentIndex < trip.segments.length - 1 && (
                  <div className="flex items-center gap-2 my-2 px-4 py-2 bg-orange-50 border-l-4 border-orange-400 rounded">
                    <span className="font-semibold text-orange-700">Change of planes</span>
                    <span className="text-xs text-orange-700 font-medium">{getLayoverDuration(segment, trip.segments[segmentIndex + 1])} Layover in {segment.arrival.iatA_LocationCode}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const FareSummarySection = ({ fareDetailListWithMarkup, flight, selectedFare }: SectionProps & { fareDetailListWithMarkup: any[] }) => {
  // Get the current fare details based on selected fare
  const getCurrentFareDetails = () => {
    if (selectedFare.id === flight.offer.offerId) {
      // Base fare - use the original fare details
      return fareDetailListWithMarkup;
    } else {
      // Upsell fare - find the selected upsell brand and use its fare details
      const selectedUpSell = flight.offer.upSellBrandList?.find(
        ({ upSellBrand }) => upSellBrand.offerId === selectedFare.id
      );
      return selectedUpSell?.upSellBrand.fareDetailList || fareDetailListWithMarkup;
    }
  };

  const currentFareDetails = getCurrentFareDetails();

  return (
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
            {currentFareDetails.map(({ fareDetail }, index: number) => {
              // Calculate amount directly from API response fields, without commission/markup/discount
              const rowAmount = ((fareDetail.baseFare || 0) + (fareDetail.tax || 0) + (fareDetail.otherFee || 0) + (fareDetail.vat || 0)) * (fareDetail.paxCount || 1);
              return (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="py-3 px-4">{fareDetail.paxType}</td>
                  <td className="py-3 px-4">{fareDetail.baseFare}</td>
                  <td className="py-3 px-4">{fareDetail.tax}</td>
                  <td className="py-3 px-4">{fareDetail.otherFee || 0}</td>
                  <td className="py-3 px-4">{fareDetail.vat}</td>
                  <td className="py-3 px-4">{fareDetail.paxCount}</td>
                  <td className="py-3 px-4 font-medium">BDT {rowAmount.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={6} className="py-3 px-4 text-right font-medium">Total Price:</td>
              <td className="py-3 px-4 font-medium">
                BDT {currentFareDetails.reduce((sum, { fareDetail }) => sum + (((fareDetail.baseFare || 0) + (fareDetail.tax || 0) + (fareDetail.otherFee || 0) + (fareDetail.vat || 0)) * (fareDetail.paxCount || 1)), 0).toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile View - List */}
      <div className="md:hidden space-y-4">
        {currentFareDetails.map(({ fareDetail }, index: number) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 text-sm">
              <div className="border-b border-r p-3 bg-gray-50">
                <span className="text-gray-600">Trip</span>
              </div>
              <div className="border-b p-3">
                <span>Trip {index + 1}</span>
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
                <span className="text-gray-600">VAT</span>
              </div>
              <div className="border-b p-3">
                <span>{fareDetail.vat}</span>
              </div>

              <div className="border-r p-3 bg-gray-50">
                <span className="text-gray-600">Amount</span>
              </div>
              <div className="p-3">
                <span className="font-medium">BDT {fareDetail.subTotal}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BaggageSection = ({ fareDetailListWithMarkup, trips = [], flight, selectedFare }: SectionProps & { fareDetailListWithMarkup: any[] }) => {
  return (
    <div className="p-4">
      {trips.map((trip, index) => (
        <div key={trip.tripNumber} className="mb-6 last:mb-0">
          <h3 className="text-sm font-semibold mb-4">Trip {index + 1} Baggage</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Briefcase className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium mb-1">Check-in Baggage</h4>
                {fareDetailListWithMarkup[index]?.fareDetail.checkIn ? (
                  <div className="space-y-1">
                    {fareDetailListWithMarkup[index].fareDetail.checkIn.map((item: any, i: number) => (
                      <div key={i} className="text-sm text-gray-600">
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

            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Package className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium mb-1">Cabin Baggage</h4>
                {fareDetailListWithMarkup[index]?.fareDetail.cabin ? (
                  <div className="space-y-1">
                    {fareDetailListWithMarkup[index].fareDetail.cabin.map((item: any, i: number) => (
                      <div key={i} className="text-sm text-gray-600">
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
      ))}
    </div>
  );
};

const NoticeSection = () => {
  return (
    <div className="p-4">
      <div className="space-y-4">
        {/* Reporting Time */}
        <div className="rounded-lg p-3 border bg-orange-50 dark:bg-orange-900/10">
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
        <div className="rounded-lg p-3 border bg-blue-50 dark:bg-blue-900/10">
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
        <div className="rounded-lg p-3 border bg-red-50 dark:bg-red-900/10">
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
        <div className="rounded-lg p-3 border bg-gray-50 dark:bg-gray-900/10">
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
  );
};

// Dynamic city name lookup from airport code
function getCityNameByCode(code: string): string {
  if (!code) return 'Unknown City';
  const airport = allAirports.find((a: Airport) => a.code.toUpperCase() === code.toUpperCase());
  return airport?.city || 'Unknown City';
}

// Add helper to format layover minutes as 'Xh Ym'
function formatLayover(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// Helper to calculate total trip duration in minutes between two ISO datetime strings
function getTotalTripDurationMins(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60)));
}

interface MulticityFlightCardProps {
  flight: FlightOffer;
  traceId: string;
  amountType?: 'official' | 'offer' | '';
}

const MulticityFlightCard: React.FC<MulticityFlightCardProps> = ({ flight, traceId, amountType }) => {
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

  // Organize segments into trips
  const trips = useMemo(() => {
    const segments = flight.offer.paxSegmentList.map(ps => ps.paxSegment);
    const groupedSegments = segments.reduce((acc: { [key: number]: FlightSegment[] }, segment) => {
      const group = segment.segmentGroup || 0;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(segment);
      return acc;
    }, {});

    return Object.entries(groupedSegments).map(([group, segments]) => ({
      tripNumber: parseInt(group),
      segments: segments
    }));
  }, [flight.offer.paxSegmentList]);

  // Create fare options from upSellBrandList
  const fareOptions = useMemo(() => {
    // Ensure upSellBrandList exists and has items
    const upSellBrands = flight.offer.upSellBrandList || [];
    
    // If no upsell brands, create a base fare option
    if (upSellBrands.length === 0) {
      return [{
        id: flight.offer.offerId,
        name: "Basic",
        price: flight.offer.price.totalPayable.total, // Use original price, markup will be applied later
        gross: flight.offer.price.gross?.total,
        features: {
          refundable: flight.offer.refundable,
          baggage: flight.offer.baggageAllowanceList[0]?.baggageAllowance.checkIn?.[0]?.allowance || "20KG",
          seatsRemaining: parseInt(flight.offer.seatsRemaining || '0', 10),
          discount: 0,
          benefits: [
            `${flight.offer.baggageAllowanceList[0]?.baggageAllowance.checkIn?.[0]?.allowance || "20KG"} Check-in baggage`,
            `${flight.offer.baggageAllowanceList[0]?.baggageAllowance.cabin?.[0]?.allowance || "7KG"} Cabin baggage`,
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
      price: upSellBrand.price.totalPayable.total, // Use original price, markup will be applied later
      gross: (upSellBrand.price as any).gross?.total,
      features: {
        refundable: upSellBrand.refundable,
        baggage: upSellBrand.baggageAllowanceList[0]?.baggageAllowance.checkIn?.[0]?.allowance || "20KG",
        seatsRemaining: parseInt(flight.offer.seatsRemaining || '0', 10),
        discount: upSellBrand.price.totalPayable.total - flight.offer.price.totalPayable.total,
        benefits: [
          `${upSellBrand.baggageAllowanceList[0]?.baggageAllowance.checkIn?.[0]?.allowance || "20KG"} Check-in baggage`,
          `${upSellBrand.baggageAllowanceList[0]?.baggageAllowance.cabin?.[0]?.allowance || "7KG"} Cabin baggage`,
          upSellBrand.meal ? "Meal included" : "No meal included",
          upSellBrand.refundable ? "Refundable" : "Non-refundable",
          upSellBrand.exchangeAllowed ? "Exchange allowed" : "No exchange",
          upSellBrand.brandName.includes('PREMIUM') || upSellBrand.brandName.includes('BUSINESS') ? "Priority check-in" : "",
          upSellBrand.brandName.includes('BUSINESS') ? "Lounge access" : "",
        ].filter(Boolean)
      }
    }));
  }, [flight.offer]);

  // Get selected fare details (will be updated with markup-adjusted prices later)

  // Get current fare details based on selected fare
  const getCurrentFareDetailList = () => {
    if (selectedFareId === flight.offer.offerId) {
      return fareDetailListWithMarkup;
    }
    const selectedUpSell = upSellBrandListWithMarkup?.find(
      ({ upSellBrand }) => upSellBrand.offerId === selectedFareId
    );
    return selectedUpSell?.upSellBrand.fareDetailList || fareDetailListWithMarkup;
  };

  // Handle booking
  const handleSelect = async () => {
    if (isUnavailable) return;
    
    // Check if user is logged in
    if (!user) {
      // Store the intended destination URL
      const adults = searchParams.get('adults') || '1';
      const children = searchParams.get('children') || '0';
      const infants = searchParams.get('infants') || '0';

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

  // Get airline logo URL
  const getAirlineLogo = (carrierCode: string) => {
    return `https://images.kiwi.com/airlines/64x64/${carrierCode.toUpperCase()}.png`;
  };

  // Handle image error
  const handleImageError = (carrierCode: string) => {
    setImgError(true);
  };

  // Determine if all trips have the same airline
  const allSameAirline = trips.length > 0 && trips.every(
    trip => trip.segments[0].marketingCarrierInfo.carrierDesigCode === trips[0].segments[0].marketingCarrierInfo.carrierDesigCode &&
            trip.segments[0].marketingCarrierInfo.carrierName === trips[0].segments[0].marketingCarrierInfo.carrierName
  );
  const mainAirline = trips[0]?.segments[0]?.marketingCarrierInfo;

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

  function getCurrentPrice() {
    if (selectedFareId === flight.offer.offerId) {
      return flight.offer.price;
    }
    const selectedUpSell = upSellBrandListWithMarkup?.find(
      ({ upSellBrand }) => upSellBrand.offerId === selectedFareId
    );
    return selectedUpSell?.upSellBrand.price || flight.offer.price;
  }

  // Calculate markup-adjusted prices
  const currentPrice = getCurrentPrice();
  const payable = currentPrice.totalPayable.total || 0;
  const vat = 0; // Default VAT value for multicity flights
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

  return (
    <Card className="overflow-hidden bg-background/95">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4">
          {/* Left Column */}
          <div>
            {/* Show airline logo and name only once if all trips have the same airline */}
            {allSameAirline && mainAirline && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                    {imgError ? (
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
                        <SendHorizonal className="w-5 h-5 text-gray-400" />
                      </div>
                    ) : (
                      <img
                        src={getAirlineLogo(mainAirline.carrierDesigCode)}
                        alt={mainAirline.carrierName}
                        className="w-8 h-8 object-contain"
                        onError={() => handleImageError(mainAirline.carrierDesigCode)}
                        style={{ backgroundColor: 'transparent' }}
                      />
                    )}
                  </div>
                  <div>
                    <div className="text-base font-semibold">{mainAirline.carrierName}</div>
                    <div className="text-xs text-muted-foreground">
                      {trips.map((trip, idx) => (
                        <span key={idx}>
                          {trip.segments.map((segment, sidx) => (
                            <span key={sidx}>
                              {segment.marketingCarrierInfo.carrierDesigCode}-{segment.flightNumber}
                              {sidx < trip.segments.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                          {idx < trips.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
                  <Plane className="w-4 h-4" />
                  <span>{trips[0].segments[0].iatA_AircraftType.iatA_AircraftTypeCode || '777W'}</span>
                </div>
              </div>
            )}
            {trips.map((trip, index) => {
  // Calculate total layover mins for this trip
  const layoverMins = trip.segments.length > 1 ? trip.segments.slice(0, -1).reduce((sum, seg, idx) => {
    const arr = new Date(seg.arrival.aircraftScheduledDateTime);
    const dep = new Date(trip.segments[idx + 1].departure.aircraftScheduledDateTime);
    return sum + Math.max(0, Math.floor((dep.getTime() - arr.getTime()) / (1000 * 60)));
  }, 0) : 0;
  // Calculate total trip duration for this trip
  const tripDurationMins = getTotalTripDurationMins(
    trip.segments[0].departure.aircraftScheduledDateTime,
    trip.segments[trip.segments.length - 1].arrival.aircraftScheduledDateTime
  );
  function formatDurationFromMins(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }
  return (
    <div key={index} className="mb-3 last:mb-0">
      {/* Only show airline info per trip if not all same airline */}
      {!allSameAirline && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              {imgError ? (
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
                  <SendHorizonal className="w-5 h-5 text-gray-400" />
                </div>
              ) : (
                <img
                  src={getAirlineLogo(trip.segments[0].marketingCarrierInfo.carrierDesigCode)}
                  alt={trip.segments[0].marketingCarrierInfo.carrierName}
                  className="w-8 h-8 object-contain"
                  onError={() => handleImageError(trip.segments[0].marketingCarrierInfo.carrierDesigCode)}
                  style={{ backgroundColor: 'transparent' }}
                />
              )}
            </div>
            <div>
              <div className="text-base font-semibold">{trip.segments[0].marketingCarrierInfo.carrierName}</div>
              <div className="text-xs text-muted-foreground">
                {trip.segments.map((segment, idx) => (
                  <span key={idx}>
                    {segment.marketingCarrierInfo.carrierDesigCode}-{segment.flightNumber}
                    {idx < trip.segments.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium">
            <Plane className="w-4 h-4" />
            <span>{trip.segments[0].iatA_AircraftType.iatA_AircraftTypeCode || '777W'}</span>
          </div>
        </div>
      )}

      {/* Flight Details */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-1.5">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
          {/* Departure */}
          <div className="flex flex-col items-start">
            <div className="text-base font-bold">
              {trip.segments[0].departure.iatA_LocationCode}
            </div>
            <div className="text-xl font-extrabold leading-tight">
              {formatDateTime(trip.segments[0].departure.aircraftScheduledDateTime).time}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-400 font-semibold my-0.5">
              {getCityNameByCode(trip.segments[0].departure.iatA_LocationCode)}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {formatDateTime(trip.segments[0].departure.aircraftScheduledDateTime).date}
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs font-medium mb-0.5">
              {formatDurationFromMins(tripDurationMins)}
            </div>
            <div className="w-20 h-px bg-primary/30 relative my-0.5">
              <SendHorizonal className="w-3 h-3 absolute -top-1.5 right-0 text-primary" />
            </div>
            <div className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5",
              getConnectionInfo(trip.segments).className
            )}>
              {getConnectionInfo(trip.segments).text}
            </div>
            {layoverMins > 0 && (
              <div className="text-xs text-gray-500 mt-1">Layover: {formatLayover(layoverMins)}</div>
            )}
          </div>

          {/* Arrival */}
          <div className="flex flex-col items-end">
            <div className="text-base font-bold">
              {trip.segments[trip.segments.length - 1].arrival.iatA_LocationCode}
            </div>
            <div className="text-xl font-extrabold leading-tight">
              {formatDateTime(trip.segments[trip.segments.length - 1].arrival.aircraftScheduledDateTime).time}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-400 font-semibold my-0.5">
              {getCityNameByCode(trip.segments[trip.segments.length - 1].arrival.iatA_LocationCode)}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {formatDateTime(trip.segments[trip.segments.length - 1].arrival.aircraftScheduledDateTime).date}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})}

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
                <span>{(trips[0].segments[0].cabinType || 'Economy') + ' ' + (trips[0].segments[0].rbd || 'E')}</span>
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
                    {amountType === 'official' ? (
                      // Show gross amount (original price without markup)
                      <span>
                        BDT {payable.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                      </span>
                    ) : (
                      // Show markup amount (price with markup applied)
                      <span>
                        BDT {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                      </span>
                    )}
                    {/* Show strikethrough only for offer fare when gross is different */}
                    {amountType !== 'official' && 'gross' in currentPrice && typeof currentPrice.gross === 'object' && currentPrice.gross !== null && (currentPrice.gross as any).total !== totalAmount && (
                      <div className="text-xs text-gray-400 line-through">
                        BDT {(currentPrice.gross as any).total.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
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
                  className="text-[11px] font-semibold whitespace-nowrap"
                  onClick={() => handleTabClick('flight')}
                >
                  <SendHorizonal className="w-3.5 h-3.5 mr-1" />
                  Flight Details
                </TabsTrigger>
                <TabsTrigger
                  value="fare"
                  className="text-[11px] font-semibold whitespace-nowrap"
                  onClick={() => handleTabClick('fare')}
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1" />
                  Fare Summary
                </TabsTrigger>
                <TabsTrigger
                  value="baggage"
                  className="text-[11px] font-semibold whitespace-nowrap"
                  onClick={() => handleTabClick('baggage')}
                >
                  <Briefcase className="w-3.5 h-3.5 mr-1" />
                  Baggage
                </TabsTrigger>
                <TabsTrigger
                  value="notice"
                  className="text-[11px] font-semibold whitespace-nowrap"
                  onClick={() => handleTabClick('notice')}
                >
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Notice
                </TabsTrigger>
                <TabsTrigger
                  value="select"
                  className="text-[11px] font-semibold whitespace-nowrap"
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
                  <FlightDetailsSection flight={flight} trips={trips} selectedFare={selectedFare} />
                </TabsContent>

                <TabsContent value="fare">
                  <FareSummarySection fareDetailListWithMarkup={getCurrentFareDetailList()} flight={flight} selectedFare={selectedFare} />
                </TabsContent>

                <TabsContent value="baggage">
                  <BaggageSection fareDetailListWithMarkup={fareDetailListWithMarkup} trips={trips} flight={flight} selectedFare={selectedFare} />
                </TabsContent>

                <TabsContent value="notice">
                  <NoticeSection />
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
                                {option.features.benefits.map((benefit, index) => (
                                  <div key={index} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                                    <span>{benefit}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 pt-3 border-t">
                                <div className="text-lg font-bold">
                                  BDT {option.price.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                                </div>
                                {(option.features.discount ?? 0) > 0 && (
                                  <div className="text-[10px] text-green-600 font-medium">
                                    Save BDT {(option.features.discount ?? 0).toLocaleString()}
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

export function MulticityFlightCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-white dark:bg-black/95">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-4">
          {/* Left Column: Multiple Trip Sections */}
          <div>
            {[0, 1, 2].map((tripIdx) => (
              <div key={tripIdx} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 mb-2">
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                    {/* Departure */}
                    <div>
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    {/* Duration/Stop Info */}
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
            ))}
            {/* Flight Info Row Skeleton */}
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

export default MulticityFlightCard; 