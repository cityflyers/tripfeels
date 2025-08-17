'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { 
  Home,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  Briefcase,
  Building2,
  Shield,
  Plane,
  FileText,
  Car,
  UserCog,
  Users,
  Menu,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  ListChecks,
  Loader,
  CheckCircle,
  XCircle,
  HelpCircle,
  CalendarX2,
  ListChecksIcon,
  Store,
  Newspaper,
  Pencil,
  VolumeIcon,
  ListTodo,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserRole, roleDisplayNames } from '@/lib/types';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import HomeIcon from '@geist-ui/icons/home';
import StoreIcon from '@geist-ui/icons/package';
import PlaneIcon from '@geist-ui/icons/send';
import BuildingIcon from '@geist-ui/icons/grid';
import CalendarIcon from '@geist-ui/icons/calendar';
import CarIcon from '@geist-ui/icons/truck';
import FileIcon from '@geist-ui/icons/file';
import ShieldIcon from '@geist-ui/icons/shield';
import BookIcon from '@geist-ui/icons/book';
import ActivityIcon from '@geist-ui/icons/activity';
import EditIcon from '@geist-ui/icons/edit';
import { Skeleton } from '@/components/ui/skeleton';

const navigation = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'User Management',
    icon: Users,
    children: [
      { title: 'All Users', href: '/dashboard/user-management', icon: Users },
      { title: 'Super Admin', href: '/dashboard/super-admin', icon: Users },
      { title: 'Account Admin', href: '/dashboard/account-admin', icon: Building2 },
      { title: 'Support Admin', href: '/dashboard/support-admin', icon: Shield },
      { title: 'User Admin', href: '/dashboard/user-admin', icon: UserCog },
      { title: 'Agent', href: '/dashboard/agent', icon: Briefcase },
      { title: 'Tour Organizer', href: '/dashboard/tour-organizer', icon: Plane },
      { title: 'Visa Organizer', href: '/dashboard/visa-organizer', icon: FileText },
      { title: 'Insurance Organizer', href: '/dashboard/insurance-organizer', icon: Shield },
      { title: 'Car Admin', href: '/dashboard/car-admin', icon: Car },
    ],
  },
];

const bookingRoutes = [
  {
    title: 'On hold',
    href: '/dashboard/booking/on-hold',
    icon: Clock
  },
  {
    title: 'Queue',
    href: '/dashboard/booking/queue',
    icon: ListTodo
  },
  {
    title: 'Ongoing',
    href: '/dashboard/booking/ongoing',
    icon: Activity
  },
  {
    title: 'Confirmed',
    href: '/dashboard/booking/confirmed',
    icon: CheckCircle
  },
  {
    title: 'Expired',
    href: '/dashboard/booking/expired',
    icon: CalendarX2
  },
  {
    title: 'Cancelled',
    href: '/dashboard/booking/cancelled',
    icon: XCircle
  },
  {
    title: 'Unresolved',
    href: '/dashboard/booking/unresolved',
    icon: AlertCircle
  }
];

export function SidebarContent({ onNavigate, isMobile = false, loading = false }: { onNavigate?: () => void, isMobile?: boolean, loading?: boolean }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(isMobile ? false : true);
  const [servicesOpen, setServicesOpen] = useState(false);

  if (loading) {
    return (
      <div className={cn("flex h-full flex-col border-r bg-background transition-all duration-300 w-20")}> 
        <div className="flex h-14 items-center border-b px-4 justify-center">
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-2 p-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    // Public sidebar
    return (
      <div className={cn("flex h-full flex-col border-r bg-background transition-all duration-300", collapsed ? "w-20" : "w-64")}> 
        {/* Logo & Toggle Section */}
        <div className="flex h-14 items-center border-b px-4 justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center" onClick={onNavigate}>
              <span className={cn("text-md font-semibold transition-all", collapsed && "hidden")}
                style={{ fontFamily: 'NordiquePro-Semibold, sans-serif' }}>
                AppDashboard
              </span>
              {!collapsed && <span className="sr-only">AppDashboard</span>}
            </Link>
          </div>
          {/* Collapse/Expand Toggle (desktop only) */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          )}
        </div>
        {/* Public Links */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
            pathname === '/' && 'bg-accent text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={onNavigate}
        >
          <HomeIcon size={18} />
          <span className={!collapsed ? undefined : 'hidden'}>Home</span>
        </Link>
        {/* Services expandable */}
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={() => setServicesOpen((open) => !open)}
        >
          <StoreIcon size={18} />
          <span className={!collapsed ? undefined : 'hidden'}>Services</span>
          {!collapsed && <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', servicesOpen && 'rotate-180')} />}
        </button>
        {/* Services submenu */}
        {servicesOpen && !collapsed && (
          <div className="ml-6 mt-1 space-y-1">
            <Link href="/services/flights" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" onClick={onNavigate}>
              <PlaneIcon size={18} />
              <span>Flights</span>
            </Link>
            <Link href="/services/hotels" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" onClick={onNavigate}>
              <BuildingIcon size={18} />
              <span>Hotels</span>
            </Link>
            <Link href="/services/holidays" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" onClick={onNavigate}>
              <CalendarIcon size={18} />
              <span>Holidays</span>
            </Link>
            <Link href="/services/cars" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" onClick={onNavigate}>
              <CarIcon size={18} />
              <span>Cars</span>
            </Link>
            <Link href="/services/events" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" onClick={onNavigate}>
              <CalendarIcon size={18} />
              <span>Events</span>
            </Link>
            <Link href="/services/visa" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" onClick={onNavigate}>
              <FileIcon size={18} />
              <span>Visa</span>
            </Link>
            <Link href="/services/travel-insurance" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" onClick={onNavigate}>
              <ShieldIcon size={18} />
              <span>Travel Insurance</span>
            </Link>
          </div>
        )}
        <Link
          href="/travel-advisory"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
            pathname === '/travel-advisory' && 'bg-accent text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={onNavigate}
        >
          <BookIcon size={18} />
          <span className={!collapsed ? undefined : 'hidden'}>Travel Advisory</span>
        </Link>
        <Link
          href="/news"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
            pathname === '/news' && 'bg-accent text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={onNavigate}
        >
          <ActivityIcon size={18} />
          <span className={!collapsed ? undefined : 'hidden'}>News</span>
        </Link>
        <Link
          href="/blog"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
            pathname === '/blog' && 'bg-accent text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={onNavigate}
        >
          <EditIcon size={18} />
          <span className={!collapsed ? undefined : 'hidden'}>Blog</span>
        </Link>
        <Link
          href="/promotions"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
            pathname === '/promotions' && 'bg-accent text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={onNavigate}
        >
          <VolumeIcon size={18} />
          <span className={!collapsed ? undefined : 'hidden'}>Promotions</span>
        </Link>
        <div className={cn('mt-auto p-4', collapsed && 'hidden')}> 
          <p className="text-xs text-muted-foreground">Welcome! Please sign in to access more features.</p>
        </div>
      </div>
    );
  }

  // Only show User Management for SUPER_ADMIN, ACCOUNT_ADMIN, SUPPORT_ADMIN
  const canSeeUserManagement = ['SUPER_ADMIN', 'ACCOUNT_ADMIN', 'SUPPORT_ADMIN'].includes(user.role);

  return (
    <div className={cn("flex h-full flex-col border-r bg-background transition-all duration-300", collapsed ? "w-20" : "w-64")}> 
      {/* Logo & Toggle Section */}
      <div className="flex h-14 items-center border-b px-4 justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center" onClick={onNavigate}>
            <span className={cn("text-md font-semibold transition-all", collapsed && "hidden")}
              style={{ fontFamily: 'NordiquePro-Semibold, sans-serif' }}>
              AppDashboard
            </span>
            {!collapsed && <span className="sr-only">AppDashboard</span>}
          </Link>
        </div>
        {/* Collapse/Expand Toggle (desktop only) */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {/* Dashboard Item */}
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
            pathname === '/dashboard' && 'bg-accent text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={onNavigate}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className={!collapsed ? undefined : 'hidden'}>Dashboard</span>
        </Link>
        {/* Booking Item */}
        <Link
          href="/dashboard/booking"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
            pathname.startsWith('/dashboard/booking') && 'bg-accent text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={onNavigate}
        >
          <BookOpen size={18} />
          <span className={!collapsed ? undefined : 'hidden'}>Bookings</span>
        </Link>
        {/* User Management Item (only for allowed roles) */}
        {canSeeUserManagement && (
          <>
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground mt-1',
                (pathname.startsWith('/dashboard/user-management') ||
                  pathname.startsWith('/dashboard/user-admin') ||
                  pathname.startsWith('/dashboard/account-admin') ||
                  pathname.startsWith('/dashboard/support-admin') ||
                  pathname.startsWith('/dashboard/agent') ||
                  pathname.startsWith('/dashboard/tour-organizer') ||
                  pathname.startsWith('/dashboard/visa-organizer') ||
                  pathname.startsWith('/dashboard/insurance-organizer') ||
                  pathname.startsWith('/dashboard/car-admin')) && 'bg-accent text-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
              onClick={() => setUserMgmtOpen((open) => !open)}
            >
              <Users className="h-4 w-4" />
              <span className={!collapsed ? undefined : 'hidden'}>User Management</span>
              {!collapsed && <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', userMgmtOpen && 'rotate-180')} />}
            </button>
            {/* User Management submenu */}
            {userMgmtOpen && !collapsed && (
              <div className="ml-6 mt-1 space-y-1">
                {navigation[1].children?.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                      pathname === item.href && 'bg-accent text-accent-foreground'
                    )}
                    onClick={onNavigate}
                  >
                    {item.icon && <item.icon size={18} />}
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
        {/* Markup Item (only for SUPER_ADMIN or ACCOUNT_ADMIN) */}
        {['SUPER_ADMIN', 'ACCOUNT_ADMIN'].includes(user.role) && (
          <Link
            href="/dashboard/markup"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground mt-1',
              pathname === '/dashboard/markup' && 'bg-accent text-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
            onClick={onNavigate}
          >
            <Plane className="h-4 w-4" />
            <span className={!collapsed ? undefined : 'hidden'}>Markup</span>
          </Link>
        )}
        {/* Profile Item */}
        <Link
          href="/dashboard/profile"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
            pathname === '/dashboard/profile' && 'bg-accent text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
          onClick={onNavigate}
        >
          <UserCog className="h-4 w-4" />
          <span className={!collapsed ? undefined : 'hidden'}>Profile</span>
        </Link>
      </div>
      <div className={cn("border-t p-4 transition-all", collapsed && "p-2")}> 
        <div className={cn("flex items-center gap-3 mb-3", collapsed && "justify-center mb-1")}> 
          <Avatar>
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback>
              {user.displayName?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium">{user.displayName || user.email}</p>
              <p className="text-xs text-muted-foreground">{roleDisplayNames[user.role as UserRole]}</p>
            </div>
          )}
        </div>
        <div className={cn("flex gap-2", collapsed && "flex-col items-center gap-1")}> 
          <Button
            variant="outline"
            size="sm"
            className={cn("flex-1", collapsed && "w-10 p-0 justify-center")}
            asChild
          >
            <Link href="/settings" onClick={onNavigate}>
              <Settings className="h-4 w-4 mr-2" />
              {!collapsed && "Settings"}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn("flex-1", collapsed && "w-10 p-0 justify-center")}
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && "Logout"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, setMobileOpen, loading = false }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void, loading?: boolean }) {
  // Show Sheet on mobile, fixed sidebar on md+
  return (
    <>
      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent isMobile onNavigate={() => setMobileOpen && setMobileOpen(false)} loading={loading} />
          </SheetContent>
        </Sheet>
      </div>
      {/* Desktop: Fixed sidebar */}
      <div className="hidden md:flex">
        <SidebarContent loading={loading} />
      </div>
    </>
  );
}