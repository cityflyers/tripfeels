export type ThemeMode = 'default'

export const THEME_TOKEN_KEYS = [
  'pageBg',
  'appBg',
  'componentBg',
  'surface',
  'surfaceAlt',
  'inputFill',
  'textPrimary',
  'textSecondary',
  'textMuted',
  'border',
  'divider',
  'primary',
  'primaryHover',
  'primaryText',
  'ring',
  'success',
  'warning',
  'danger',
  'info',
  'headerBg',
  'sidebarBg',
  'footerBg',
  'navHover',
] as const

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number]

export type ThemeTokens = Record<ThemeTokenKey, string>

export const DEFAULT_THEME_MODE: ThemeMode = 'default'

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  pageBg: '#343434',
  appBg: '#343434',
  componentBg: '#343434',
  surface: '#3D4240',
  surfaceAlt: '#6A6E6B',
  inputFill: '#6A6E6B',
  textPrimary: '#FAFAFA',
  textSecondary: '#C9C9C9',
  textMuted: '#979797',
  border: '#666666',
  divider: '#4A4A4A',
  primary: '#21D375',
  primaryHover: '#08A045',
  primaryText: '#073B3A',
  ring: '#21D375',
  success: '#6BBF59',
  warning: '#8DD783',
  danger: '#EF4444',
  info: '#284C64',
  headerBg: '#353535',
  sidebarBg: '#353535',
  footerBg: '#353535',
  navHover: '#464646',
}

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function normalizeHex(value: string): string {
  const raw = value.trim()
  if (!HEX_PATTERN.test(raw)) return raw
  if (raw.length === 4) {
    const r = raw[1]
    const g = raw[2]
    const b = raw[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return raw.toUpperCase()
}

export function sanitizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const normalized = normalizeHex(value)
  return HEX_PATTERN.test(normalized) ? normalized : fallback
}

export function sanitizeThemeTokens(raw: unknown): ThemeTokens {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const output = { ...DEFAULT_THEME_TOKENS }
  const appBgFallback = sanitizeHexColor(source.appBg, DEFAULT_THEME_TOKENS.appBg)
  const componentBgFallback = sanitizeHexColor(source.componentBg, appBgFallback)
  for (const key of THEME_TOKEN_KEYS) {
    if (key === 'componentBg') {
      output[key] = componentBgFallback
      continue
    }
    output[key] = sanitizeHexColor(source[key], DEFAULT_THEME_TOKENS[key])
  }
  return output
}

export function sanitizeThemeMode(raw: unknown): ThemeMode {
  void raw
  return DEFAULT_THEME_MODE
}

export function hexToHslChannels(hex: string): string {
  const valid = sanitizeHexColor(hex, '#000000')
  const r = parseInt(valid.slice(1, 3), 16) / 255
  const g = parseInt(valid.slice(3, 5), 16) / 255
  const b = parseInt(valid.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}
