'use client';

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sun, Moon, Search, Menu, X, UserCog, Wallet } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";
import { useState } from "react";
import { Skeleton } from '@/components/ui/skeleton';
import BalanceDisplay from "./BalanceDisplay";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Header({ mobileSidebarOpen, setMobileSidebarOpen, loading = false }: { mobileSidebarOpen: boolean, setMobileSidebarOpen: (open: boolean) => void, loading?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { user, logout: userLogout } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 md:px-6 gap-4">
          <Skeleton className="h-8 w-32 rounded-md" />
          <div className="hidden md:flex flex-1 justify-center px-4">
            <Skeleton className="h-9 w-full max-w-md rounded-md" />
          </div>
          <div className="flex md:hidden flex-1 min-w-0">
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full ml-2" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg mr-6">
          <span style={{ fontFamily: 'NordiquePro-Semibold, sans-serif' }}>AppDashboard</span>
        </Link>

        {/* Mobile search icon (in header) */}
        <div className="flex md:hidden flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-muted"
            onClick={() => setShowMobileSearch(true)}
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile search bar overlay (below header) */}
        {showMobileSearch && (
          <div className="fixed top-14 left-0 w-full z-50 bg-background border-b shadow px-4 py-2 flex items-center">
            <Search className="w-5 h-5 mr-2 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
              placeholder="Search flights, hotels, visa services..."
              autoFocus
            />
            <button onClick={() => setShowMobileSearch(false)}>
              <X className="w-5 h-5 ml-2 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Desktop search bar */}
        <div className="hidden md:flex justify-center mx-auto max-w-md flex-1 px-4">
          <div className="relative w-full">
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pr-8 rounded-md border-border"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="mx-2 hidden md:flex">
          <BalanceDisplay />
        </div>

        {/* Mobile: Balance icon with popover, only for allowed roles */}
        {user && ["SUPER_ADMIN", "ACCOUNT_ADMIN"].includes(user.role) && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden ml-2">
                <Wallet className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-2">
              <BalanceDisplay />
            </PopoverContent>
          </Popover>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={userLogout} className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            {/* Desktop: Show buttons */}
            <div className="hidden md:flex gap-2 ml-3">
              <Button variant="default" asChild>
                <Link href="/auth/register">Register</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
            {/* Mobile: Show user icon with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex md:hidden ml-2">
                  <UserCog className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link href="/auth/register">Register</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/auth/login">Sign in</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}