"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FlightSearchForm from '../FlightSearchForm';
import MulticityFlightSearchForm from '../MulticityFlightSearchForm';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ModifySearchProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDepartureDate?: string;
  initialReturnDate?: string;
  initialTripType?: 'OneWay' | 'Return' | 'Circle';
  initialAdults?: string;
  initialChildren?: string;
  initialInfants?: string;
  initialCabin?: string;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00'); 
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr; 
  }
};

export default function ModifyFlightSearch(props: ModifySearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const searchParams = useSearchParams();

  const tripType = searchParams.get('tripType') || props.initialTripType || 'Return';
  
  // Get all origins, destinations and dates
  const segments = [];
  for (let i = 1; i <= 6; i++) {
    const origin = searchParams.get(`origin${i}`);
    const destination = searchParams.get(`destination${i}`);
    const date = searchParams.get(`date${i}`);
    
    if (origin && destination) {
      segments.push({ origin, destination, date });
    }
  }

  const adults = searchParams.get('adults') || props.initialAdults || '1';
  const children = searchParams.get('children') || props.initialChildren || '0';
  const infants = searchParams.get('infants') || props.initialInfants || '0';
  const cabin = searchParams.get('cabin') || props.initialCabin || 'Economy';
  const fareType = searchParams.get('fareType') || 'regular';

  // Create initial form data object
  const initialFormData = {
    tripType: (tripType.toLowerCase() === 'return' ? 'roundtrip' : 
              tripType.toLowerCase() === 'circle' ? 'multicity' : 
              'oneway') as 'oneway' | 'roundtrip' | 'multicity',
    segments: segments.map(seg => ({
      from: {
        code: seg.origin,
        city: '', // These will be populated by AirportAutocomplete
        country: '',
        airportName: ''
      },
      to: {
        code: seg.destination,
        city: '',
        country: '',
        airportName: ''
      },
      date: seg.date ? new Date(seg.date) : undefined
    })),
    travellers: {
      adults: parseInt(adults),
      children: parseInt(children),
      infants: parseInt(infants),
      kids: 0, // Split children between kids and children based on your business logic
      travelClass: cabin as "Economy" | "Business" | "First Class"
    },
    fareType: fareType
  };

  const totalTravellers = parseInt(adults) + parseInt(children) + parseInt(infants);

  // Determine display name for the trip type
  let tripTypeDisplayName = tripType;
  if (tripType === 'Circle') {
    tripTypeDisplayName = 'Multi-city';
  } else if (tripType === 'OneWay') {
    tripTypeDisplayName = 'One Way';
  } else if (tripType === 'Return') {
    tripTypeDisplayName = 'Round Trip';
  }

  // Construct route and date display
  let routeDisplay = '';
  let dateDisplay = '';

  if (tripType === 'Circle' || tripType === 'Multicity') {
    // For multi-city, show all segments
    routeDisplay = segments.map(seg => seg.origin).join(' → ');
    if (segments.length > 0) {
      routeDisplay += ` → ${segments[segments.length - 1].destination}`;
    }
    
    // Show all dates
    dateDisplay = segments
      .map(seg => formatDate(seg.date))
      .filter(Boolean)
      .join(', ');
  } else {
    // For one-way and return flights
    const origin = searchParams.get('origin1') || props.initialOrigin;
    const destination = searchParams.get('destination1') || props.initialDestination;
    const departureDate = searchParams.get('date1') || props.initialDepartureDate;
    const returnDate = searchParams.get('date2') || props.initialReturnDate;

    routeDisplay = `${origin || 'Origin?'} → ${destination || 'Dest?'}`;
    
    if (departureDate) {
      dateDisplay = formatDate(departureDate);
      if (tripType === 'Return' && returnDate) {
        dateDisplay += ` - ${formatDate(returnDate)}`;
      }
    }
  }

  // Construct summary text
  const summaryText = (
    <span className="flex flex-wrap gap-2">
      <span className="font-semibold">{tripTypeDisplayName}</span>
      <span>|</span>
      <span>{routeDisplay}</span>
      <span>|</span>
      <span>Depart: {dateDisplay}</span>
      <span>|</span>
      <span>{totalTravellers} {totalTravellers === 1 ? 'Passenger' : 'Passengers'}</span>
      <span>|</span>
      <span>{cabin}</span>
    </span>
  );

  return (
    <div className="mb-6 shadow-lg rounded-md bg-card min-h-[64px] p-3">
      <div className="flex justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold opacity-90">Modify Search</h3>
            <button 
              className="p-2 rounded-md hover:bg-slate-700 flex-shrink-0"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Hide search form" : "Show search form"}
            >
              {isExpanded ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
            </button>
          </div>
          {!isExpanded && (
            <div className="text-xs opacity-90 overflow-x-auto">
              {summaryText}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
          {(tripType === 'Circle' || tripType === 'Multicity') ? (
            <MulticityFlightSearchForm
              initialData={{
                segments: segments.map(seg => ({
                  from: {
                    code: seg.origin,
                    city: '',
                    country: '',
                    airportName: ''
                  },
                  to: {
                    code: seg.destination,
                    city: '',
                    country: '',
                    airportName: ''
                  },
                  date: seg.date ? new Date(seg.date) : undefined
                })),
                travellerData: {
                  adults: parseInt(adults),
                  children: parseInt(children),
                  infants: parseInt(infants),
                  kids: 0,
                  travelClass: cabin as "Economy" | "Business" | "First Class"
                },
                fareType: fareType
              }}
              onSearch={() => setIsExpanded(false)}
            />
          ) : (
            <FlightSearchForm 
              showFareTypes={false}
              initialData={initialFormData}
              noShadow={true}
              onSearch={() => setIsExpanded(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
