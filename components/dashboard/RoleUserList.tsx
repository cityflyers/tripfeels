'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserRole, roleDisplayNames } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import UsersIcon from '@geist-ui/icons/users';
import UserIcon from '@geist-ui/icons/user';
import { useAuth } from '@/context/auth-context';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface RoleUserListProps {
  role?: UserRole;
  roles?: UserRole[];
  showAll?: boolean;
}

export default function RoleUserList({ role, roles, showAll }: RoleUserListProps) {
  const { user } = useAuth();
  if (!user) return null;
  const [users, setUsers] = useState<User[]>([]);
  console.log(users);
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{ displayName: string; email: string; status: string }>({ displayName: '', email: '', status: '' });
  const [editLoading, setEditLoading] = useState(false);
  // Filter/sort/search state
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('name');
  const [search, setSearch] = useState<string>('');

  // Only allow content for SUPER_ADMIN, ACCOUNT_ADMIN, SUPPORT_ADMIN
  const canSeeContent = user && ['SUPER_ADMIN', 'ACCOUNT_ADMIN', 'SUPPORT_ADMIN'].includes(user.role);
  if (!canSeeContent) return null;

  // Build available roles for filter
  const allRoles: UserRole[] = [
    'USER_ADMIN',
  ];
  // If not super admin, remove SUPER_ADMIN from filter
  const filterRoles = user.role === 'SUPER_ADMIN' ? allRoles : allRoles.filter(r => r !== 'SUPER_ADMIN');

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      let q;
      if (showAll) {
        q = user!.role === 'SUPER_ADMIN'
          ? query(collection(db, 'users'))
          : query(collection(db, 'users'), where('role', '!=', 'SUPER_ADMIN'));
      } else if (roles && roles.length > 0) {
        q = query(collection(db, 'users'), where('role', 'in', roles));
      } else if (role) {
        q = query(collection(db, 'users'), where('role', '==', role));
      }
      if (q) {
        const snapshot = await getDocs(q);
        setUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User)));
      }
      setLoading(false);
    }
    fetchUsers();
  }, [role, roles, showAll, user?.role]);

  // Filtering, sorting, searching
  const filteredUsers = users
    .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
    .filter(u =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.displayName || a.email).localeCompare(b.displayName || b.email);
      } else if (sortBy === 'email') {
        return a.email.localeCompare(b.email);
      } else if (sortBy === 'role') {
        return roleDisplayNames[a.role].localeCompare(roleDisplayNames[b.role]);
      }
      return 0;
    });

  // Handle edit form open
  const handleEdit = (user: User) => {
    setEditUser(user);
    setEditForm({
      displayName: user.displayName || '',
      email: user.email,
      status: user.status,
    });
  };

  // Handle edit form submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    await updateDoc(doc(db, 'users', editUser.uid), {
      displayName: editForm.displayName,
      email: editForm.email,
      status: editForm.status,
    });
    setEditLoading(false);
    setEditUser(null);
    // Refresh users
    let q;
    if (showAll) {
      q = query(collection(db, 'users'), where('role', '!=', 'SUPER_ADMIN'));
    } else if (roles && roles.length > 0) {
      q = query(collection(db, 'users'), where('role', 'in', roles));
    } else if (role) {
      q = query(collection(db, 'users'), where('role', '==', role));
    }
    if (q) {
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User)));
    }
  };

  return (
    <Card className="bg-card/80 shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="inline-block w-6 h-6 text-primary" />
          <CardTitle className="text-2xl font-bold">All Users</CardTitle>
        </div>
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
          {/* Role filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-40 justify-between">
                {roleFilter === 'ALL' ? 'All Roles' : roleDisplayNames[roleFilter as UserRole]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setRoleFilter('ALL')}>All Roles</DropdownMenuItem>
              {filterRoles.map(r => (
                <DropdownMenuItem key={r} onClick={() => setRoleFilter(r)}>
                  {roleDisplayNames[r]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Sort filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-32 justify-between">
                {sortBy === 'name' ? 'Sort by Name' : sortBy === 'email' ? 'Sort by Email' : 'Sort by Role'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSortBy('name')}>Sort by Name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('email')}>Sort by Email</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('role')}>Sort by Role</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Search */}
          <Input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-56"
          />
      </div>
      </CardHeader>
      <CardContent className="py-4">
      {loading ? (
        <div className="flex flex-col gap-4 py-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No users found.</div>
      ) : (
        <ul className="space-y-2">
            {filteredUsers.map(user => (
              <li key={user.uid} className="flex items-center gap-2 border rounded-lg bg-muted/50 px-4 py-3">
              <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-foreground">{user.displayName || user.email}</span>
                <span className="text-xs text-muted-foreground">({user.email})</span>
              <span className="ml-2 text-xs text-gray-400">{roleDisplayNames[user.role]}</span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={() => setViewUser(user)}>View</Button>
              <Button size="sm" variant="secondary" onClick={() => handleEdit(user)}>Edit</Button>
            </li>
          ))}
        </ul>
      )}
      </CardContent>
      {/* View Modal */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <UserIcon className="w-5 h-5 mr-2 inline-block" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-2 mt-4">
              <div><span className="font-semibold">Name:</span> {viewUser.displayName || viewUser.email}</div>
              <div><span className="font-semibold">Email:</span> {viewUser.email}</div>
              <div><span className="font-semibold">Role:</span> {roleDisplayNames[viewUser.role]}</div>
              <div><span className="font-semibold">Status:</span> {viewUser.status}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <UserIcon className="w-5 h-5 mr-2 inline-block" />
              Edit User
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  className="w-full border rounded px-2 py-1 mt-1"
                  value={editForm.displayName}
                  onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  className="w-full border rounded px-2 py-1 mt-1"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  className="w-full border rounded px-2 py-1 mt-1"
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 