'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useThemeSystem } from '@/components/theme-provider'
import { sanitizeHexColor } from '@/lib/theme-tokens'

type BgStyle = 'solid' | 'gradient' | 'animated'

type BrandingState = {
  logoType: 'text' | 'image'
  textLogo: string
  logoImage: string | null
}

interface ThemeContextType {
  logoType: 'text' | 'image'
  textLogo: string
  logoImage: string | null
  colorTheme: string
  bgStyle: BgStyle
  solidColor: string
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  solidContrast: string
  isSolidDark: boolean
  setLogoType: (type: 'text' | 'image') => void
  setTextLogo: (text: string) => void
  setLogoImage: (image: string | null) => void
  setColorTheme: (_theme: string) => void
  setBgStyle: (_style: BgStyle) => void
  setSolidColor: (hex: string) => void
  setGradientFrom: (hex: string) => void
  setGradientVia: (hex: string) => void
  setGradientTo: (hex: string) => void
  saveThemeSettings: () => void
  loadThemeSettings: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const BRANDING_STORAGE_KEY = 'tripfeels-branding-v1'
const LEGACY_STORAGE_KEY = 'tripfeels-theme-settings'

function parseHex(hex: string) {
  const h = (hex || '').trim().replace('#', '')
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
  }
  return `#${h.padEnd(6, '0').slice(0, 6)}`
}

function hexToRgb(hex: string) {
  const p = parseHex(hex).replace('#', '')
  const r = Number.parseInt(p.slice(0, 2), 16)
  const g = Number.parseInt(p.slice(2, 4), 16)
  const b = Number.parseInt(p.slice(4, 6), 16)
  return { r, g, b }
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const mapped = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  const [sr, sg, sb] = mapped as [number, number, number]
  return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb
}

function isDark(hex: string) {
  return relLuminance(hexToRgb(hex)) < 0.5
}

function readBrandingFromStorage(): BrandingState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BrandingState>
      return {
        logoType: parsed.logoType === 'image' ? 'image' : 'text',
        textLogo: typeof parsed.textLogo === 'string' && parsed.textLogo.trim() ? parsed.textLogo : 'tripfeels',
        logoImage: typeof parsed.logoImage === 'string' || parsed.logoImage === null ? parsed.logoImage : null,
      }
    }

    // One-time fallback to legacy storage for logo fields.
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!legacyRaw) return null

    const legacy = JSON.parse(legacyRaw) as Record<string, unknown>
    return {
      logoType: legacy.logoType === 'image' ? 'image' : 'text',
      textLogo: typeof legacy.textLogo === 'string' && legacy.textLogo.trim() ? legacy.textLogo : 'tripfeels',
      logoImage:
        typeof legacy.logoImage === 'string' || legacy.logoImage === null
          ? legacy.logoImage
          : null,
    }
  } catch {
    return null
  }
}

function writeBrandingToStorage(state: BrandingState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // no-op
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initialBranding = readBrandingFromStorage()
  const [logoType, setLogoTypeState] = useState<'text' | 'image'>(initialBranding?.logoType ?? 'text')
  const [textLogo, setTextLogoState] = useState(initialBranding?.textLogo ?? 'tripfeels')
  const [logoImage, setLogoImageState] = useState<string | null>(initialBranding?.logoImage ?? null)

  const { tokens, setTokens } = useThemeSystem()

  const solidColor = tokens.pageBg
  const gradientFrom = tokens.primary
  const gradientVia = tokens.info
  const gradientTo = tokens.success
  const isSolidDark = isDark(solidColor)
  const solidContrast = isSolidDark ? '#FAFAFA' : '#343434'

  useEffect(() => {
    writeBrandingToStorage({ logoType, textLogo, logoImage })
  }, [logoType, textLogo, logoImage])

  const setLogoType = useCallback((type: 'text' | 'image') => {
    setLogoTypeState(type)
  }, [])

  const setTextLogo = useCallback((text: string) => {
    setTextLogoState(text)
  }, [])

  const setLogoImage = useCallback((image: string | null) => {
    setLogoImageState(image)
  }, [])

  // Legacy compatibility setters mapped to centralized tokens.
  const setSolidColor = useCallback(
    (hex: string) => {
      const next = sanitizeHexColor(hex, tokens.pageBg)
      setTokens({ pageBg: next, appBg: next })
    },
    [setTokens, tokens.pageBg],
  )

  const setGradientFrom = useCallback(
    (hex: string) => {
      setTokens({ primary: sanitizeHexColor(hex, tokens.primary) })
    },
    [setTokens, tokens.primary],
  )

  const setGradientVia = useCallback(
    (hex: string) => {
      setTokens({ info: sanitizeHexColor(hex, tokens.info) })
    },
    [setTokens, tokens.info],
  )

  const setGradientTo = useCallback(
    (hex: string) => {
      setTokens({ success: sanitizeHexColor(hex, tokens.success) })
    },
    [setTokens, tokens.success],
  )

  const loadThemeSettings = useCallback(() => {
    const stored = readBrandingFromStorage()
    if (!stored) return
    setLogoTypeState(stored.logoType)
    setTextLogoState(stored.textLogo)
    setLogoImageState(stored.logoImage)
  }, [])

  const saveThemeSettings = useCallback(() => {
    writeBrandingToStorage({ logoType, textLogo, logoImage })
  }, [logoType, textLogo, logoImage])

  const value = useMemo<ThemeContextType>(
    () => ({
      logoType,
      textLogo,
      logoImage,
      colorTheme: 'custom',
      bgStyle: 'solid',
      solidColor,
      gradientFrom,
      gradientVia,
      gradientTo,
      solidContrast,
      isSolidDark,
      setLogoType,
      setTextLogo,
      setLogoImage,
      setColorTheme: () => undefined,
      setBgStyle: () => undefined,
      setSolidColor,
      setGradientFrom,
      setGradientVia,
      setGradientTo,
      saveThemeSettings,
      loadThemeSettings,
    }),
    [
      gradientFrom,
      gradientTo,
      gradientVia,
      isSolidDark,
      loadThemeSettings,
      logoImage,
      logoType,
      saveThemeSettings,
      setGradientFrom,
      setGradientTo,
      setGradientVia,
      setLogoImage,
      setLogoType,
      setSolidColor,
      setTextLogo,
      solidColor,
      solidContrast,
      textLogo,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
