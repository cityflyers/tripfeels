'use client'

import { ArrowLeftRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import {
  AirportSelection,
  type AirportOption,
} from '@/components/flight/airport-selection/AirportSelection'
import { FlightDatePicker } from '@/components/flight/flight-date-picker'
import { MulticityFlightSearch } from '@/components/flight/MulticityFlightSearch'
import { TravelerSelection, type TravelerData } from '@/components/flight/traveler-selection'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDynamicThemeColors } from '@/lib/dynamic-theme-colors'
import { cn } from '@/lib/utils'

type TripType = 'oneway' | 'roundtrip' | 'multicity'

type FareType = 'regular' | 'student' | 'seaman'

function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTodayDate(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function FlightSearchInterface() {
  const themeColors = useDynamicThemeColors()
  const router = useRouter()
  const [tripType, setTripType] = useState<TripType>('oneway')
  const [from, setFrom] = useState<AirportOption | null>({
    id: 'DAC',
    city: 'Dhaka',
    country: 'Bangladesh',
    iata: 'DAC',
    name: 'Hazrat Shahjalal International Airport',
  })
  const [to, setTo] = useState<AirportOption | null>({
    id: 'CGP',
    city: 'Chittagong',
    country: 'Bangladesh',
    iata: 'CGP',
    name: 'Shah Amanat International',
  })
  const [departureDate, setDepartureDate] = useState(getTomorrowDate())
  const [returnDate, setReturnDate] = useState('')
  const [travelerData, setTravelerData] = useState<TravelerData>({
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: 'Economy',
    childrenAges: [],
  })
  const [preferredAirline, setPreferredAirline] = useState('')
  const [fareType, setFareType] = useState<FareType>('regular')

  // Handle trip type changes
  useEffect(() => {
    // Clear return date when switching to oneway or multicity
    if (tripType !== 'roundtrip') {
      setReturnDate('')
    }
  }, [tripType])

  // Handle departure date changes
  const handleDepartureDateChange = (newDate: string) => {
    setDepartureDate(newDate)

    // If return date exists and is before the new departure date, clear it
    // Allow same-day returns by using <= instead of <
    if (returnDate && newDate) {
      const departureParts = newDate.split('-')
      const returnParts = returnDate.split('-')

      if (departureParts.length === 3 && returnParts.length === 3) {
        const depYear = parseInt(departureParts[0] || '0', 10)
        const depMonth = parseInt(departureParts[1] || '0', 10) - 1
        const depDay = parseInt(departureParts[2] || '0', 10)
        const departure = new Date(depYear, depMonth, depDay)
        departure.setHours(0, 0, 0, 0)

        const retYear = parseInt(returnParts[0] || '0', 10)
        const retMonth = parseInt(returnParts[1] || '0', 10) - 1
        const retDay = parseInt(returnParts[2] || '0', 10)
        const returnD = new Date(retYear, retMonth, retDay)
        returnD.setHours(0, 0, 0, 0)

        // Only clear return date if it's actually before departure date (not same day)
        if (returnD < departure) {
          setReturnDate('')
        }
      }
    }
  }

  const swapLocations = () => {
    const prevFrom = from
    const prevTo = to
    setFrom(prevTo)
    setTo(prevFrom)
  }

  const handleSearch = () => {
    // Build query parameters
    const params = new URLSearchParams({
      tripType,
      departureDate,
      adults: travelerData.adults.toString(),
      children: travelerData.children.toString(),
      infants: travelerData.infants.toString(),
      travelClass: travelerData.travelClass,
      preferredAirline,
      fareType,
    })

    // Only add from/to for non-multicity searches
    if (tripType !== 'multicity') {
      if (from) params.append('from', from.iata)
      if (to) params.append('to', to.iata)
    }
    
    if (tripType === 'roundtrip' && returnDate) {
      params.append('returnDate', returnDate)
    }

    // Navigate to flight search results page
    router.push(`/results?${params.toString()}`)
  }

  const isReturnDisabled = tripType !== 'roundtrip'
  const isMulticity = tripType === 'multicity'
  const tripTypeSelector = (
    <div className="tf-triptype-surface justify-start">
      <label className="flex items-center gap-2 text-sm font-bold text-[var(--tf-text-primary)]">
        <input
          type="radio"
          name="tripType"
          className="tf-radio h-4 w-4"
          checked={tripType === 'oneway'}
          onChange={() => setTripType('oneway')}
        />
        Oneway
      </label>
      <label className="flex items-center gap-2 text-sm font-bold text-[var(--tf-text-primary)]">
        <input
          type="radio"
          name="tripType"
          className="tf-radio h-4 w-4"
          checked={tripType === 'roundtrip'}
          onChange={() => setTripType('roundtrip')}
        />
        Roundtrip
      </label>
      <label className="flex items-center gap-2 text-sm font-bold text-[var(--tf-text-primary)]">
        <input
          type="radio"
          name="tripType"
          className="tf-radio h-4 w-4"
          checked={tripType === 'multicity'}
          onChange={() => setTripType('multicity')}
        />
        Multicity
      </label>
    </div>
  )

  return (
    <div className="space-y-0 overflow-visible bg-[var(--tf-app-bg)]">
      <div
        className={cn(
          'px-3 lg:px-5 bg-[var(--tf-component-bg)] border-x border-t border-[var(--tf-divider)]',
          !isMulticity && 'border-b-0',
        )}
      >
        {tripTypeSelector}
      </div>

      {/* Conditionally render based on trip type */}
      <div className="relative overflow-visible z-20">
        {tripType === 'multicity' ? (
          <div className="space-y-3">
            <MulticityFlightSearch 
              travelerData={travelerData}
              onTravelerDataChange={setTravelerData}
              preferredAirline={preferredAirline}
              onPreferredAirlineChange={setPreferredAirline}
              fareType={fareType}
              onFareTypeChange={setFareType}
              idPrefix="homepage-multicity"
            />
          </div>
        ) : (
        <Card className="w-full rounded-none px-3 pb-3 pt-1 lg:px-5 lg:pb-5 lg:pt-2 bg-[var(--tf-component-bg)] border border-[var(--tf-divider)] border-t-0 shadow-sm overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 items-stretch overflow-visible">
            {/* From/To combined */}
            <div className="lg:col-span-4 relative">
              <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-surface)] overflow-visible h-full min-h-[60px] lg:min-h-[140px] flex flex-col relative z-20">
                <div className="px-3 py-2 lg:px-4 lg:py-3 pr-12 lg:pr-16 flex-1 flex flex-col justify-center relative z-30">
                  <AirportSelection
                    label="From"
                    inputId="flight-from"
                    inputName="from"
                    value={from}
                    onChange={setFrom}
                    placeholder="City or airport"
                  />
                </div>
                <div className="relative h-0 border-t border-[var(--tf-border)]">
                  <button
                    type="button"
                    onClick={swapLocations}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-40 h-8 w-8 rounded-full border border-primary/30 bg-[var(--tf-surface)] shadow-sm flex items-center justify-center hover:bg-[var(--tf-nav-hover)] transition-colors"
                    aria-label="Swap origin and destination"
                  >
                    <ArrowLeftRight className="h-4 w-4 rotate-90 text-primary" />
                  </button>
                </div>
                <div className="px-3 py-2 lg:px-4 lg:py-3 pr-12 lg:pr-16 flex-1 flex flex-col justify-center relative z-30">
                  <AirportSelection
                    label="To"
                    inputId="flight-to"
                    inputName="to"
                    value={to}
                    onChange={setTo}
                    placeholder="City or airport"
                  />
                </div>
              </div>
            </div>

            {/* Departure + Return (mobile side-by-side) */}
            <div className="grid grid-cols-2 gap-0 lg:gap-4 lg:contents">
              {/* Departure */}
              <div className="lg:col-span-2 h-full min-h-[90px] lg:min-h-[140px]">
                <FlightDatePicker
                  label="Departure"
                  value={departureDate}
                  onChange={handleDepartureDateChange}
                  placeholder="Select date"
                  className="rounded-r-none lg:rounded-r-lg"
                  minDate={getTodayDate()}
                />
              </div>

              {/* Return */}
              <div className="lg:col-span-2 h-full min-h-[90px] lg:min-h-[140px]">
                <FlightDatePicker
                  label="Return"
                  value={returnDate}
                  onChange={setReturnDate}
                  disabled={isReturnDisabled}
                  placeholder="Select date"
                  className="rounded-l-none lg:rounded-l-lg"
                  minDate={departureDate || getTodayDate()}
                />
              </div>
            </div>

            {/* Right side options */}
            <div className="lg:col-span-4">
              <div className="h-full min-h-[90px] lg:min-h-[140px] flex flex-col gap-1 lg:gap-2">
                <TravelerSelection value={travelerData} onChange={setTravelerData} />

                <div className="flex-[3] flex flex-col justify-start gap-1">
                  <div>
                    <div className="text-xs font-semibold text-[var(--tf-text-primary)]">
                      Preferred Airlines
                    </div>
                    <Input
                      id="flight-preferred-airline"
                      name="preferredAirline"
                      value={preferredAirline}
                      onChange={(e) => setPreferredAirline(e.target.value)}
                      placeholder="Enter preferred airlines"
                      className="mt-0 border border-[var(--tf-border)] bg-[var(--tf-surface)] text-[var(--tf-text-primary)] placeholder:text-[var(--tf-text-secondary)] focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                    />
                  </div>

                  <div className="pt-0">
                    <div className="text-xs font-semibold text-[var(--tf-text-primary)] mb-1">
                      Fare Type:
                    </div>
                    <div className="flex items-center gap-2 lg:gap-3 flex-wrap w-full">
                      <label className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-[var(--tf-text-primary)] whitespace-nowrap min-w-0">
                        <input
                          type="radio"
                          name="fareType"
                          className="tf-radio h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
                          checked={fareType === 'regular'}
                          onChange={() => setFareType('regular')}
                        />
                        <span className="text-xs sm:text-sm">Regular</span>
                      </label>
                      <label className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-[var(--tf-text-primary)] whitespace-nowrap min-w-0">
                        <input
                          type="radio"
                          name="fareType"
                          className="tf-radio h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
                          checked={fareType === 'student'}
                          onChange={() => setFareType('student')}
                        />
                        <span className="text-xs sm:text-sm">Student</span>
                      </label>
                      <label className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-[var(--tf-text-primary)] whitespace-nowrap min-w-0">
                        <input
                          type="radio"
                          name="fareType"
                          className="tf-radio h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
                          checked={fareType === 'seaman'}
                          onChange={() => setFareType('seaman')}
                        />
                        <span className="text-xs sm:text-sm">Seaman</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-3 bg-[var(--tf-component-bg)] pt-3 lg:gap-4 lg:pt-4">
            <Button
              type="button"
              className={cn(
                'min-w-[180px] text-[var(--tf-primary-text)] font-semibold shadow-lg',
                themeColors.primary,
                themeColors.primaryHover,
              )}
              onClick={handleSearch}
            >
              Search Flights
            </Button>
          </div>
        </Card>
        )}
      </div>
    </div>
  )
}

