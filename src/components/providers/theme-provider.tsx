'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isLoaded: boolean
}

const initialState: ThemeProviderState = {
  theme: 'dark',
  setTheme: () => null,
  isLoaded: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'tripfeels-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add('dark')
  }, [theme])

  const value = {
    theme,
    setTheme: () => {
      localStorage.setItem(storageKey, 'dark')
      setTheme('dark')
    },
    isLoaded,
  }

  useEffect(() => {
    setTheme('dark')
    localStorage.setItem(storageKey, 'dark')
    setIsLoaded(true)
  }, [storageKey])

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
