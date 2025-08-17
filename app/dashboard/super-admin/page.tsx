'use client';

import { useEffect, useState } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole, roleDisplayNames, User } from '@/lib/types';
import { Loader2, Users, Activity, BarChart3, UserPlus, UserX, UserCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, getDocs, query, orderBy, limit, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';
import RoleUserList from '@/components/dashboard/RoleUserList';
import { Skeleton } from '@/components/ui/skeleton';

// Sample data for charts
const userSignupData = [
  { name: 'Jan', count: 120 },
  { name: 'Feb', count: 140 },
  { name: 'Mar', count: 180 },
  { name: 'Apr', count: 160 },
  { name: 'May', count: 210 },
  { name: 'Jun', count: 240 },
  { name: 'Jul', count: 280 },
  { name: 'Aug', count: 260 },
  { name: 'Sep', count: 300 },
  { name: 'Oct', count: 340 },
  { name: 'Nov', count: 380 },
  { name: 'Dec', count: 420 },
];

const roleDistributionData = [
  { name: 'User Admin', value: 80 },
  { name: 'Agent', value: 45 },
  { name: 'Tour Organizer', value: 30 },
  { name: 'Account Admin', value: 15 },
  { name: 'Car Admin', value: 20 },
  { name: 'Visa Organizer', value: 25 },
  { name: 'Insurance Admin', value: 18 },
  { name: 'Support Admin', value: 10 },
  { name: 'Super Admin', value: 5 },
];

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FF6B6B', '#6A6AFF', '#FFD700'
];

const roles = [
  'SUPER_ADMIN',
  'ACCOUNT_ADMIN',
  'SUPPORT_ADMIN',
  'AGENT',
  'TOUR_ORGANIZER_ADMIN',
  'VISA_ORGANIZER_ADMIN',
  'INSURRANCE_ORGANIZER_ADMIN',
  'CAR_ADMIN',
  'USER_ADMIN',
];

export default function SuperAdminDashboard() {
  const { hasAccess, loading: roleLoading } = useRoleGuard({
    allowedRoles: ['SUPER_ADMIN'],
  });
  
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setUserLoading(true);
        
        // Fetch recent users
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          ...doc.data() as User,
          // Convert Firebase timestamps to Date objects
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastLogin: doc.data().lastLogin?.toDate(),
        }));
        
        setRecentUsers(usersData);
        
        // Fetch total user count
        const allUsersQuery = query(collection(db, 'users'));
        const allUsersSnapshot = await getDocs(allUsersQuery);
        setTotalUsers(allUsersSnapshot.size);
        
        // Fetch active user count
        const activeUsersQuery = query(
          collection(db, 'users'),
          where('status', '==', 'active')
        );
        const activeUsersSnapshot = await getDocs(activeUsersQuery);
        setActiveUsers(activeUsersSnapshot.size);
        
        // Calculate inactive users
        setInactiveUsers(allUsersSnapshot.size - activeUsersSnapshot.size);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setUserLoading(false);
      }
    };
    
    if (hasAccess) {
      fetchDashboardData();
    }
  }, [hasAccess, toast]);
  
  if (roleLoading) {
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userLoading ? <Skeleton className="h-6 w-12" /> : totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered accounts in the system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userLoading ? <Skeleton className="h-6 w-12" /> : activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Users with active status
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userLoading ? <Skeleton className="h-6 w-12" /> : inactiveUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Users with inactive or suspended status
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userLoading ? <Skeleton className="h-6 w-12" /> : recentUsers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              New registrations this week
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Registrations</CardTitle>
              <CardDescription>
                The latest users that have registered in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userLoading ? (
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.photoURL || undefined} />
                              <AvatarFallback>
                                {user.displayName?.charAt(0) || user.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.displayName || user.email.split('@')[0]}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={user.role}
                            onChange={async (e) => {
                              const newRole = e.target.value;
                              try {
                                await updateDoc(doc(db, 'users', user.uid), { role: newRole });
                                toast({
                                  title: 'Role Updated',
                                  description: `Role changed to ${roleDisplayNames[newRole as UserRole] || newRole}`,
                                });
                                // Optionally, update UI immediately
                                setRecentUsers((prev) => prev.map(u => u.uid === user.uid ? { ...u, role: newRole as UserRole } : u));
                              } catch (err: any) {
                                toast({
                                  title: 'Error',
                                  description: err.message || 'Failed to update role',
                                  variant: 'destructive',
                                });
                              }
                            }}
                          >
                            {roles.map(role => (
                              <option key={role} value={role}>{roleDisplayNames[role as UserRole] || role}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Badge className={user.status === 'active' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.createdAt instanceof Date
                            ? user.createdAt.toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">View</Button>
                            <Button variant="outline" size="sm">Edit</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Signups</CardTitle>
                <CardDescription>User registration trend over the past year</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={userSignupData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--chart-1))"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Distribution by Role</CardTitle>
                <CardDescription>Breakdown of users by their assigned roles</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={roleDistributionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Users">
                      {roleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}