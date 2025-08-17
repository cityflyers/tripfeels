'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getBalance } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRole } from '@/lib/types';

export default function BalanceDisplay() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'ACCOUNT_ADMIN'];

  const handleBalanceClick = async () => {
    if (!user?.token || !allowedRoles.includes(user.role) || hasFetched) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getBalance(user.token);
      if (data && data.response) {
        setBalance(data.response.balance);
        setCurrency(data.response.currency);
        setHasFetched(true);
      } else {
        setError('Invalid balance response');
      }
    } catch (err) {
      setError('Failed to fetch balance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <div 
      className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      onClick={handleBalanceClick}
    >
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance:</span>
      
      {loading ? (
        <Skeleton className="h-4 w-16" />
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : balance !== null ? (
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          {balance.toLocaleString(undefined, {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500">Click to view</span>
      )}
    </div>
  );
} 