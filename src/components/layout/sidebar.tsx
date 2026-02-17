'use client'

import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  BarChart3,
  UserCheck,
  FileText,
  CheckSquare,
  Briefcase,
  TrendingUp,
  DollarSign,
  Map,
  Percent,
  User,
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Palette,
  Plane,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/theme-context'
import { cn } from '@/lib/utils'
import { NAVIGATION_ITEMS } from '@/lib/utils/constants'

const iconMap = {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  BarChart3,
  UserCheck,
  FileText,
  CheckSquare,
  Briefcase,
  TrendingUp,
  DollarSign,
  Map,
  Percent,
  User,
  Home,
  Palette,
  Plane,
}

// Category-based icon color mapping
const getIconColor = (label: string): string => {
  const labelLower = label.toLowerCase()
  
  // Green for primary actions
  if (labelLower.includes('home') || labelLower.includes('dashboard')) {
    return '#10b981' // Green
  }
  
  // Blue for user/people management
  if (labelLower.includes('user') || labelLower.includes('traveller') || labelLower.includes('passenger')) {
    return '#60a5fa' // Blue
  }
  
  // Yellow/Orange for flights/travel
  if (labelLower.includes('flight') || labelLower.includes('trip') || labelLower.includes('ticket')) {
    return '#fbbf24' // Amber
  }
  
  // Purple for settings/configuration
  if (labelLower.includes('setting') || labelLower.includes('config')) {
    return '#a78bfa' // Purple
  }
  
  // Red for security/protection
  if (labelLower.includes('security') || labelLower.includes('protection')) {
    return '#ef4444' // Red
  }
  
  // Cyan for analytics/reporting
  if (labelLower.includes('analytics') || labelLower.includes('report') || labelLower.includes('chart') || labelLower.includes('trending')) {
    return '#06b6d4' // Cyan
  }
  
  // Default green
  return '#10b981'
}

interface SidebarProps {
  className?: string
  isMobile?: boolean
  onClose?: () => void
  onCollapseChange?: (isCollapsed: boolean) => void
}

export function Sidebar({ className, isMobile = false, onClose, onCollapseChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const { data: session } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { logoType, textLogo, logoImage } = useTheme()

  // On mobile, always show expanded sidebar with text
  const shouldShowText = isMobile || !isCollapsed

  // Always show sidebar with fallback navigation
  const userRole = (session?.user as { role?: string } | undefined)?.role
  const navigationItems = userRole
    ? NAVIGATION_ITEMS[userRole as keyof typeof NAVIGATION_ITEMS] || []
    : [
        { label: 'Home', href: '/', icon: 'Home' },
        { label: 'Privacy Policy', href: '/privacy', icon: 'Shield' },
        { label: 'Terms & Conditions', href: '/terms', icon: 'FileText' },
      ]

  return (
    <div
      className={cn(
        'flex flex-col border-r border-[var(--tf-divider)] bg-[var(--tf-sidebar-bg)] shadow-[8px_0_24px_rgba(0,0,0,0.28)] transition-all duration-300 h-full',
        isMobile ? 'w-64' : isCollapsed ? 'w-20' : 'w-64',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {shouldShowText && (
          <h2 className="text-xl font-bold font-logo text-primary">
            {logoType === 'image' && logoImage ? (
              <Image
                src={logoImage}
                alt="Logo"
                width={64}
                height={28}
                className="object-contain h-7 w-16"
                priority
              />
            ) : (
              textLogo
            )}
          </h2>
        )}
        <div className={cn('flex', shouldShowText ? 'justify-end' : 'justify-center w-full')}>
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 font-bold hover:bg-[var(--tf-nav-hover)] border border-[var(--tf-divider)] bg-[var(--tf-surface)] rounded-lg"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="h-4 w-4 font-bold text-primary" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newCollapsed = !isCollapsed
                setIsCollapsed(newCollapsed)
                onCollapseChange?.(newCollapsed)
              }}
              className="h-8 w-8 font-bold hover:bg-[var(--tf-nav-hover)] border border-[var(--tf-divider)] bg-[var(--tf-surface)] rounded-lg"
              aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar`}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 font-bold text-primary" />
              ) : (
                <ChevronLeft className="h-4 w-4 font-bold text-primary" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-[var(--tf-divider)]"></div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap]
          const isActive = pathname === item.href
          const iconColor = getIconColor(item.label)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile && onClose) onClose()
              }}
              aria-label={item.label}
              title={item.label}
              className={cn(
                'group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--tf-surface-alt)] text-[var(--tf-text-primary)] border border-[var(--tf-border-strong)]'
                  : 'text-[var(--tf-text-secondary)] hover:bg-[var(--tf-surface)] hover:text-[var(--tf-text-primary)]',
              )}
            >
              <Icon
                className="h-5 w-5 flex-shrink-0 transition-colors duration-200"
                style={{ color: isActive ? iconColor : iconColor }}
                aria-hidden="true"
              />
              {shouldShowText && <span>{item.label}</span>}
              {!shouldShowText && <span className="sr-only">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="border-b border-[var(--tf-divider)]"></div>

      {/* User Profile & Sign Out */}
      <div className="p-4">
        {shouldShowText && session?.user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-[var(--tf-text-primary)]">
              {session.user.name}
            </p>
            <p className="text-xs text-[var(--tf-text-secondary)]">{userRole}</p>
          </div>
        )}
        {session?.user ? (
          <Button
            variant="ghost"
            size={shouldShowText ? 'sm' : 'icon'}
            onClick={() => {
              if (isMobile && onClose) onClose()
              const qs = searchParams.toString()
              const currentPath = `${pathname}${qs ? `?${qs}` : ''}`
              const callbackUrl = `/auth?callbackUrl=${encodeURIComponent(currentPath)}`
              void signOut({ callbackUrl })
            }}
            className="w-full justify-start px-3 py-2 hover:bg-[var(--tf-nav-hover)] border border-[var(--tf-divider)] bg-[var(--tf-surface)] rounded-lg text-[var(--tf-text-secondary)] hover:text-[var(--tf-text-primary)] group"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-primary/70 group-hover:text-primary" />
            {shouldShowText && <span className="ml-3">Sign Out</span>}
          </Button>
        ) : (
          <Link
            href="/auth"
            onClick={() => {
              if (isMobile && onClose) onClose()
            }}
          >
            <Button
              variant="ghost"
              size={shouldShowText ? 'sm' : 'icon'}
              className="w-full justify-start px-3 py-2 hover:bg-[var(--tf-nav-hover)] border border-[var(--tf-divider)] bg-[var(--tf-surface)] rounded-lg text-[var(--tf-text-secondary)] hover:text-[var(--tf-text-primary)] group"
              aria-label="Sign in"
            >
              <User className="h-5 w-5 flex-shrink-0 text-primary/70 group-hover:text-primary" />
              {shouldShowText && <span className="ml-3">Sign In</span>}
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
