import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useRouter } from 'next/navigation'; 
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronDown, PlusCircle, X, ArrowRightLeft } from "lucide-react";
import AirportAutocomplete from './airport/AirportAutocomplete';
import type { Airport } from './airport/airportUtils';
import { FlightDatePicker } from "./calendar/FlightDatePicker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  TravellerSelector,
  type TravellerData,
} from "./travellers/TravellerSelector";
import { addDays, startOfDay, isBefore, format as formatDateFn } from "date-fns"; 
import { cn } from "@/lib/utils";
import { getLastSearch, saveLastSearch, saveRecentSearch } from "@/lib/search-history";

const defaultTravellerData: TravellerData = {
  adults: 1,
  kids: 0,
  children: 0,
  infants: 0,
  travelClass: "Economy"
};

const defaultFrom: Airport = {
  city: 'Dhaka',
  country: 'Bangladesh',
  airportName: 'Hazrat Shahjalal International Airport',
  code: 'DAC',
};
const defaultTo: Airport = {
  city: 'Chittagong',
  country: 'Bangladesh',
  airportName: 'Shah Amanat International',
  code: 'CGP',
};

const today = startOfDay(new Date());
const MAX_TOTAL_FLIGHT_LEGS = 6; // Max total flight legs including the first one

export interface FlightSegment {
  id: string; // Unique ID for React key and updates
  fromAirport: Airport | null;
  toAirport: Airport | null;
  departureDate: Date | undefined;
}

const lastSearch = getLastSearch('multicity');

export interface MulticityFlightSearchFormProps {
  initialData?: {
    segments: {
      from: import('./airport/airportUtils').Airport;
      to: import('./airport/airportUtils').Airport;
      date: Date | undefined;
    }[];
    travellerData: import('./travellers/TravellerSelector').TravellerData;
    fareType: string;
  };
  onSearch?: () => void;
}

function formatLocalDate(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MulticityFlightSearchForm = forwardRef(function MulticityFlightSearchForm(props: MulticityFlightSearchFormProps, ref) {
  const router = useRouter(); 
  const initialSegments = props.initialData?.segments || (lastSearch?.segments || []);
  const initialTravellerData = props.initialData?.travellerData || lastSearch?.travellerData || defaultTravellerData;
  const initialFareType = props.initialData?.fareType || lastSearch?.fareType || "regular";

  // State for the first leg
  const [fromAirport, setFromAirport] = useState<Airport | null>(
    initialSegments[0]?.fromAirport || initialSegments[0]?.from || defaultFrom
  );
  const [toAirport, setToAirport] = useState<Airport | null>(
    initialSegments[0]?.toAirport || initialSegments[0]?.to || defaultTo
  );
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    initialSegments[0]?.departureDate || initialSegments[0]?.date || addDays(today, 1)
  );
  
  const [segments, setSegments] = useState<FlightSegment[]>(
    initialSegments.slice(1).map((s: any, i: number) => ({
      ...s,
      fromAirport: s.fromAirport || s.from,
      toAirport: s.toAirport || s.to,
      departureDate: s.departureDate || s.date,
      id: s.id || `segment-${Date.now()}-${i}`
    }))
  ); 
  const [travellerData, setTravellerData] = useState<TravellerData>(
    initialTravellerData
  );
  const [isTravellerPopoverOpen, setIsTravellerPopoverOpen] = useState(false);
  const [fareType, setFareType] = useState(initialFareType);

  const handleFirstLegSwap = () => {
    setFromAirport(toAirport);
    setToAirport(fromAirport);
  };

  const handleFirstSegmentChange = (field: 'fromAirport' | 'toAirport' | 'departureDate', value: any) => {
    if (field === 'fromAirport') setFromAirport(value as Airport | null);
    if (field === 'toAirport') {
      setToAirport(value as Airport | null);
      // Update the 'fromAirport' of the first *additional* segment if it exists
      if (segments.length > 0) {
        setSegments(s => [{ ...s[0], fromAirport: value as Airport | null }, ...s.slice(1)]);
      }
    }
    if (field === 'departureDate') {
      setDepartureDate(value as Date | undefined);
      // Adjust first additional segment's departure date if it becomes invalid
      if (segments.length > 0 && segments[0].departureDate && value && isBefore(segments[0].departureDate, addDays(value,1))) {
        setSegments(s => [{ ...s[0], departureDate: addDays(value,1) }, ...s.slice(1)]);
      }
    }
  };

  const addAdditionalSegment = () => {
    if (1 + segments.length >= MAX_TOTAL_FLIGHT_LEGS) return;
    setSegments(currentSegments => {
      const previousLegToAirport = currentSegments.length > 0 
        ? currentSegments[currentSegments.length - 1].toAirport 
        : toAirport;
      const previousLegDepartureDate = currentSegments.length > 0
        ? currentSegments[currentSegments.length - 1].departureDate
        : departureDate;
      const newAdditionalSegment: FlightSegment = {
        id: `segment-${Date.now()}-${currentSegments.length}`,
        fromAirport: previousLegToAirport, 
        toAirport: null,
        departureDate: previousLegDepartureDate ? addDays(previousLegDepartureDate, 1) : undefined,
      };
      return [...currentSegments, newAdditionalSegment];
    });
  };

  const removeAdditionalSegment = (idToRemove: string) => {
    setSegments(currentSegments => {
      return currentSegments.filter((segment, i) => segment.id !== idToRemove);
    });
  };

  const handleAdditionalSegmentChange = (segmentIndexInArray: number, updatedPartialSegment: Partial<FlightSegment>) => {
    setSegments(currentSegments => 
      currentSegments.map((segment, i) => {
        if (i === segmentIndexInArray) {
          const newSegment = { ...segment, ...updatedPartialSegment };
          // If 'toAirport' of this segment changed, update 'fromAirport' of the *next* additional segment
          if (updatedPartialSegment.toAirport !== undefined && i + 1 < currentSegments.length) {
            currentSegments[i + 1] = { ...currentSegments[i + 1], fromAirport: newSegment.toAirport };
          }
          // If 'departureDate' of this segment changed, ensure next segment's date is valid
          if (updatedPartialSegment.departureDate && i + 1 < currentSegments.length && currentSegments[i+1].departureDate && isBefore(currentSegments[i+1].departureDate!, addDays(newSegment.departureDate!, 1))){
            currentSegments[i+1] = { ...currentSegments[i+1], departureDate: addDays(newSegment.departureDate!, 1) };
          }
          return newSegment;
        }
        return segment;
      })
    );
  };

  const handleAdditionalSegmentSwap = (segmentIndexInArray: number) => {
    setSegments(currentSegments =>
      currentSegments.map((segment, i) => {
        if (i === segmentIndexInArray) {
          return { ...segment, fromAirport: segment.toAirport, toAirport: segment.fromAirport };
        }
        return segment;
      })
    );
  };

  const totalTravellers = travellerData.adults + travellerData.kids + travellerData.children + travellerData.infants;

  const handleMulticitySearch = () => {
    const allSegments = [
      { fromAirport, toAirport, departureDate, id: 'first-leg' }, // Treat first leg as a segment for validation and iteration
      ...segments
    ];

    // Validation
    for (let i = 0; i < allSegments.length; i++) {
      const seg = allSegments[i];
      if (!seg.fromAirport || !seg.toAirport || !seg.departureDate) {
        alert(`Please complete all fields for flight leg ${i + 1}.`);
        return;
      }
    }

    if (allSegments.length < 1) { // Should be at least 1 leg (the first one)
        alert("Please add at least one flight leg.");
        return;
    }

    saveLastSearch('multicity', {
      tripType: 'multicity',
      segments: allSegments,
      travellerData,
      fareType,
    });

    // Save to recent searches for card display (use all segments)
    saveRecentSearch({
      segments: allSegments.map(seg => ({
        from: { city: seg.fromAirport?.city, code: seg.fromAirport?.code },
        to: { city: seg.toAirport?.city, code: seg.toAirport?.code },
        date: formatLocalDate(seg.departureDate),
      })),
      type: "Multicity",
      travelers: totalTravellers,
      travellers: travellerData,
      fareType,
    });

    const params = new URLSearchParams();
    params.append('tripType', 'Circle'); // API uses 'Circle' for Multicity

    allSegments.forEach((seg, index) => {
      if (seg.fromAirport && seg.toAirport && seg.departureDate) { // Redundant check due to validation above, but good for safety
        params.append(`origin${index + 1}`, seg.fromAirport.code);
        params.append(`destination${index + 1}`, seg.toAirport.code);
        params.append(`date${index + 1}`, formatDateFn(seg.departureDate, 'yyyy-MM-dd'));
      }
    });

    params.append('adults', travellerData.adults.toString());
    const totalChildren = (travellerData.kids || 0) + (travellerData.children || 0);
    params.append('children', totalChildren.toString());
    params.append('infants', (travellerData.infants || 0).toString());
    params.append('cabin', travellerData.travelClass);
    // params.append('fareType', fareType); // If API needs fareType

    router.push(`/results?${params.toString()}`);
    if (props.onSearch) props.onSearch();
  };

  // Effect to initialize the first segment's 'from' based on the main 'toAirport'
  useEffect(() => {
    if (segments.length > 0) {
      setSegments(s => [{ ...s[0], fromAirport: toAirport }, ...s.slice(1)]);
    }
  }, [toAirport]);

  useImperativeHandle(ref, () => ({
    triggerSearch: handleMulticitySearch
  }));

  return (
    <>
      {/* Parent Box for Trip 1 */}
      <div className="p-1 border border-input rounded-lg bg-muted relative mb-5">
        {/* Title for Trip 1 */}
        <div className="absolute -top-4 -left-0 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-lg shadow-md">
          Trip 1
        </div>

        {/* First Leg Inputs - Updated Layout */}
        <div className="flex flex-col md:flex-row gap-2 items-stretch min-h-[120px] md:h-[200px]">
          {/* Item 1: From/To Airport Pickers for First Leg */}
          <div className="flex-grow-[2] flex flex-col justify-center md:min-w-[300px]">
            <div className="bg-muted border border-border rounded-lg p-2 md:p-4 flex flex-col justify-center min-h-[80px] w-full">
              {/* FROM FIELD */}
              <AirportAutocomplete
                value={fromAirport}
                onChange={(airport) => {
                  handleFirstSegmentChange('fromAirport', airport);
                }}
                label="From"
                placeholder="Enter airport name, city or code"
              />
              <div className="relative flex justify-center my-px">
                <Button 
                  variant="outline"
                  size="icon"
                  className="rounded-full w-7 h-7 border-border dark:border-white/20 bg-background text-foreground shadow-sm p-1 z-10"
                  onClick={handleFirstLegSwap}
                >
                  <ArrowRightLeft size={12} style={{ transform: 'rotate(90deg)' }} />
                </Button>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2"></div>
              </div>
              {/* TO FIELD */}
              <AirportAutocomplete
                value={toAirport}
                onChange={(airport) => {
                  handleFirstSegmentChange('toAirport', airport);
                }}
                label="To"
                placeholder="Enter airport name, city or code"
              />
            </div>
          </div>

          {/* Item 2: Date Picker for First Leg */}
          <FlightDatePicker
            label="Departure"
            selectedDate={departureDate} 
            onDateChange={(date) => handleFirstSegmentChange('departureDate', date)}
            minDate={addDays(today,1)}
            placeholder="Select date"
            className="flex-grow-[1] min-h-[80px] md:min-w-[180px] border border-input rounded-lg p-2 flex flex-col justify-center bg-muted/20"
          />
          
          {/* Item 3: Traveller & Class Selector */}
          <div className={cn(
            "flex-grow-[1] rounded-lg min-h-[80px] md:min-w-[180px]", 
            // Removed border-border as PopoverTrigger Button has its own styling
          )}>
            <Popover open={isTravellerPopoverOpen} onOpenChange={setIsTravellerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-full bg-muted border-border hover:bg-muted/80 flex flex-col items-start justify-center p-2 md:p-4 min-h-[80px]"
                >
                  <span className="block text-sm font-medium text-foreground mb-1">
                    {totalTravellers} Traveler{totalTravellers !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center text-base font-semibold text-foreground w-full"> 
                    <span className="mr-2 truncate">{travellerData.travelClass}</span>
                    <ChevronDown size={16} className="ml-auto text-muted-foreground shrink-0" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                className="w-[350px] p-4 rounded-lg shadow-lg bg-background border border-border"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  position: 'fixed',
                  zIndex: 50,
                }}
              >
                <TravellerSelector
                  initialData={travellerData}
                  onDone={(data) => {
                    setTravellerData(data);
                    setIsTravellerPopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Item 4: Add Segment Button */}
          <div className="flex-grow-[1] rounded-lg h-full md:min-w-[180px] h-full">
            <div className="bg-muted border border-border rounded-lg p-2 md:p-4 h-full w-full flex flex-col justify-center h-full">
              <Button 
                className="w-full h-full bg-black text-white dark:bg-white dark:text-black border-none hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg"
                onClick={addAdditionalSegment}
                disabled={1 + segments.length >= MAX_TOTAL_FLIGHT_LEGS}
              >
                <PlusCircle size={18} className="mr-2" />
                Add Segment ({1 + segments.length}/{MAX_TOTAL_FLIGHT_LEGS})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Multicity segments UI (Leg 2 onwards) */} 
      {segments.map((segment, indexInArray) => {
        const legNumber = indexInArray + 2; // Leg 2, 3, ...
        const previousLegDepartureDate = indexInArray === 0 
          ? departureDate // Previous is the 1st leg
          : segments[indexInArray - 1].departureDate; // Previous is another additional segment

        return (
          <div key={segment.id} className="p-1 border border-input rounded-lg bg-muted relative mb-3">
            {/* Title for Trip N */}
            <div className="absolute -top-4 -left-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-lg shadow-md">
              Trip {legNumber}
            </div>
            <div className="flex flex-col md:flex-row gap-2 items-stretch min-h-[120px] md:h-[200px]">
              {/* From/To Airport Pickers for this leg */}
              <div className="flex-grow-[2] flex flex-col justify-center md:min-w-[300px]">
                <div className="bg-muted border border-border rounded-lg p-2 md:p-4 min-h-[80px] flex flex-col justify-center md:h-full w-full">
                  {/* FROM FIELD */}
                  <AirportAutocomplete
                    value={segment.fromAirport}
                    onChange={(airport) => {
                      handleAdditionalSegmentChange(indexInArray, { fromAirport: airport });
                    }}
                    label="From"
                    placeholder="Enter airport name, city or code"
                  />
                  <div className="relative flex justify-center my-px">
                    <Button 
                      variant="outline"
                      size="icon"
                      className="rounded-full w-7 h-7 border-border bg-background text-foreground shadow-sm p-1 z-10 hover:bg-muted"
                      onClick={() => handleAdditionalSegmentSwap(indexInArray)}
                    >
                      <ArrowRightLeft size={12} style={{ transform: 'rotate(90deg)' }} />
                    </Button>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2"></div>
                  </div>
                  {/* TO FIELD */}
                  <AirportAutocomplete
                    value={segment.toAirport}
                    onChange={(airport) => {
                      handleAdditionalSegmentChange(indexInArray, { toAirport: airport });
                    }}
                    label="To"
                    placeholder="Enter airport name, city or code"
                  />
                </div>
              </div>
              {/* Date Picker for this leg */}
              <div className="flex-grow-[1] min-h-[80px] md:min-w-[180px] flex flex-col justify-center">
                <FlightDatePicker
                  label={`Departure`}
                  selectedDate={segment.departureDate}
                  onDateChange={(date) => handleAdditionalSegmentChange(indexInArray, { departureDate: date })}
                  minDate={previousLegDepartureDate ? addDays(previousLegDepartureDate, 1) : addDays(today,1)}
                  placeholder="Select date"
                  className="h-full"
                />
              </div>
              {/* Remove Button for this leg */}
              <div className="flex-grow-[1] min-h-[80px] md:min-w-[180px] flex items-center justify-center h-full">
                <div className="bg-muted border border-border rounded-lg p-2 md:p-4 min-h-[80px] w-full flex flex-col justify-center h-full">
                  <Button
                    className="w-full h-full bg-black text-white dark:bg-white dark:text-black border-none hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg flex items-center justify-center"
                    onClick={() => removeAdditionalSegment(segment.id)}
                    title="Remove this segment"
                  >
                    <X size={18} className="mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Fare Type */}
      <div className="flex flex-wrap gap-4 items-center mt-6 mb-6" style={{ marginLeft: 4 }}>
        <span className="text-xs font-medium">Fare Type:</span>
        <RadioGroup className="flex gap-4 flex-wrap" value={fareType} onValueChange={setFareType}>
          <div className="flex items-center">
            <RadioGroupItem value="regular" id={`regular-multi`} />
            <label htmlFor={`regular-multi`} className="ml-2 text-sm font-medium text-foreground">Regular</label>
          </div>
          <div className="flex items-center">
            <RadioGroupItem value="premium" id={`premium-multi`} />
            <label htmlFor={`premium-multi`} className="ml-2 text-sm font-medium text-foreground">Premium</label>
          </div>
          <div className="flex items-center">
            <RadioGroupItem value="business" id={`business-multi`} />
            <label htmlFor={`business-multi`} className="ml-2 text-sm font-medium text-foreground">Business</label>
          </div>
        </RadioGroup>
      </div>

      {/* Search Button */}
      <div className="flex justify-center mt-4">
        <Button size="lg" className="w-full md:w-64 text-lg font-semibold" onClick={handleMulticitySearch}>Search Flights</Button>
      </div>
    </>
  );
});

export default MulticityFlightSearchForm;