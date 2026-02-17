/**
 * Centralized semantic design tokens.
 * All color classes here read from CSS variables set by ThemeSystemProvider.
 */

export const glassmorphism = {
  background: {
    light: 'bg-[var(--tf-surface)]',
    dark: 'bg-[var(--tf-surface)]',
    default: 'bg-[var(--tf-surface)]',
    subtle: 'bg-[var(--tf-surface-alt)]',
    strong: 'bg-[var(--tf-surface-alt)]',
  },
  border: {
    light: 'border-[var(--tf-border)]',
    dark: 'border-[var(--tf-border)]',
    default: 'border-[var(--tf-border)]',
    subtle: 'border-[var(--tf-border)]',
    strong: 'border-[var(--tf-border)]',
  },
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  },
  card: {
    default:
      'bg-[var(--tf-surface)] backdrop-blur-md border border-[var(--tf-border)] shadow-[0_10px_30px_rgba(0,0,0,0.22)] rounded-xl',
    subtle:
      'bg-[var(--tf-surface-alt)] backdrop-blur-sm border border-[var(--tf-border)] shadow-[0_8px_20px_rgba(0,0,0,0.18)] rounded-lg',
    strong:
      'bg-[var(--tf-surface-alt)] backdrop-blur-lg border border-[var(--tf-border)] shadow-[0_12px_30px_rgba(0,0,0,0.24)] rounded-xl',
  },
  interactive: {
    hover: 'hover:bg-[var(--tf-nav-hover)]',
    active: 'active:bg-[var(--tf-nav-hover)]',
    focus: 'focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-0',
  },
}

export const colors = {
  text: {
    primary: 'text-[var(--tf-text-primary)]',
    secondary: 'text-[var(--tf-text-secondary)]',
    muted: 'text-[var(--tf-text-muted)]',
    inverse: 'text-[var(--tf-primary-text)]',
    accent: 'text-primary',
    success: 'text-[var(--tf-success)]',
    warning: 'text-[var(--tf-warning)]',
    error: 'text-[var(--tf-danger)]',
  },
  gradient: {
    primary: 'bg-[var(--tf-app-bg)]',
    subtle: 'bg-[var(--tf-app-bg)]',
    accent: 'bg-primary',
  },
  brand: {
    primary: 'bg-primary',
    primaryHover: 'hover:bg-[var(--tf-primary-hover)]',
    primaryBorder: 'border-primary/65',
    secondary: 'bg-[var(--tf-info)]',
    secondaryHover: 'hover:bg-[var(--tf-primary-hover)]',
    secondaryBorder: 'border-[var(--tf-border)]',
  },
  status: {
    success: 'bg-[var(--tf-success)]',
    successHover: 'hover:bg-[var(--tf-success)]/90',
    warning: 'bg-[var(--tf-warning)]',
    warningHover: 'hover:bg-[var(--tf-warning)]/90',
    error: 'bg-[var(--tf-danger)]',
    errorHover: 'hover:bg-[var(--tf-danger)]/90',
  },
} as const

export const spacing = {
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8',
} as const

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const

export const radius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const

export const animations = {
  transition: 'transition-all duration-200',
  transitionSlow: 'transition-all duration-300',
  hover: 'hover:opacity-100 hover:visible',
  fade: 'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
  smooth: 'transition-all duration-300 ease-in-out',
} as const

export const backgroundElements = {
  blobs: {
    container: 'fixed inset-0 overflow-hidden pointer-events-none',
    blob1:
      'absolute -top-40 -right-32 w-80 h-80 bg-primary/20 rounded-full mix-blend-screen filter blur-xl opacity-45 animate-blob',
    blob2:
      'absolute -bottom-40 -left-32 w-80 h-80 bg-[var(--tf-info)]/30 rounded-full mix-blend-screen filter blur-xl opacity-45 animate-blob animation-delay-2000',
    blob3:
      'absolute top-40 left-40 w-80 h-80 bg-[var(--tf-success)]/24 rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob animation-delay-4000',
  },
} as const

export const components = {
  button: {
    primary: `${colors.brand.primary} ${colors.brand.primaryHover} ${glassmorphism.blur.sm} text-[var(--tf-primary-text)] border ${colors.brand.primaryBorder} shadow-lg rounded-lg ${animations.smooth}`,
    secondary: `${colors.brand.secondary} ${colors.brand.secondaryHover} ${glassmorphism.blur.sm} text-[var(--tf-text-primary)] border ${colors.brand.secondaryBorder} shadow-lg rounded-lg ${animations.smooth}`,
    ghost: `${glassmorphism.background.subtle} ${glassmorphism.border.default} ${colors.text.primary} ${glassmorphism.interactive.hover} ${animations.smooth} rounded-lg`,
    outline: `${glassmorphism.background.subtle} border border-[var(--tf-border)] ${glassmorphism.blur.sm} text-[var(--tf-text-primary)] hover:bg-[var(--tf-nav-hover)] ${animations.smooth} rounded-lg`,
    success: `${colors.status.success} ${colors.status.successHover} ${glassmorphism.blur.sm} text-[var(--tf-primary-text)] shadow-lg rounded-lg ${animations.smooth}`,
    warning: `${colors.status.warning} ${colors.status.warningHover} ${glassmorphism.blur.sm} text-[var(--tf-primary-text)] shadow-lg rounded-lg ${animations.smooth}`,
    error: `${colors.status.error} ${colors.status.errorHover} ${glassmorphism.blur.sm} text-[var(--tf-text-primary)] shadow-lg rounded-lg ${animations.smooth}`,
  },
  input: {
    default:
      'bg-[var(--tf-input-fill)] border border-[var(--tf-border)] backdrop-blur-sm text-[var(--tf-text-primary)] placeholder:text-[var(--tf-text-secondary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary/70',
    subtle:
      'bg-[var(--tf-input-fill)] border border-[var(--tf-border)] backdrop-blur-sm text-[var(--tf-text-primary)] placeholder:text-[var(--tf-text-secondary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary/70',
  },
  card: {
    default: `${glassmorphism.card.default} p-6`,
    subtle: `${glassmorphism.card.subtle} p-4`,
    strong: `${glassmorphism.card.strong} p-6`,
    interactive: `${glassmorphism.card.default} p-6 ${glassmorphism.interactive.hover} ${animations.smooth} cursor-pointer`,
  },
  container: {
    page: `${colors.gradient.primary} min-h-screen`,
    section: `${glassmorphism.card.default} p-6`,
    form: `${glassmorphism.card.default} p-8`,
  },
  nav: {
    item: `bg-[var(--tf-surface)] border border-[var(--tf-border)] ${glassmorphism.blur.sm} text-[var(--tf-text-secondary)] hover:bg-[var(--tf-nav-hover)] hover:text-[var(--tf-text-primary)] ${animations.smooth} rounded-lg px-3 py-2`,
    itemActive: `bg-primary/18 border border-primary/42 ${glassmorphism.blur.sm} text-[var(--tf-text-primary)] ${animations.smooth} rounded-lg px-3 py-2`,
  },
  header: {
    default:
      'fixed top-0 left-0 right-0 z-40 h-14 bg-[var(--tf-header-bg)] border-b border-[var(--tf-divider)] backdrop-blur-md shadow-[0_10px_24px_rgba(0,0,0,0.22)]',
  },
  sidebar: {
    default:
      'flex flex-col bg-[var(--tf-sidebar-bg)] border-r border-[var(--tf-divider)] backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.24)] transition-all duration-300 h-full',
  },
} as const

export const utilities = {
  layout: {
    centerContent: 'flex items-center justify-center',
    centerText: 'text-center',
    fullHeight: 'min-h-screen',
    flexColumn: 'flex flex-col',
    flexRow: 'flex flex-row',
    grid: 'grid',
    gridCols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    },
  },
  text: {
    heading1: `${colors.text.primary} text-3xl font-bold`,
    heading2: `${colors.text.primary} text-2xl font-semibold`,
    heading3: `${colors.text.primary} text-xl font-semibold`,
    body: `${colors.text.primary} text-base`,
    caption: `${colors.text.secondary} text-sm`,
    muted: `${colors.text.muted} text-xs`,
  },
  interactive: {
    clickable: 'cursor-pointer',
    disabled: 'opacity-50 pointer-events-none',
    loading: 'animate-pulse',
  },
} as const

export const breakpoints = {
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
  xl: 'xl:',
  '2xl': '2xl:',
} as const
