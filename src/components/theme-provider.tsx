'use client'

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

import { getTheme, subscribeTheme } from '@/lib/firebase/theme'
import {
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_TOKENS,
  ThemeMode,
  ThemeTokenKey,
  ThemeTokens,
  hexToHslChannels,
  sanitizeThemeMode,
  sanitizeThemeTokens,
} from '@/lib/theme-tokens'

type ThemeStorageState = {
  mode: ThemeMode
  tokens: ThemeTokens
}

export type ThemeContextValue = {
  mode: ThemeMode
  tokens: ThemeTokens
  setMode: (mode: ThemeMode) => void
  setToken: (key: ThemeTokenKey, value: string) => void
  setTokens: (tokens: Partial<ThemeTokens>) => void
  resetTokens: () => void
}

const ThemeSystemContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'tripfeels-theme-tokens-v1'

function applyTokensToRoot(_mode: ThemeMode, tokens: ThemeTokens) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add('dark')

  // Hex tokens (direct usage in utility classes)
  root.style.setProperty('--tf-page-bg', tokens.pageBg)
  root.style.setProperty('--tf-app-bg', tokens.appBg)
  root.style.setProperty('--tf-component-bg', tokens.componentBg)
  root.style.setProperty('--tf-surface', tokens.surface)
  root.style.setProperty('--tf-surface-alt', tokens.surfaceAlt)
  root.style.setProperty('--tf-input-fill', tokens.inputFill)
  root.style.setProperty('--tf-text-primary', tokens.textPrimary)
  root.style.setProperty('--tf-text-secondary', tokens.textSecondary)
  root.style.setProperty('--tf-text-muted', tokens.textMuted)
  root.style.setProperty('--tf-border', tokens.border)
  root.style.setProperty('--tf-divider', tokens.divider)
  root.style.setProperty('--tf-primary', tokens.primary)
  root.style.setProperty('--tf-primary-hover', tokens.primaryHover)
  root.style.setProperty('--tf-primary-text', tokens.primaryText)
  root.style.setProperty('--tf-ring', tokens.ring)
  root.style.setProperty('--tf-success', tokens.success)
  root.style.setProperty('--tf-warning', tokens.warning)
  root.style.setProperty('--tf-danger', tokens.danger)
  root.style.setProperty('--tf-info', tokens.info)
  root.style.setProperty('--tf-header-bg', tokens.headerBg)
  root.style.setProperty('--tf-sidebar-bg', tokens.sidebarBg)
  root.style.setProperty('--tf-footer-bg', tokens.footerBg)
  root.style.setProperty('--tf-nav-hover', tokens.navHover)

  // HSL channels (Tailwind semantic palette)
  root.style.setProperty('--background', hexToHslChannels(tokens.appBg))
  root.style.setProperty('--foreground', hexToHslChannels(tokens.textPrimary))
  root.style.setProperty('--card', hexToHslChannels(tokens.surface))
  root.style.setProperty('--card-foreground', hexToHslChannels(tokens.textPrimary))
  root.style.setProperty('--popover', hexToHslChannels(tokens.surface))
  root.style.setProperty('--popover-foreground', hexToHslChannels(tokens.textPrimary))
  root.style.setProperty('--primary', hexToHslChannels(tokens.primary))
  root.style.setProperty('--primary-foreground', hexToHslChannels(tokens.primaryText))
  root.style.setProperty('--secondary', hexToHslChannels(tokens.surfaceAlt))
  root.style.setProperty('--secondary-foreground', hexToHslChannels(tokens.textPrimary))
  root.style.setProperty('--muted', hexToHslChannels(tokens.surfaceAlt))
  root.style.setProperty('--muted-foreground', hexToHslChannels(tokens.textMuted))
  root.style.setProperty('--accent', hexToHslChannels(tokens.surfaceAlt))
  root.style.setProperty('--accent-foreground', hexToHslChannels(tokens.textPrimary))
  root.style.setProperty('--destructive', hexToHslChannels(tokens.danger))
  root.style.setProperty('--destructive-foreground', hexToHslChannels(tokens.textPrimary))
  root.style.setProperty('--border', hexToHslChannels(tokens.border))
  root.style.setProperty('--input', hexToHslChannels(tokens.border))
  root.style.setProperty('--ring', hexToHslChannels(tokens.ring))
}

export function ThemeSystemProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokensState] = useState<ThemeTokens>(DEFAULT_THEME_TOKENS)
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ThemeStorageState>
        setModeState(sanitizeThemeMode(parsed.mode))
        setTokensState(sanitizeThemeTokens(parsed.tokens))
      }
    } catch (e) {
      void e
    }
  }, [])

  useEffect(() => {
    let unsub: (() => void) | undefined
    void (async () => {
      try {
        const remote = await getTheme()
        if (remote) {
          setModeState(sanitizeThemeMode(remote.mode))
          setTokensState((prev) => sanitizeThemeTokens({ ...prev, ...(remote.tokens ?? {}) }))
        }
      } catch (e) {
        void e
      }

      unsub = subscribeTheme((doc) => {
        if (!doc) return
        setModeState(sanitizeThemeMode(doc.mode))
        setTokensState((prev) => sanitizeThemeTokens({ ...prev, ...(doc.tokens ?? {}) }))
      })
    })()
    return () => {
      if (unsub) unsub()
    }
  }, [])

  useEffect(() => {
    try {
      const payload: ThemeStorageState = { mode, tokens }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (e) {
      void e
    }

    applyTokensToRoot(mode, tokens)
  }, [mode, tokens])

  const setMode = (_nextMode: ThemeMode) => setModeState(DEFAULT_THEME_MODE)

  const setToken = (key: ThemeTokenKey, value: string) => {
    setTokensState((prev) => sanitizeThemeTokens({ ...prev, [key]: value }))
  }

  const setTokens = (nextTokens: Partial<ThemeTokens>) => {
    setTokensState((prev) => sanitizeThemeTokens({ ...prev, ...nextTokens }))
  }

  const resetTokens = () => setTokensState(DEFAULT_THEME_TOKENS)

  const value = useMemo(
    () => ({ mode, tokens, setMode, setToken, setTokens, resetTokens }),
    [mode, tokens],
  )

  return <ThemeSystemContext.Provider value={value}>{children}</ThemeSystemContext.Provider>
}

export function useThemeSystem() {
  const ctx = useContext(ThemeSystemContext)
  if (!ctx) throw new Error('useThemeSystem must be used within ThemeSystemProvider')
  return ctx
}
