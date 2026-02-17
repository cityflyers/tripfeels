'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'

interface TicketStatusTab {
  label: string
  value: string
}

interface TicketStatusTabsProps {
  className?: string
  activeTab: string
  onTabChange: (value: string) => void
}

const TICKET_STATUS_TABS: TicketStatusTab[] = [
  { label: 'All', value: 'all' },
  { label: 'On Hold', value: 'on-hold' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Expired', value: 'expired' },
  { label: 'Un-Confirmed', value: 'unconfirmed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function TicketStatusTabs({ className, activeTab, onTabChange }: TicketStatusTabsProps) {
  return (
    <div
      className={cn(
        'w-full border-b border-[var(--tf-divider)] bg-[var(--tf-header-bg)] backdrop-blur-sm',
        className,
      )}
      role="tablist"
      aria-label="Ticket status navigation"
    >
      <div className="hidden md:grid md:grid-cols-8 md:gap-0">
        {TICKET_STATUS_TABS.map((item) => (
          <Link
            key={item.value}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onTabChange(item.value)
            }}
            aria-label={`Filter by ${item.label}`}
            role="tab"
            aria-selected={activeTab === item.value}
            className={cn(
              'flex items-center justify-center py-2 text-xs font-medium transition-all duration-200',
              activeTab === item.value
                ? 'text-[var(--tf-primary)] border-b-2 border-primary bg-primary/16'
                : 'text-[var(--tf-text-secondary)] hover:text-[var(--tf-text-primary)] hover:bg-[var(--tf-nav-hover)]/30',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      
      {/* Mobile horizontal scrolling */}
      <div className="md:hidden flex overflow-x-auto">
        {TICKET_STATUS_TABS.map((item) => (
          <Link
            key={item.value}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onTabChange(item.value)
            }}
            aria-label={`Filter by ${item.label}`}
            role="tab"
            aria-selected={activeTab === item.value}
            className={cn(
              'flex-shrink-0 px-3 py-2 text-xs font-medium transition-all duration-200 whitespace-nowrap',
              activeTab === item.value
                ? 'text-[var(--tf-primary)] border-b-2 border-primary bg-primary/16'
                : 'text-[var(--tf-text-secondary)] hover:text-[var(--tf-text-primary)] hover:bg-[var(--tf-nav-hover)]/30',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
