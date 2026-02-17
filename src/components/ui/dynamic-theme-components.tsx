/**
 * Dynamic Theme Components
 * Components that automatically change colors based on the selected theme
 */

import * as React from 'react'

import { glassmorphism } from '@/lib/design-tokens'
import { useDynamicThemeColors } from '@/lib/dynamic-theme-colors'
import { cn } from '@/lib/utils'

// Dynamic Button Component
interface DynamicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const DynamicButton = React.forwardRef<HTMLButtonElement, DynamicButtonProps>(
  ({ className, variant = 'primary', size = 'default', asChild = false, ...props }, ref) => {
    const themeColors = useDynamicThemeColors()

    const Comp = asChild ? 'span' : 'button'

    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
      icon: 'h-10 w-10',
    }

    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return `${themeColors.primary} ${themeColors.primaryHover} text-[var(--tf-primary-text)] ${themeColors.primaryBorder} shadow-lg`
        case 'secondary':
          return `${themeColors.primary} ${themeColors.primaryHover} text-[var(--tf-text-primary)] ${themeColors.primaryBorder} shadow-lg opacity-80`
        case 'ghost':
          return `${glassmorphism.background.default} ${glassmorphism.border.default} ${themeColors.primaryText} ${glassmorphism.interactive.hover}`
        case 'outline':
          return `${glassmorphism.background.subtle} ${themeColors.primaryBorder} ${themeColors.primaryText} ${glassmorphism.interactive.hover}`
        default:
          return `${themeColors.primary} ${themeColors.primaryHover} text-[var(--tf-primary-text)] ${themeColors.primaryBorder} shadow-lg`
      }
    }

    return (
      <Comp
        className={cn(
          getVariantClasses(),
          glassmorphism.blur.sm,
          glassmorphism.interactive.focus,
          sizeClasses[size],
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-300',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
DynamicButton.displayName = 'DynamicButton'

// Dynamic Input Component
interface DynamicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'subtle'
}

const DynamicInput = React.forwardRef<HTMLInputElement, DynamicInputProps>(
  ({ className, variant = 'default', type, ...props }, ref) => {
    const themeColors = useDynamicThemeColors()

    const getVariantClasses = () => {
      switch (variant) {
        case 'default':
          return `${glassmorphism.background.default} ${glassmorphism.border.default}`
        case 'subtle':
          return `${glassmorphism.background.subtle} ${glassmorphism.border.subtle}`
        default:
          return `${glassmorphism.background.default} ${glassmorphism.border.default}`
      }
    }

    return (
      <input
        type={type}
        className={cn(
          getVariantClasses(),
          glassmorphism.blur.sm,
          'text-foreground placeholder:text-muted-foreground',
          `focus:ring-2 focus:ring-offset-2 ${themeColors.primaryRing}`,
          'flex h-10 w-full px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 rounded-lg focus-visible:outline-none transition-all duration-300',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
DynamicInput.displayName = 'DynamicInput'

// Dynamic Select Component
interface DynamicSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'subtle'
}

const DynamicSelect = React.forwardRef<HTMLSelectElement, DynamicSelectProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const themeColors = useDynamicThemeColors()

    const getVariantClasses = () => {
      switch (variant) {
        case 'default':
          return `${glassmorphism.background.default} ${glassmorphism.border.default}`
        case 'subtle':
          return `${glassmorphism.background.subtle} ${glassmorphism.border.subtle}`
        default:
          return `${glassmorphism.background.default} ${glassmorphism.border.default}`
      }
    }

    return (
      <select
        className={cn(
          getVariantClasses(),
          glassmorphism.blur.sm,
          'text-foreground',
          `focus:ring-2 focus:ring-offset-2 ${themeColors.primaryRing}`,
          'flex h-10 w-full px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 rounded-lg focus-visible:outline-none transition-all duration-300',
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  },
)
DynamicSelect.displayName = 'DynamicSelect'

// Dynamic Textarea Component
interface DynamicTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'subtle'
}

const DynamicTextarea = React.forwardRef<HTMLTextAreaElement, DynamicTextareaProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const themeColors = useDynamicThemeColors()

    const getVariantClasses = () => {
      switch (variant) {
        case 'default':
          return `${glassmorphism.background.default} ${glassmorphism.border.default}`
        case 'subtle':
          return `${glassmorphism.background.subtle} ${glassmorphism.border.subtle}`
        default:
          return `${glassmorphism.background.default} ${glassmorphism.border.default}`
      }
    }

    return (
      <textarea
        className={cn(
          getVariantClasses(),
          glassmorphism.blur.sm,
          'text-foreground placeholder:text-muted-foreground',
          `focus:ring-2 focus:ring-offset-2 ${themeColors.primaryRing}`,
          'flex min-h-[80px] w-full px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 rounded-lg focus-visible:outline-none transition-all duration-300',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
DynamicTextarea.displayName = 'DynamicTextarea'

// Dynamic Badge Component
interface DynamicBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
  className?: string
}

const DynamicBadge = ({ variant = 'default', children, className }: DynamicBadgeProps) => {
  const themeColors = useDynamicThemeColors()

  const getVariantClasses = () => {
    switch (variant) {
      case 'default':
        return `${glassmorphism.background.default} ${themeColors.primaryText} ${glassmorphism.border.default}`
      case 'success':
        return 'bg-[var(--tf-success)]/20 text-[var(--tf-success)] border-[var(--tf-success)]/35'
      case 'warning':
        return 'bg-[var(--tf-warning)]/20 text-[var(--tf-warning)] border-[var(--tf-warning)]/35'
      case 'error':
        return 'bg-[var(--tf-danger)]/20 text-[var(--tf-danger)] border-[var(--tf-danger)]/35'
      case 'info':
        return 'bg-[var(--tf-info)]/28 text-[var(--tf-text-primary)] border-[var(--tf-border)]/40'
      default:
        return `${glassmorphism.background.default} ${themeColors.primaryText} ${glassmorphism.border.default}`
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm border',
        getVariantClasses(),
        className,
      )}
    >
      {children}
    </span>
  )
}

// Dynamic Status Message Component
interface DynamicStatusMessageProps {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  className?: string
}

const DynamicStatusMessage = ({ type, message, className }: DynamicStatusMessageProps) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-[var(--tf-success)]/35 bg-[var(--tf-success)]/16 text-[var(--tf-success)]'
      case 'warning':
        return 'border-[var(--tf-warning)]/35 bg-[var(--tf-warning)]/14 text-[var(--tf-warning)]'
      case 'error':
        return 'border-[var(--tf-danger)]/35 bg-[var(--tf-danger)]/16 text-[var(--tf-danger)]'
      case 'info':
        return 'border-[var(--tf-info)]/35 bg-[var(--tf-info)]/16 text-[var(--tf-text-primary)]'
      default:
        return 'border-primary/30 bg-primary/20 text-[var(--tf-primary-text)]'
    }
  }

  return (
    <div className={cn(glassmorphism.card.default, 'p-4', getTypeStyles(), className)}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

// Export all dynamic components
export {
  DynamicButton,
  DynamicInput,
  DynamicSelect,
  DynamicTextarea,
  DynamicBadge,
  DynamicStatusMessage,
}
