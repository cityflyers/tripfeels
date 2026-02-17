'use client'

import { useThemeSystem } from '@/components/theme-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { THEME_TOKEN_KEYS, type ThemeTokenKey } from '@/lib/theme-tokens'

const QUICK_KEYS: ThemeTokenKey[] = [
  'pageBg',
  'componentBg',
  'inputFill',
  'surface',
  'textPrimary',
  'primary',
  'primaryHover',
  'border',
]

const TOKEN_LABELS: Partial<Record<ThemeTokenKey, string>> = {
  pageBg: 'Page Bg',
  componentBg: 'Component Background',
  inputFill: 'Input Fill',
}

function toLabel(key: ThemeTokenKey): string {
  const mappedLabel = TOKEN_LABELS[key]
  if (mappedLabel) return mappedLabel
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}

export default function ThemeSelector() {
  const { tokens, setToken } = useThemeSystem()

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
      {QUICK_KEYS.filter((key) => THEME_TOKEN_KEYS.includes(key)).map((key) => (
        <div
          key={key}
          className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] px-2.5 py-2"
        >
          <Label htmlFor={`theme-${key}`} className="text-xs font-semibold text-[var(--tf-text-secondary)]">
            {toLabel(key)}
          </Label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id={`theme-${key}-picker`}
              type="color"
              value={tokens[key]}
              onChange={(e) => setToken(key, e.target.value)}
              className="tf-color-input h-9 w-10 rounded border border-[var(--tf-border)] bg-[var(--tf-input-fill)] p-1"
            />
            <Input
              id={`theme-${key}`}
              value={tokens[key]}
              onChange={(e) => setToken(key, e.target.value)}
              placeholder="#000000"
              className="h-9 text-sm"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
