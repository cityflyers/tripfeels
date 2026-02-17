'use client'

import { Briefcase, FileText, Plane, ReceiptText, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { AirlineLogo } from '@/components/flight/shared/AirlineLogo'
import { getAirportCity } from '@/lib/flight/utils/airport-city-lookup'
import { isDomesticBangladeshOffer } from '@/lib/flight/utils/domestic-route'
import { formatDuration } from '@/lib/flight/utils/duration'
import { formatPrice } from '@/lib/flight/utils/price-formatter'
import {
  getFareRulesDisplayContent,
  type FareRulesResponse,
} from '@/types/flight/domain/farerules.types'
import type { FlightOffer } from '@/types/flight/domain/flight-offer.types'

import { BaggageInfo } from './BaggageInfo'
import { FlightSegment } from './FlightSegment'
import { PriceBreakdown } from './PriceBreakdown'

interface TwoOnewayMobileCardProps {
  offer: FlightOffer
  isSelected: boolean
  onRadioClick?: () => void
}

type DetailsKey = 'flight-details' | 'fare-summary' | 'baggage' | 'fare-rules'

export function TwoOnewayMobileCard({
  offer,
  isSelected,
  onRadioClick,
}: TwoOnewayMobileCardProps) {
  const [isFooterExpanded, setIsFooterExpanded] = useState(false)
  const [activePopup, setActivePopup] = useState<DetailsKey | null>(null)

  const [fareRulesData, setFareRulesData] = useState<FareRulesResponse['response']>(null)
  const [fareRulesLoading, setFareRulesLoading] = useState(false)
  const [fareRulesError, setFareRulesError] = useState<string | null>(null)
  const [fareRulesFetched, setFareRulesFetched] = useState(false)

  const fetchFareRules = useCallback(async () => {
    if (fareRulesFetched || fareRulesLoading) return
    setFareRulesLoading(true)
    setFareRulesError(null)
    setFareRulesFetched(true)
    try {
      const response = await fetch('/api/flight/farerules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traceId: offer.traceId, offerId: offer.id }),
      })
      const data = (await response.json()) as FareRulesResponse
      if (data.success && data.response) {
        setFareRulesData(data.response)
      } else {
        setFareRulesError(data.error?.errorMessage || 'Failed to fetch fare rules')
      }
    } catch (err) {
      console.error('Error fetching fare rules:', err)
      setFareRulesError('Failed to fetch fare rules')
    } finally {
      setFareRulesLoading(false)
    }
  }, [offer.traceId, offer.id, fareRulesFetched, fareRulesLoading])

  useEffect(() => {
    if (activePopup === 'fare-rules' && !fareRulesFetched && !fareRulesLoading) {
      void fetchFareRules()
    }
  }, [activePopup, fareRulesFetched, fareRulesLoading, fetchFareRules])

  const group = offer.segments?.[0]
  const firstSeg = group?.segments?.[0]
  const lastSeg = group?.segments?.[group.segments.length - 1]
  if (!group || !firstSeg || !lastSeg) return null

  const hideOperatingCarrier = isDomesticBangladeshOffer(offer)

  const dep = group.departure
  const arr = group.arrival
  const depCity = getAirportCity(dep.airport)
  const arrCity = getAirportCity(arr.airport)

  const label = offer.twoOnewayIndex === 'IB' ? 'Return' : 'Departure'

  const pricing = offer.pricing
  const price = pricing.gross || pricing.total

  const flightNumber = `${firstSeg.airline.code}${firstSeg.flightNumber}`
  const airlineName = offer.validatingCarrier.name

  const isNonStop = group.stops === 0

  const totalMinutes = Math.round(
    (new Date(arr.dateTime).getTime() - new Date(dep.dateTime).getTime()) / (1000 * 60),
  )

  const stopsText = isNonStop ? 'Non-Stop' : `${group.stops} Stop${group.stops > 1 ? 's' : ''}`

  const formatShortDate = (iso: string) => {
    const d = new Date(iso)
    const parts = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      weekday: 'short',
      timeZone: 'UTC',
    }).formatToParts(d)

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''

    // "30 Mar 26, Mon"
    return `${get('day')} ${get('month')} ${get('year')}, ${get('weekday')}`
  }

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(new Date(iso))

  return (
    <div className="p-2.5 bg-[var(--tf-surface)]">
      {/* Header */}
      <div className="space-y-2">
        {/* Row 1: Radio + Flight Number + Fare */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onRadioClick}
              className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0"
              style={{
                borderColor: isSelected ? 'hsl(var(--primary))' : 'rgb(209 213 219)',
                backgroundColor: isSelected ? 'hsl(var(--primary))' : 'transparent',
              }}
              aria-label={isSelected ? 'Selected' : 'Select this flight'}
            >
              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </button>

            <div className="text-[12px] text-[var(--tf-text-muted)] leading-tight truncate">
              {flightNumber}
            </div>
          </div>

          <div className="text-[11px] font-bold text-[var(--tf-text-primary)] flex-shrink-0">
            {formatPrice(price, pricing.currency)}
          </div>
        </div>

        {/* Row 2: Airline Logo + Airline Name */}
        <div className="flex items-center gap-2 min-w-0">
          <AirlineLogo airlineId={offer.validatingCarrier.code} size={22} className="w-6 h-6 flex-shrink-0" />
          <div className="text-[11px] font-semibold text-[var(--tf-text-primary)] leading-tight truncate">
            {airlineName}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-2 pt-2 border-t border-[var(--tf-border)]/55">
        <div className="text-[12px] text-[var(--tf-text-secondary)]">
          <span className="font-semibold text-[var(--tf-text-primary)]">{label}</span>
        </div>

        {/* Vertical flow */}
        <div className="mt-2">
          {/* Departure */}
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-primary truncate">
              {depCity}
            </div>
            <div className="text-[12px] font-bold text-[var(--tf-text-primary)]">
              {formatTime(dep.dateTime)}
            </div>
            <div className="text-[12px] text-[var(--tf-text-secondary)]">
              {formatShortDate(dep.dateTime)}
            </div>
            <div className="text-[12px] font-bold text-[var(--tf-text-muted)]">
              {dep.airport}
            </div>
          </div>

          {/* Stops info */}
          <div className="mt-2 pl-3 relative">
            <div className="absolute bottom-0 left-1 top-0 w-px bg-[var(--tf-border)]" />
            <div className="text-[12px] text-[var(--tf-text-secondary)]">
              {formatDuration(totalMinutes)} • {stopsText}
            </div>
          </div>

          {/* Arrival */}
          <div className="mt-2 space-y-0.5">
            <div className="text-[12px] font-bold text-[var(--tf-text-muted)]">
              {arr.airport}
            </div>
            <div className="text-[12px] text-[var(--tf-text-secondary)]">
              {formatShortDate(arr.dateTime)}
            </div>
            <div className="text-[12px] font-bold text-[var(--tf-text-primary)]">
              {formatTime(arr.dateTime)}
            </div>
            <div className="text-[11px] font-semibold text-primary truncate">
              {arrCity}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: View Details expands list */}
      <div className="mt-2 pt-2 border-t border-[var(--tf-border)]/55">
        <button
          onClick={() => setIsFooterExpanded((v) => !v)}
          className="w-full text-left text-[11px] font-semibold text-[var(--tf-text-primary)] hover:opacity-90 transition-opacity"
          aria-expanded={isFooterExpanded}
        >
          View Details
        </button>

        {isFooterExpanded && (
          <div className="mt-2 overflow-hidden rounded-md border border-[var(--tf-border)]/55 bg-[var(--tf-surface-alt)]/30">
            <button
              onClick={() => {
                setActivePopup('flight-details')
                setIsFooterExpanded(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-[var(--tf-text-secondary)] transition-colors hover:bg-[var(--tf-nav-hover)]/45"
            >
              <Plane className="w-3.5 h-3.5 text-[var(--tf-text-muted)]" />
              Flight Details
            </button>
            <button
              onClick={() => {
                setActivePopup('fare-summary')
                setIsFooterExpanded(false)
              }}
              className="w-full border-t border-[var(--tf-border)]/55 px-3 py-2 text-[11px] font-medium text-[var(--tf-text-secondary)] transition-colors hover:bg-[var(--tf-nav-hover)]/45 flex items-center gap-2"
            >
              <ReceiptText className="w-3.5 h-3.5 text-[var(--tf-text-muted)]" />
              Fare Summary
            </button>
            <button
              onClick={() => {
                setActivePopup('baggage')
                setIsFooterExpanded(false)
              }}
              className="w-full border-t border-[var(--tf-border)]/55 px-3 py-2 text-[11px] font-medium text-[var(--tf-text-secondary)] transition-colors hover:bg-[var(--tf-nav-hover)]/45 flex items-center gap-2"
            >
              <Briefcase className="w-3.5 h-3.5 text-[var(--tf-text-muted)]" />
              Baggage
            </button>
            <button
              onClick={() => {
                setActivePopup('fare-rules')
                setIsFooterExpanded(false)
              }}
              className="w-full border-t border-[var(--tf-border)]/55 px-3 py-2 text-[11px] font-medium text-[var(--tf-text-secondary)] transition-colors hover:bg-[var(--tf-nav-hover)]/45 flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--tf-text-muted)]" />
              Fare Rules
            </button>
          </div>
        )}
      </div>

      {/* Popup: selected content (large view) */}
      {activePopup && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setActivePopup(null)}
          />

          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-auto rounded-t-2xl border-t border-[var(--tf-border)] bg-[var(--tf-surface)] shadow-2xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-[var(--tf-text-primary)]">
                  {activePopup === 'flight-details'
                    ? 'Flight Details'
                    : activePopup === 'fare-summary'
                      ? 'Fare Summary'
                      : activePopup === 'baggage'
                        ? 'Baggage'
                        : 'Fare Rules'}
                </div>
                <button
                  onClick={() => setActivePopup(null)}
                  className="p-2 -m-2 text-[var(--tf-text-muted)] hover:text-[var(--tf-text-primary)] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activePopup === 'flight-details' && (
                <div className="space-y-4">
                  {offer.segments.map((segmentGroup, groupIndex) => {
                    const title = offer.twoOnewayIndex === 'IB' ? 'Return' : 'Outbound'
                    return (
                      <div key={segmentGroup.groupId ?? groupIndex} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-[var(--tf-text-secondary)] pb-1">
                          <Plane className="w-3.5 h-3.5" />
                          <span className="font-semibold">
                            {`${title} ${segmentGroup.departure.airport} ✈ ${segmentGroup.arrival.airport}`}
                          </span>
                        </div>
                        <div className="space-y-0 divide-y divide-[var(--tf-border)]/55 overflow-hidden rounded-lg">
                          {segmentGroup.segments.map((segment, segIndex) => (
                            <FlightSegment
                              key={segIndex}
                              segment={segment}
                              showLayover={segIndex < segmentGroup.segments.length - 1}
                              isFirst={segIndex === 0}
                              isLast={segIndex === segmentGroup.segments.length - 1}
                              hideOperatingCarrier={hideOperatingCarrier}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {activePopup === 'fare-summary' && (
                <div className="p-2">
                  <PriceBreakdown pricing={offer.pricing} />
                </div>
              )}

              {activePopup === 'baggage' && (
                <div className="p-2">
                  <BaggageInfo baggage={offer.baggage} />
                </div>
              )}

              {activePopup === 'fare-rules' && (
                <div className="space-y-4 text-sm text-[var(--tf-text-secondary)]">
                  {fareRulesLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {fareRulesError && !fareRulesLoading && (
                    <p className="text-sm text-[var(--tf-danger)]">{fareRulesError}</p>
                  )}
                  {!fareRulesLoading && !fareRulesError && fareRulesData && (() => {
                    const { items } = getFareRulesDisplayContent(fareRulesData)
                    if (items.length === 0) {
                      return <p className="text-sm text-[var(--tf-text-secondary)]">No fare rules available.</p>
                    }
                    return (
                      <div className="space-y-4">
                        {items.map((item, idx) => (
                          <div key={idx} className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-surface-alt)]/30 p-3">
                            {item.title && (
                              <h4 className="text-sm font-semibold text-[var(--tf-text-primary)] mb-2">{item.title}</h4>
                            )}
                            <pre className="whitespace-pre-wrap text-xs text-[var(--tf-text-secondary)] font-sans">
                              {item.content}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  {!fareRulesLoading && !fareRulesError && !fareRulesData && fareRulesFetched && (
                    <p className="text-sm text-[var(--tf-text-secondary)]">No fare rules available.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



