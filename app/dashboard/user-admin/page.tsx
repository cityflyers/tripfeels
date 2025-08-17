'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, UserCheck } from 'lucide-react';
import RoleUserList from '@/components/dashboard/RoleUserList';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserAdminPage() {
  const { hasAccess, loading, user } = useRoleGuard({
    allowedRoles: ['USER_ADMIN', 'SUPPORT_ADMIN', 'ACCOUNT_ADMIN'],
  });

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Unauthorized Access</h1>
        <p className="text-muted-foreground">
          You do not have permission to access this dashboard.
        </p>
      </div>
    );
  }

  return <RoleUserList role="USER_ADMIN" />;
}