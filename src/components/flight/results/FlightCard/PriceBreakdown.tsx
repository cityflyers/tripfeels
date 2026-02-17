'use client'

import { formatPrice } from '@/lib/flight/utils/price-formatter'
import type { FlightPricing } from '@/types/flight/domain/flight-offer.types'

interface PriceBreakdownProps {
  pricing: FlightPricing
}

export function PriceBreakdown({ pricing }: PriceBreakdownProps) {
  // Calculate the total from individual amounts (before discount)
  const calculatedTotal = pricing.perPassenger.reduce((sum, pax) => {
    const amountPerPax = (pax.baseFare || 0) + (pax.taxes || 0) + (pax.vat || 0) + (pax.otherFee || 0)
    return sum + (amountPerPax * pax.count)
  }, 0)

  return (
    <div className="space-y-4">

      {/* Price Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[var(--tf-border)]">
              <th className="text-left py-2 px-3 text-xs font-semibold text-[var(--tf-text-secondary)]">
                Passenger Type
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-[var(--tf-text-secondary)]">
                Base Fare
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-[var(--tf-text-secondary)]">
                Tax
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-[var(--tf-text-secondary)]">
                Other
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-[var(--tf-text-secondary)]">
                AIT VAT
              </th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-[var(--tf-text-secondary)]">
                Pax Count
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-[var(--tf-text-secondary)]">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {pricing.perPassenger.map((pax, index) => {
              // Correct formula (ignoring discount): (baseFare + tax + vat + otherFee) * paxCount
              // Add proper null/undefined handling to prevent NaN
              const amountPerPax = (pax.baseFare || 0) + (pax.taxes || 0) + (pax.vat || 0) + (pax.otherFee || 0)
              const totalAmount = amountPerPax * pax.count
              
              return (
                <tr
                  key={index}
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <td className="py-2 px-3 text-sm text-[var(--tf-text-primary)] font-medium">
                    {pax.type}
                  </td>
                  <td className="py-2 px-3 text-right text-sm text-[var(--tf-text-secondary)]">
                    {pax.baseFare.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-sm text-[var(--tf-text-secondary)]">
                    {pax.taxes.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-sm text-[var(--tf-text-secondary)]">
                    {pax.otherFee || 0}
                  </td>
                  <td className="py-2 px-3 text-right text-sm text-[var(--tf-text-secondary)]">
                    {pax.vat || 0}
                  </td>
                  <td className="py-2 px-3 text-center text-sm text-[var(--tf-text-secondary)]">
                    {pax.count}
                  </td>
                  <td className="py-2 px-3 text-right text-sm font-semibold text-[var(--tf-text-primary)]">
                    {formatPrice(totalAmount, pricing.currency)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Total Price */}
      <div className="flex justify-end items-center gap-3 pt-3">
        <span className="text-sm font-semibold text-[var(--tf-text-secondary)]">
          Total Price:
        </span>
        <span className="text-xl font-bold text-[var(--tf-text-primary)]">
          {formatPrice(calculatedTotal, pricing.currency)}
        </span>
      </div>
    </div>
  )
}

