'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/auth-context';
import { BookingProvider } from '@/context/booking-context';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <BookingProvider>
          {children}
          <Toaster />
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}