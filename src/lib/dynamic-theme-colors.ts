/**
 * Semantic utility classes powered by centralized theme tokens.
 */

export const themeColorMap = {
  custom: {
    primary: 'bg-primary',
    primaryHover: 'hover:bg-[var(--tf-primary-hover)]',
    primaryBorder: 'border-primary/60',
    primaryText: 'text-primary',
    primaryRing: 'focus:ring-primary/50',
  },
} as const

export const defaultThemeColors = {
  light: themeColorMap.custom,
  dark: themeColorMap.custom,
}

export function getThemeColors(_themeName?: string, _isDarkMode: boolean = true) {
  return themeColorMap.custom
}

export function useDynamicThemeColors() {
  return themeColorMap.custom
}

export function createDynamicButton(
  _variant: 'primary' | 'secondary' | 'ghost' | 'outline' = 'primary',
  className?: string,
) {
  return `${className || ''}`
}

export function createDynamicInput(_variant: 'default' | 'subtle' = 'default', className?: string) {
  return `${className || ''}`
}

export const availableThemes = ['custom'] as const

export function getThemeDisplayName(_themeName: string): string {
  return 'Custom'
}

export function getThemeDescription(_themeName: string): string {
  return 'Centralized token-driven theme.'
}
