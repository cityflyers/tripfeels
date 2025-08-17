import RoleUserList from '@/components/dashboard/RoleUserList';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountAdminPage() {
  return <RoleUserList role="ACCOUNT_ADMIN" />;
} 