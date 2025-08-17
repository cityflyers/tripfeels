import RoleUserList from '@/components/dashboard/RoleUserList';

export default function UserManagementPage() {
  // Show all users except Super Admins
  return <RoleUserList showAll />;
} 