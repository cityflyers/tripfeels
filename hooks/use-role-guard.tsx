'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/lib/types';

interface RoleGuardOptions {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function useRoleGuard(options: RoleGuardOptions) {
  const { allowedRoles, redirectTo = '/unauthorized' } = options;
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth is loaded
    if (!loading) {
      // If no user, redirect to login
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check if user has required role
      const hasRequiredRole = allowedRoles.includes(user.role);
      
      // Super admin can access everything
      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      
      if (!hasRequiredRole && !isSuperAdmin) {
        router.push(redirectTo);
      }
    }
  }, [user, loading, allowedRoles, redirectTo, router]);

  return { user, loading, hasAccess: user ? allowedRoles.includes(user.role) || user.role === 'SUPER_ADMIN' : false };
}