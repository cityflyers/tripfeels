import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const neutralPaletteScale = {
  50: '#FAFAFA',
  100: '#FAFAFA',
  200: '#C9C9C9',
  300: '#C9C9C9',
  400: '#979797',
  500: '#979797',
  600: '#666666',
  700: '#666666',
  800: '#343434',
  900: '#343434',
  950: '#343434',
}

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1400px',
      '3xl': '1500px',
      // Filter sidebar is collapsed (overlay) from 1024–1366; always visible from 1367+
      'sidebar-expanded': '1367px',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        logo: ['var(--font-geist-sans)', 'var(--font-poppins)', 'Arial', 'sans-serif'],
      },
      colors: {
        border: 'var(--tf-border)',
        input: 'var(--tf-input-fill)',
        ring: 'var(--tf-ring)',
        background: 'var(--tf-page-bg)',
        foreground: 'var(--tf-text-primary)',
        palette: {
          seasalt: '#FAFAFA',
          silver: '#C9C9C9',
          battleship: '#979797',
          dim: '#666666',
          jet: '#343434',
        },
        white: '#FAFAFA',
        black: '#343434',
        gray: neutralPaletteScale,
        neutral: neutralPaletteScale,
        slate: neutralPaletteScale,
        zinc: neutralPaletteScale,
        stone: neutralPaletteScale,
        primary: {
          DEFAULT: '#10b981',
          foreground: '#ffffff',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
          950: '#0c2817',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },
        green: {
          DEFAULT: '#10b981',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
          950: '#0c2817',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config

export default config
