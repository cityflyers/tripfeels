'use client'

import { LogOut, Menu, ChevronDown, UserCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTheme as useThemeContext } from '@/context/theme-context'
import { animations } from '@/lib/design-tokens'
import { useDynamicThemeColors } from '@/lib/dynamic-theme-colors'
import { cn } from '@/lib/utils'
// NAVIGATION_ITEMS removed - not used here

interface HeaderProps {
  className?: string
  showNavigation?: boolean
  showUserActions?: boolean
  onMobileMenuToggle?: () => void
}

export function Header({
  className,
  showNavigation: _showNavigation = true,
  showUserActions = true,
  onMobileMenuToggle,
}: HeaderProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { logoType, textLogo, logoImage } = useThemeContext()
  const themeColors = useDynamicThemeColors()

  // State for dropdown visibility
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)

  const userRole = (session?.user as { role?: string } | undefined)?.role
  const signOutCallbackUrl = useMemo(() => {
    const qs = searchParams.toString()
    const currentPath = `${pathname}${qs ? `?${qs}` : ''}`
    return `/auth?callbackUrl=${encodeURIComponent(currentPath)}`
  }, [pathname, searchParams])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 h-14 backdrop-blur-md border-b shadow-lg',
        'bg-[var(--tf-header-bg)]',
        'border-[var(--tf-divider)]',
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 h-full w-full">
        {/* Left Side - Mobile Menu + Logo */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-[var(--tf-text-secondary)] hover:text-[var(--tf-text-primary)] hover:bg-[var(--tf-nav-hover)]/45 border border-[var(--tf-border)]/80 bg-[var(--tf-surface-alt)]/20 backdrop-blur-sm rounded-lg"
            onClick={onMobileMenuToggle}
            aria-label="Open mobile menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Logo Section */}
          <Link
            href="/"
            className={cn('text-lg font-semibold font-logo text-primary', animations.transition)}
          >
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
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* User Actions */}
          {showUserActions && status === 'loading' ? (
            <div className="h-8 w-8 bg-[var(--tf-surface-alt)]/35 rounded-full animate-pulse"></div>
          ) : showUserActions && session?.user ? (
            <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-[var(--tf-nav-hover)]/45 border border-[var(--tf-border)]/80 bg-[var(--tf-surface-alt)]/20 backdrop-blur-sm rounded-lg"
                  aria-label={`${isUserDropdownOpen ? 'Close' : 'Open'} user menu`}
                  aria-expanded={isUserDropdownOpen}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[var(--tf-primary-text)] border border-[var(--tf-border)]/40',
                      themeColors.primary,
                    )}
                  >
                    <span className="text-xs font-medium">
                      {session.user.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'U'}
                    </span>
                  </div>
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={10}
                className="tf-popup-surface w-64 p-0 rounded-xl border border-[var(--tf-border)] shadow-xl"
              >
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-[var(--tf-border)]">
                    <p className="text-sm font-semibold text-[var(--tf-text-primary)] truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-[var(--tf-text-secondary)]">{userRole}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false)
                      void signOut({ callbackUrl: signOutCallbackUrl })
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-[var(--tf-text-secondary)] hover:bg-primary/12 hover:text-[var(--tf-text-primary)] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            /* Auth Buttons for non-authenticated users */
            <div className="flex items-center space-x-2">
              {/* Desktop: Show individual buttons */}
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[var(--tf-surface-alt)]/22 backdrop-blur-sm border border-[var(--tf-border)]/80 text-[var(--tf-text-primary)] hover:bg-[var(--tf-nav-hover)]/45 rounded-lg"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[var(--tf-surface-alt)]/22 backdrop-blur-sm border border-[var(--tf-border)]/80 text-[var(--tf-text-primary)] hover:bg-[var(--tf-nav-hover)]/45 rounded-lg"
                  >
                    Registration
                  </Button>
                </Link>
              </div>

              {/* Mobile: Show dropdown */}
              <Popover open={isMobileDropdownOpen} onOpenChange={setIsMobileDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden flex items-center gap-1 hover:bg-[var(--tf-nav-hover)]/45 border border-[var(--tf-border)]/80 bg-[var(--tf-surface-alt)]/20 backdrop-blur-sm rounded-lg"
                    aria-label={`${isMobileDropdownOpen ? 'Close' : 'Open'} authentication menu`}
                    aria-expanded={isMobileDropdownOpen}
                  >
                    <UserCircle className="h-4 w-4 text-[var(--tf-text-primary)]" />
                    <ChevronDown className="h-3 w-3 text-[var(--tf-text-primary)]" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  align="end"
                  sideOffset={10}
                  className="tf-popup-surface w-52 p-1 rounded-xl border border-[var(--tf-border)] shadow-xl"
                >
                  <Link
                    href="/auth"
                    className="block px-3 py-2 text-sm rounded-md text-[var(--tf-text-secondary)] hover:bg-primary/12 hover:text-[var(--tf-text-primary)] transition-colors"
                    onClick={() => setIsMobileDropdownOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth"
                    className="block px-3 py-2 text-sm rounded-md text-[var(--tf-text-secondary)] hover:bg-primary/12 hover:text-[var(--tf-text-primary)] transition-colors"
                    onClick={() => setIsMobileDropdownOpen(false)}
                  >
                    Registration
                  </Link>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
