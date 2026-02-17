'use client'

import { Clock, FileText, AlertTriangle } from 'lucide-react'

export function NoticeInfo() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--tf-text-primary)] mb-4">
        Notice
      </h3>

      {/* Reporting & Check-in Time */}
      <div className="bg-[var(--tf-warning-light)] rounded-lg p-4 border border-[var(--tf-warning)]">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-[var(--tf-warning)]" />
          <h4 className="font-semibold text-[var(--tf-warning)]">
            Reporting & Check-in Time
          </h4>
        </div>
        <ul className="space-y-2 text-sm text-[var(--tf-text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-warning)] font-bold">•</span>
            <span>Please arrive at the airport at least 3 hours before departure for international flights</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-warning)] font-bold">•</span>
            <span>Check-in counter closes 1 hour before departure</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-warning)] font-bold">•</span>
            <span>Boarding gate closes 30 minutes before departure</span>
          </li>
        </ul>
      </div>

      {/* Required Travel Documents */}
      <div className="bg-[var(--tf-info-light)] rounded-lg p-4 border border-[var(--tf-info)]">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-[var(--tf-info)]" />
          <h4 className="font-semibold text-[var(--tf-info)]">
            Required Travel Documents
          </h4>
        </div>
        <ul className="space-y-2 text-sm text-[var(--tf-text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-info)] font-bold">•</span>
            <span>Valid passport with minimum 6 months validity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-info)] font-bold">•</span>
            <span>Valid visa (if required)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-info)] font-bold">•</span>
            <span>Printed or digital copy of your e-ticket</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-info)] font-bold">•</span>
            <span>Any required health documents or certificates</span>
          </li>
        </ul>
      </div>

      {/* Prohibited Items */}
      <div className="bg-[var(--tf-danger-light)] rounded-lg p-4 border border-[var(--tf-danger)]">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-[var(--tf-danger)]" />
          <h4 className="font-semibold text-[var(--tf-danger)]">
            Prohibited Items
          </h4>
        </div>
        <ul className="space-y-2 text-sm text-[var(--tf-text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-danger)] font-bold">•</span>
            <span>Weapons and firearms</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-danger)] font-bold">•</span>
            <span>Explosives and flammable items</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-danger)] font-bold">•</span>
            <span>Sharp objects and tools</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-danger)] font-bold">•</span>
            <span>Liquids over 100ml in carry-on baggage</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--tf-danger)] font-bold">•</span>
            <span>Compressed gases and toxic substances</span>
          </li>
        </ul>
      </div>

      {/* Additional Notice */}
      <div className="flex items-start gap-2 p-4 bg-[var(--tf-surface-alt)] rounded-lg border border-[var(--tf-border)]">
        <svg className="w-5 h-5 text-[var(--tf-text-secondary)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm text-[var(--tf-text-secondary)]">
          <p className="font-medium mb-1">Important Information:</p>
          <p>
            Airline policies and restrictions may vary. Please check with the airline for specific requirements and latest updates before your flight.
          </p>
        </div>
      </div>
    </div>
  )
}

