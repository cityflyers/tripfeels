"use client"
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ChevronDown, ArrowDown } from "@geist-ui/icons"
import AirportAutocomplete from "./airport/AirportAutocomplete"
import type { Airport } from "./airport/airportUtils"
import { FlightDatePicker } from "./calendar/FlightDatePicker"
import { TravellerSelector, type TravellerData } from "./travellers/TravellerSelector"
import { addDays, startOfDay, isBefore, format as formatDateFn } from "date-fns"
import MulticityFlightSearchForm from "./MulticityFlightSearchForm";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { getLastSearch, saveLastSearch, saveRecentSearch } from "@/lib/search-history"

const defaultTravellerData: TravellerData = {
  adults: 1,
  kids: 0,
  children: 0,
  infants: 0,
  travelClass: "Economy",
}

const defaultFrom: Airport = {
  city: "Dhaka",
  country: "Bangladesh",
  airportName: "Hazrat Shahjalal International Airport",
  code: "DAC",
}
const defaultTo: Airport = {
  city: "Chittagong",
  country: "Bangladesh",
  airportName: "Shah Amanat International",
  code: "CGP",
}

const today = startOfDay(new Date())

interface FlightSearchFormProps {
  showFareTypes?: boolean
  initialData?: {
    tripType: "oneway" | "roundtrip" | "multicity"
    segments: {
      from: Airport
      to: Airport
      date: Date | undefined
    }[]
    travellers: TravellerData
    fareType: string
  }
  noShadow?: boolean
  onSearch?: () => void
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

const FlightSearchForm = forwardRef(function FlightSearchForm({ showFareTypes = true, initialData, noShadow = false, onSearch }: FlightSearchFormProps, ref) {
  const router = useRouter()
  const travellerTriggerRef = useRef<HTMLButtonElement>(null)
  const travellerContentRef = useRef<HTMLDivElement>(null)

  // --- BEGIN: In-memory form state for each trip type ---
  type TripType = "oneway" | "roundtrip" | "multicity";
  interface TripFormState {
    fromAirport: Airport | null;
    toAirport: Airport | null;
    departureDate: Date | undefined;
    returnDate?: Date | undefined;
    travellerData: TravellerData;
    fareType: string;
  }
  const [formStates, setFormStates] = useState<{
    oneway: TripFormState | null;
    roundtrip: TripFormState | null;
    multicity: any; // Multicity handled by its own form
  }>({
    oneway: null,
    roundtrip: null,
    multicity: null,
  });
  // --- END ---

  // Initialize with default values or initialData, avoiding localStorage during SSR
  const [tripType, setTripType] = useState<"oneway" | "roundtrip" | "multicity">(
    initialData?.tripType || "oneway"
  )
  const [fromAirport, setFromAirport] = useState<Airport | null>(
    initialData?.segments?.[0]?.from || defaultFrom
  )
  const [toAirport, setToAirport] = useState<Airport | null>(
    initialData?.segments?.[0]?.to || defaultTo
  )
  const [fareType, setFareType] = useState("regular")
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    initialData?.segments?.[0]?.date || addDays(today, 1)
  )
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    initialData?.segments?.[1]?.date || undefined
  )
  const [travellerData, setTravellerData] = useState<TravellerData>(
    initialData?.travellers || defaultTravellerData
  )
  const [isTravellerPopoverOpen, setIsTravellerPopoverOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // --- BEGIN: Save current state to formStates on any field change ---
  useEffect(() => {
    setFormStates(prev => ({
      ...prev,
      [tripType]: tripType === "multicity"
        ? null // Multicity handled separately
        : {
            fromAirport,
            toAirport,
            departureDate,
            returnDate,
            travellerData,
            fareType,
          }
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAirport, toAirport, departureDate, returnDate, travellerData, fareType]);
  // --- END ---

  // --- BEGIN: Trip type change handler with state preservation (fixed for async state) ---
  const handleTripTypeChange = (value: string) => {
    setFormStates(prev => {
      // Save current state for the current trip type
      const updated = { ...prev };
      if (tripType === "oneway") {
        updated.oneway = {
          fromAirport,
          toAirport,
          departureDate,
          returnDate: undefined,
          travellerData,
          fareType,
        };
      } else if (tripType === "roundtrip") {
        updated.roundtrip = {
          fromAirport,
          toAirport,
          departureDate,
          returnDate,
          travellerData,
          fareType,
        };
      } // multicity handled by its own form

      // If switching to a new trip type for the first time, use current form values as its initial state
      if (!updated[value as keyof typeof updated]) {
        if (value === "oneway") {
          updated.oneway = {
            fromAirport,
            toAirport,
            departureDate,
            returnDate: undefined,
            travellerData,
            fareType,
          };
        } else if (value === "roundtrip") {
          updated.roundtrip = {
            fromAirport,
            toAirport,
            departureDate,
            returnDate,
            travellerData,
            fareType,
          };
        } else if (value === "multicity") {
          updated.multicity = null;
        }
      }
      // After updating, restore the new trip type's state
      // (We can't setState here, so use a useEffect to react to tripType changes)
      return updated;
    });
    setTripType(value as typeof tripType);
  };

  // Restore the new trip type's state after tripType changes
  useEffect(() => {
    const newState = formStates[tripType as keyof typeof formStates];
    if (!newState) {
      // No in-memory state for this trip type, use initial/default data
      if (tripType === "oneway") {
        setFromAirport(defaultFrom);
        setToAirport(defaultTo);
        setDepartureDate(addDays(today, 1));
        setReturnDate(undefined);
        setTravellerData(defaultTravellerData);
        setFareType("regular");
      } else if (tripType === "roundtrip") {
        setFromAirport(defaultFrom);
        setToAirport(defaultTo);
        setDepartureDate(addDays(today, 1));
        setReturnDate(undefined);
        setTravellerData(defaultTravellerData);
        setFareType("regular");
      }
      // For multicity, handled by initialData below
      return;
    }
    if (tripType === "oneway") {
      setFromAirport(newState.fromAirport || defaultFrom);
      setToAirport(newState.toAirport || defaultTo);
      setDepartureDate(newState.departureDate || addDays(today, 1));
      setReturnDate(undefined);
      setTravellerData(newState.travellerData || defaultTravellerData);
      setFareType(newState.fareType || "regular");
    } else if (tripType === "roundtrip") {
      setFromAirport(newState.fromAirport || defaultFrom);
      setToAirport(newState.toAirport || defaultTo);
      setDepartureDate(newState.departureDate || addDays(today, 1));
      setReturnDate(newState.returnDate || undefined);
      setTravellerData(newState.travellerData || defaultTravellerData);
      setFareType(newState.fareType || "regular");
    }
    // For multicity, handled by initialData below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripType]);
  // --- END ---

  // Load saved search data from localStorage after component mounts
  useEffect(() => {
    setIsClient(true)
    // Only load from localStorage if no initialData was provided and only on first mount
    if (!initialData) {
      const lastSearch = getLastSearch(tripType)
      if (lastSearch) {
        setFromAirport(lastSearch.fromAirport || defaultFrom)
        setToAirport(lastSearch.toAirport || defaultTo)
        setDepartureDate(lastSearch.departureDate || addDays(today, 1))
        setTravellerData(lastSearch.travellerData || defaultTravellerData)
        if (tripType === "roundtrip") {
          setReturnDate(lastSearch.returnDate)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Remove localStorage/history fallback from trip type change effect
  useEffect(() => {
    const newState = formStates[tripType as keyof typeof formStates];
    if (!newState) {
      // No in-memory state for this trip type, use initial/default data
      if (tripType === "oneway") {
        setFromAirport(defaultFrom);
        setToAirport(defaultTo);
        setDepartureDate(addDays(today, 1));
        setReturnDate(undefined);
        setTravellerData(defaultTravellerData);
        setFareType("regular");
      } else if (tripType === "roundtrip") {
        setFromAirport(defaultFrom);
        setToAirport(defaultTo);
        setDepartureDate(addDays(today, 1));
        setReturnDate(undefined);
        setTravellerData(defaultTravellerData);
        setFareType("regular");
      }
      // For multicity, handled by initialData below
      return;
    }
    if (tripType === "oneway") {
      setFromAirport(newState.fromAirport || defaultFrom);
      setToAirport(newState.toAirport || defaultTo);
      setDepartureDate(newState.departureDate || addDays(today, 1));
      setReturnDate(undefined);
      setTravellerData(newState.travellerData || defaultTravellerData);
      setFareType(newState.fareType || "regular");
    } else if (tripType === "roundtrip") {
      setFromAirport(newState.fromAirport || defaultFrom);
      setToAirport(newState.toAirport || defaultTo);
      setDepartureDate(newState.departureDate || addDays(today, 1));
      setReturnDate(newState.returnDate || undefined);
      setTravellerData(newState.travellerData || defaultTravellerData);
      setFareType(newState.fareType || "regular");
    }
    // For multicity, handled by initialData below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripType]);

  // Add this useEffect after the other useEffects for state initialization
  useEffect(() => {
    if (initialData) {
      setTripType(initialData.tripType || "oneway");
      setFromAirport(initialData.segments?.[0]?.from || defaultFrom);
      setToAirport(initialData.segments?.[0]?.to || defaultTo);
      setDepartureDate(initialData.segments?.[0]?.date || addDays(today, 1));
      setReturnDate(initialData.segments?.[1]?.date || undefined);
      setTravellerData(initialData.travellers || defaultTravellerData);
      setFareType(initialData.fareType || "regular");
    }
  }, [JSON.stringify(initialData)]);

  const handleSwap = () => {
    setFromAirport(toAirport)
    setToAirport(fromAirport)
  }

  const handleDepartureDateChange = (date: Date | undefined) => {
    setDepartureDate(date)
    if (tripType === "roundtrip" && date && returnDate && isBefore(returnDate, date)) {
      setReturnDate(undefined)
    }
  }

  const totalTravellers = travellerData.adults + travellerData.kids + travellerData.children + travellerData.infants

  const handleSearch = () => {
    if (!fromAirport || !toAirport || !departureDate) {
      alert("Please fill in all required fields: From, To, and Departure Date.")
      return
    }

    // Save the current search to localStorage under the current trip type
    saveLastSearch(tripType, {
      tripType,
      fromAirport,
      toAirport,
      departureDate,
      returnDate,
      travellerData,
      fareType,
    })

    // Save to recent searches for card display
    saveRecentSearch({
      from: { city: fromAirport?.city, code: fromAirport?.code },
      to: { city: toAirport?.city, code: toAirport?.code },
      date: formatLocalDate(departureDate),
      returnDate: tripType === "roundtrip" && returnDate ? formatLocalDate(returnDate) : undefined,
      type: tripType === "roundtrip" ? "Roundtrip" : "OneWay",
      travelers: totalTravellers,
      travellers: travellerData,
      fareType,
    });

    const params = new URLSearchParams()

    // Set trip type
    params.append("tripType", tripType === "roundtrip" ? "Return" : "OneWay")

    // Add first segment
    params.append("origin1", fromAirport.code)
    params.append("destination1", toAirport.code)
    params.append("date1", formatDateFn(departureDate, "yyyy-MM-dd"))

    // Add return segment if roundtrip
    if (tripType === "roundtrip" && returnDate) {
      params.append("origin2", toAirport.code)
      params.append("destination2", fromAirport.code)
      params.append("date2", formatDateFn(returnDate, "yyyy-MM-dd"))
    }

    // Add passenger information
    params.append("adults", travellerData.adults.toString())
    const totalChildren = (travellerData.kids || 0) + (travellerData.children || 0)
    params.append("children", totalChildren.toString())
    params.append("infants", (travellerData.infants || 0).toString())

    // Add cabin class
    params.append("cabin", travellerData.travelClass)

    // Add fare type if needed
    if (showFareTypes) {
      params.append("fareType", fareType)
    }

    router.push(`/results?${params.toString()}`)
    if (onSearch) onSearch();
  }

  useImperativeHandle(ref, () => ({
    triggerSearch: handleSearch
  }));

  return (
    <div className="w-full px-0 pt-0 pb-0">
      <div className={`w-full bg-background rounded-none md:rounded-none px-6 py-10${noShadow ? '' : ' shadow-lg'}`}>
        {/* Trip Type Radio Group */}
        <div className="flex gap-4 items-center mb-4">
          <RadioGroup
            className="flex gap-4"
            value={tripType}
            onValueChange={handleTripTypeChange}
          >
            <div className="flex items-center">
              <RadioGroupItem value="oneway" id="oneway-main" />
              <label htmlFor="oneway-main" className="ml-2 mr-2 text-sm font-medium cursor-pointer text-foreground">
                Oneway
              </label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="roundtrip" id="roundtrip-main" />
              <label htmlFor="roundtrip-main" className="ml-2 mr-2 text-sm font-medium cursor-pointer text-foreground">
                Roundtrip
              </label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="multicity" id="multicity-main" />
              <label htmlFor="multicity-main" className="ml-2 text-sm font-medium cursor-pointer text-foreground">
                Multicity
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Conditional Rendering based on Trip Type */}
        <>
          {tripType === "multicity" ? (
            <MulticityFlightSearchForm
              initialData={formStates.multicity || initialData}
            />
          ) : (
            <>
              {/* Main Form Row for Oneway/Roundtrip */}
              <div className="flex flex-col md:flex-row gap-2 mb-2">
                {/* From/To Combined with Autocomplete */}
                <div className="w-full md:flex-[1.5] min-w-0 flex flex-col justify-between">
                  <div className="relative h-full">
                    <div
                      className="bg-muted border border-border rounded-lg h-full flex flex-col justify-between p-2 md:p-4"
                      style={{ minHeight: 80 }}
                    >
                      {/* From Airport */}
                      <AirportAutocomplete
                        value={fromAirport}
                        onChange={setFromAirport}
                        label="From"
                        placeholder="Enter city or airport"
                      />

                      {/* Swap Button */}
                      <div className="relative flex items-center justify-center my-2">
                        <div className="absolute left-0 right-0 h-px bg-border" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative z-10 rounded-full border border-border bg-background p-1"
                          onClick={handleSwap}
                        >
                          <ArrowDown size={16} style={{ transform: "rotate(90deg)" }} />
                        </Button>
                      </div>

                      {/* To Airport */}
                      <AirportAutocomplete
                        value={toAirport}
                        onChange={setToAirport}
                        label="To"
                        placeholder="Enter city or airport"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Pickers */}
                <div className="flex flex-row gap-2 w-full md:flex-[2]">
                  <FlightDatePicker
                    label="Departure"
                    selectedDate={departureDate}
                    onDateChange={handleDepartureDateChange}
                    minDate={today}
                    placeholder="Select date"
                    className="flex-1"
                  />
                  <FlightDatePicker
                    label="Return"
                    selectedDate={returnDate}
                    onDateChange={setReturnDate}
                    minDate={departureDate ? addDays(departureDate, 1) : addDays(today, 1)}
                    disabled={tripType === "oneway"}
                    placeholder={tripType === "oneway" ? "Select date" : "Select date"}
                    className="flex-1"
                  />
                </div>

                {/* Traveler Selector */}
                <div className="w-full md:flex-[1] min-w-0 flex flex-col gap-2">
                  <Popover open={isTravellerPopoverOpen} onOpenChange={setIsTravellerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-full bg-muted border-border hover:bg-muted/80 flex flex-col items-start justify-center p-2 md:p-4 min-h-[120px] rounded-lg"
                      >
                        <span className="block text-sm font-medium text-foreground mb-1">
                          {totalTravellers} Traveler{totalTravellers !== 1 ? "s" : ""}
                        </span>
                        <div className="flex items-center text-base font-semibold text-foreground w-full">
                          <span className="mr-2 truncate">{travellerData.travelClass}</span>
                          <ChevronDown size={16} className="ml-auto text-muted-foreground shrink-0" />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="center"
                      className="w-[350px] p-0 rounded-lg shadow-lg bg-background border-0"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        position: 'fixed',
                        zIndex: 50,
                      }}
                    >
                      <div className="p-4">
                        <TravellerSelector
                          initialData={travellerData}
                          onDone={(data) => {
                            setTravellerData(data)
                            setIsTravellerPopoverOpen(false)
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Preferred Airlines Field */}
                  <div className="w-full flex flex-col justify-center">
                    <label className="block text-sm font-medium text-foreground mb-1">Preferred Airlines</label>
                    <input
                      type="text"
                      placeholder="Enter preferred airlines"
                      className="w-full border border-border rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                    <div className="flex items-center mt-4">
                      <span className="text-xs font-medium mr-2">Fare Type:</span>
                      <input type="radio" id="regular-fare" name="fareType" checked readOnly className="mr-2 accent-black dark:accent-white" />
                      <label htmlFor="regular-fare" className="text-sm cursor-pointer">Regular Fares</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex justify-center mt-4">
                <Button size="lg" className="w-full md:w-64 text-lg font-semibold" onClick={handleSearch}>
                  Search Flights
                </Button>
              </div>
            </>
          )}
        </>
      </div>
    </div>
  )
});

export default FlightSearchForm;