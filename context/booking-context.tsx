'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface BookingInfo {
  source: string;
  traceId: string;
  offerId: string[];
  returnUrl: string;
  timestamp: number;
}

interface BookingContextProps {
  pendingBooking: BookingInfo | null;
  setPendingBooking: (booking: BookingInfo | null) => void;
  clearPendingBooking: () => void;
}

const PENDING_BOOKING_KEY = 'pendingBooking';

const BookingContext = createContext<BookingContextProps | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [pendingBooking, setPendingBooking] = useState<BookingInfo | null>(null);

  // Initialize from sessionStorage on mount
  useEffect(() => {
    const storedBooking = sessionStorage.getItem(PENDING_BOOKING_KEY);
    if (storedBooking) {
      try {
        setPendingBooking(JSON.parse(storedBooking));
      } catch (error) {
        console.error('Error parsing stored booking:', error);
        sessionStorage.removeItem(PENDING_BOOKING_KEY);
      }
    }
  }, []);

  const setBookingWithStorage = (booking: BookingInfo | null) => {
    if (booking) {
      sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(booking));
    } else {
      sessionStorage.removeItem(PENDING_BOOKING_KEY);
    }
    setPendingBooking(booking);
  };

  const clearPendingBooking = () => {
    sessionStorage.removeItem(PENDING_BOOKING_KEY);
    setPendingBooking(null);
  };

  const value = {
    pendingBooking,
    setPendingBooking: setBookingWithStorage,
    clearPendingBooking,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}; 