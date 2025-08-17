"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { searchAirports } from "./airportUtils"
import type { Airport } from "./airportUtils"

const RECENT_AIRPORTS_KEY = "recent_airports_v1"
const RECENT_LIMIT = 6

interface AirportAutocompleteProps {
  value: Airport | null
  onChange: (airport: Airport | null) => void
  label: string
  placeholder?: string
}

function saveRecentAirport(airport: Airport) {
  if (typeof window !== "undefined") {
    const existing = JSON.parse(localStorage.getItem(RECENT_AIRPORTS_KEY) || "[]") as Airport[]
    const filtered = existing.filter((a) => a.code !== airport.code)
    const updated = [airport, ...filtered].slice(0, RECENT_LIMIT)
    localStorage.setItem(RECENT_AIRPORTS_KEY, JSON.stringify(updated))
  }
}

function getRecentAirports(): Airport[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_AIRPORTS_KEY) || "[]")
  } catch {
    return []
  }
}

export default function AirportAutocomplete({
  value,
  onChange,
  label,
  placeholder = "Enter city or airport",
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [airports, setAirports] = useState<Airport[]>([])
  const [showInput, setShowInput] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recent, setRecent] = useState<Airport[]>([])
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce query
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => setDebouncedQuery(query), 300)
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [query])

  // Search airports locally
  useEffect(() => {
    if (!debouncedQuery) {
      setAirports([])
      return
    }
    const results = searchAirports(debouncedQuery)
    setAirports(results)
  }, [debouncedQuery])

  // Load recent airports
  useEffect(() => {
    setRecent(getRecentAirports())
  }, [])

  // Focus input when showInput becomes true
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInput])

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowInput(false)
        setShowSuggestions(false)
        setQuery("")
      }
    }
    if (showInput) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showInput])

  // Handle selection
  const handleSelect = (airport: Airport) => {
    onChange(airport)
    setQuery("")
    setShowInput(false)
    setShowSuggestions(false)
    saveRecentAirport(airport)
    setRecent(getRecentAirports())
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setShowSuggestions(newQuery.length > 0 || recent.length > 0)
  }

  // Handle input focus
  const handleInputFocus = () => {
    setShowSuggestions(query.length > 0 || recent.length > 0)
  }

  // Handle airport info click - show input field
  const handleAirportClick = () => {
    setShowInput(true)
    setQuery("")
  }

  // Show input field if no value is selected or if user clicked to edit
  if (!value || showInput) {
    // --- BEGIN: All Airports logic ---
    let airportsToShow = airports;
    let allAirportsEntry: Airport | null = null;
    if (query && airports.length > 0) {
      // Group by city+country
      const cityCountry = airports[0].city + '|' + airports[0].country;
      const sameCityAirports = airports.filter(a => (a.city + '|' + a.country) === cityCountry);
      if (sameCityAirports.length > 1 && airports[0].city.toLowerCase() === query.toLowerCase()) {
        allAirportsEntry = {
          city: airports[0].city,
          country: airports[0].country,
          airportName: 'All Airports',
          code: 'ALL',
        };
        // Remove duplicates for this city from the list (will show below the meta entry)
        airportsToShow = sameCityAirports.concat(airports.filter(a => (a.city + '|' + a.country) !== cityCountry));
      }
    }
    // --- END: All Airports logic ---
    return (
      <div className="w-full" ref={wrapperRef}>
        <label className="block text-sm font-medium text-muted-foreground mb-2">{label}</label>

        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="w-full"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {/* Show recent airports if no query */}
              {!query && recent.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">Recent Airports</div>
                  {recent.map((airport, idx) => (
                    <div
                      key={`recent-${airport.code}-${idx}`}
                      className="px-3 py-2 cursor-pointer hover:bg-muted/50 border-b last:border-b-0"
                      onClick={() => handleSelect(airport)}
                    >
                      <div className="font-medium text-sm">
                        {airport.city}, {airport.country} ({airport.code})
                      </div>
                      <div className="text-xs text-muted-foreground">{airport.airportName}</div>
                    </div>
                  ))}
                </>
              )}

              {/* Show search results */}
              {query && airports.length > 0 && (
                <>
                  {/* All Airports meta entry */}
                  {allAirportsEntry && (
                    <div
                      key={`all-airports-${allAirportsEntry.city}-${allAirportsEntry.country}`}
                      className="px-3 py-2 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 font-semibold"
                      onClick={() => handleSelect(allAirportsEntry)}
                    >
                      {allAirportsEntry.city}, {allAirportsEntry.country} (All Airports)
                    </div>
                  )}
                  {/* Individual airports */}
                  {airportsToShow.map((airport, idx) => (
                    <div
                      key={`search-${airport.code}-${idx}`}
                      className="px-3 py-2 cursor-pointer hover:bg-muted/50 border-b last:border-b-0"
                      onClick={() => handleSelect(airport)}
                    >
                      <div className="font-medium text-sm">
                        {airport.city}, {airport.country} ({airport.code})
                      </div>
                      <div className="text-xs text-muted-foreground">{airport.airportName}</div>
                    </div>
                  ))}
                </>
              )}

              {/* No results */}
              {query && airports.length === 0 && (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No airports found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show selected airport info (default state) - Clean design with no borders/padding
  return (
    <div className="w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-muted-foreground mb-2">{label}</label>

      <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={handleAirportClick}>
        <div className="font-semibold text-lg text-foreground">
          {value.city} ({value.code})
        </div>
        <div className="text-sm text-muted-foreground mt-1">{value.airportName}</div>
      </div>
    </div>
  )
}
