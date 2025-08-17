'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="flex flex-col items-center text-center max-w-md space-y-6">
        <div className="bg-amber-100 p-3 rounded-full">
          <ShieldAlert className="h-12 w-12 text-amber-600" />
        </div>
        
        <h1 className="text-3xl font-bold">Access Denied</h1>
        
        <p className="text-muted-foreground">
          You don't have permission to access this page. If you believe this is an error, please contact your administrator.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          {user ? (
            <>
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              
              <Button variant="destructive" onClick={logout}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}