'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Ticket, RefreshCw, Package } from 'lucide-react';

const bookingTabs = [
  {
    title: 'Ticket',
    href: '/dashboard/booking',
    icon: Ticket
  },
  {
    title: 'Refund',
    href: '/dashboard/booking/refund',
    icon: RefreshCw
  },
  {
    title: 'Ancillary',
    href: '/dashboard/booking/ancillary',
    icon: Package
  }
];

export function BookingTabs() {
  const pathname = usePathname();

  // Handle the default tab (Ticket) when on the main booking page or any of its sub-routes
  const isTicketTab = pathname === '/dashboard/booking' || 
    ['/on-hold', '/queue', '/ongoing', '/confirmed', '/expired', '/cancelled', '/unresolved']
      .some(route => pathname === `/dashboard/booking${route}`);

  return (
    <div className="w-full bg-background">
      <nav className="flex w-full border-b" aria-label="Booking tabs">
        {bookingTabs.map((tab) => {
          const isActive = (tab.title === 'Ticket' && isTicketTab) || pathname === tab.href;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 h-[3.5rem] text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 