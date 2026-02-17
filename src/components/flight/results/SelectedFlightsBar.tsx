'use client'

import { Plane, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { AirlineLogo } from '@/components/flight/shared/AirlineLogo'
import { formatFlightTime } from '@/lib/flight/utils/date-formatter'
import { formatPrice } from '@/lib/flight/utils/price-formatter'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'

interface SelectedFlightsBarProps {
  selectedOutbound: FlightOffer | null
  selectedReturn: FlightOffer | null
  /** Selected fare brand name for outbound (for correct total when offer has upSellOptions) */
  selectedOutboundFare?: string
  /** Selected fare brand name for return (for correct total when offer has upSellOptions) */
  selectedReturnFare?: string
  onClearOutbound?: () => void
  onClearReturn?: () => void
  onBookNow?: () => void
}

function FlightSummary({ 
  offer, 
  type, 
  onClear 
}: { 
  offer: FlightOffer
  type: 'outbound' | 'return'
  onClear?: (() => void) | undefined
}) {
  const segment = offer.segments[0]
  if (!segment) return null

  const departure = segment.departure
  const arrival = segment.arrival

  return (
    <div className="flex items-center gap-2 rounded-lg bg-[var(--tf-surface-alt)]/55 px-2 py-1.5 lg:gap-3 lg:px-3 lg:py-2">
      {/* Airline Logo */}
      <div className="flex-shrink-0">
        <AirlineLogo airlineId={offer.validatingCarrier.code} size={18} className="w-4 h-4 lg:w-5 lg:h-5" />
      </div>

      {/* Route Info */}
      <div className="flex min-w-0 items-center gap-1 text-xs text-[var(--tf-text-primary)] lg:gap-2 lg:text-sm">
        <span className="font-semibold">{departure.airport}</span>
        <span className="text-[10px] text-[var(--tf-text-muted)] lg:text-xs">{formatFlightTime(departure.dateTime)}</span>
        <Plane className="h-2.5 w-2.5 flex-shrink-0 text-[var(--tf-text-muted)] lg:h-3 lg:w-3" />
        <span className="font-semibold">{arrival.airport}</span>
        <span className="text-[10px] text-[var(--tf-text-muted)] lg:text-xs">{formatFlightTime(arrival.dateTime)}</span>
      </div>

      {/* Clear Button */}
      {onClear && (
        <button
          onClick={onClear}
          className="flex-shrink-0 rounded p-0.5 transition-colors hover:bg-[var(--tf-nav-hover)]/45 lg:p-1"
          aria-label={`Clear ${type} selection`}
        >
          <X className="h-3 w-3 text-[var(--tf-text-muted)] hover:text-[var(--tf-text-primary)] lg:h-4 lg:w-4" />
        </button>
      )}
    </div>
  )
}

export function SelectedFlightsBar({
  selectedOutbound,
  selectedReturn,
  selectedOutboundFare,
  selectedReturnFare,
  onClearOutbound,
  onClearReturn,
  onBookNow,
}: SelectedFlightsBarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Don't show if nothing is selected
  if (!selectedOutbound && !selectedReturn) {
    return null
  }

  // Resolve price from selected fare option when user picked a specific upsell (e.g. Economy O)
  const outboundOption = selectedOutboundFare && selectedOutbound?.upSellOptions?.length
    ? selectedOutbound.upSellOptions.find(
        (o) => o.brandName.toLowerCase() === selectedOutboundFare.toLowerCase()
      )
    : undefined
  const returnOption = selectedReturnFare && selectedReturn?.upSellOptions?.length
    ? selectedReturn.upSellOptions.find(
        (o) => o.brandName.toLowerCase() === selectedReturnFare.toLowerCase()
      )
    : undefined

  const outboundPrice =
    outboundOption?.pricing.gross ?? outboundOption?.pricing.total ??
    selectedOutbound?.pricing.gross ?? selectedOutbound?.pricing.total ?? 0
  const returnPrice =
    returnOption?.pricing.gross ?? returnOption?.pricing.total ??
    selectedReturn?.pricing.gross ?? selectedReturn?.pricing.total ?? 0
  const totalPrice = outboundPrice + returnPrice
  const currency = selectedOutbound?.pricing.currency || selectedReturn?.pricing.currency || 'BDT'

  const bothSelected = selectedOutbound && selectedReturn

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--tf-border)] bg-[var(--tf-app-bg)] shadow-2xl">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-8 left-1/2 flex -translate-x-1/2 transform items-center gap-1 rounded-t-lg border border-[var(--tf-border)] border-b-0 bg-[var(--tf-app-bg)] px-4 py-1 text-xs text-[var(--tf-text-secondary)] transition-colors hover:text-[var(--tf-text-primary)]"
      >
        {isExpanded ? (
          <>
            <span>Hide</span>
            <ChevronDown className="w-3 h-3" />
          </>
        ) : (
          <>
            <span>Show Selection</span>
            <ChevronUp className="w-3 h-3" />
          </>
        )}
      </button>

      {isExpanded && (
        <div className="container mx-auto px-2 sm:px-4 py-2 lg:py-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-4">
            {/* Selected Flights */}
            <div className="flex flex-col sm:flex-row items-center gap-2 lg:gap-4 flex-1 w-full lg:w-auto">
              {/* Outbound */}
              {selectedOutbound ? (
                <FlightSummary 
                  offer={selectedOutbound} 
                  type="outbound" 
                  onClear={onClearOutbound}
                />
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-[var(--tf-surface-alt)]/35 px-3 py-2 text-xs text-[var(--tf-text-muted)] lg:text-sm">
                  <Plane className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Select outbound flight</span>
                </div>
              )}

              {/* Arrow between */}
              <div className="hidden items-center text-[var(--tf-text-muted)] sm:flex">
                <Plane className="w-4 h-4 rotate-90 sm:rotate-0" />
              </div>

              {/* Return */}
              {selectedReturn ? (
                <FlightSummary 
                  offer={selectedReturn} 
                  type="return" 
                  onClear={onClearReturn}
                />
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-[var(--tf-surface-alt)]/35 px-3 py-2 text-xs text-[var(--tf-text-muted)] lg:text-sm">
                  <Plane className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Select return flight</span>
                </div>
              )}
            </div>

            {/* Total Price & Actions */}
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Total Price */}
              <div className="text-right">
                <div className="text-[10px] uppercase text-[var(--tf-text-muted)] lg:text-xs">Total Price</div>
                <div className="text-lg font-bold text-[var(--tf-text-primary)] lg:text-xl">
                  {formatPrice(totalPrice, currency)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onBookNow}
                  disabled={!bothSelected}
                  className={`px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg text-xs lg:text-sm font-semibold transition-colors ${
                    bothSelected
                      ? 'bg-primary text-[var(--tf-primary-text)] hover:bg-primary/90'
                      : 'cursor-not-allowed bg-[var(--tf-surface-alt)] text-[var(--tf-text-muted)]'
                  }`}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
