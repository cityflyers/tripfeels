'use client'

import { Bell, Search, User } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NavbarProps {
  title?: string
}

export function Navbar({ title }: NavbarProps) {
  const { data: session } = useSession()

  return (
    <header className="bg-[var(--tf-header-bg)] border-b border-[var(--tf-border)] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>{title && <h1 className="text-2xl font-semibold text-[var(--tf-text-primary)]">{title}</h1>}</div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--tf-text-muted)] h-4 w-4" />
            <Input placeholder="Search..." className="pl-10 w-64" aria-label="Search" />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-[var(--tf-danger)] text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--tf-text-primary)]">{session?.user?.name}</p>
              <p className="text-xs text-[var(--tf-text-secondary)]">
                {(session?.user as { role?: string } | undefined)?.role}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="User profile">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
