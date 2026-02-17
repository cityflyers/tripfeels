# TripFeels Green Color System - Implementation Guide

This guide shows developers how to use the green color system across the application.

## Quick Reference

### CSS Variables (Direct Access)

```css
/* Use these CSS variables directly in your stylesheets */

/* Primary Green Shades */
--tf-primary                 /* #047857 - Main brand color */
--tf-primary-hover          /* #065f46 - Button hover state */
--tf-primary-active         /* #034e3f - Button active state */
--tf-primary-focus          /* #10b981 - Focus ring color */
--tf-primary-disabled       /* #a7f3d0 - Disabled state */
--tf-primary-light          /* #d1fae5 - Light background */
--tf-primary-lighter        /* #ecfdf5 - Very light background */
--tf-primary-text           /* #ffffff - Text on primary */

/* Semantic Colors */
--tf-success                /* #10b981 - Success state */
--tf-warning                /* #f59e0b - Warning state */
--tf-danger                 /* #ef4444 - Error state */
--tf-info                   /* #3b82f6 - Info state */

/* Hover/Active variants */
--tf-success-hover          /* #059669 */
--tf-warning-hover          /* #d97706 */
--tf-danger-hover           /* #dc2626 */
--tf-info-hover             /* #2563eb */

/* Light variants for backgrounds */
--tf-success-light          /* #d1fae5 */
--tf-warning-light          /* #fef3c7 */
--tf-danger-light           /* #fee2e2 */
--tf-info-light             /* #dbeafe */

/* Background & Surface */
--tf-page-bg                /* #ffffff - Main background */
--tf-surface                /* #f9fafb - Card backgrounds */
--tf-surface-alt            /* #f3f4f6 - Alternative surface */
--tf-input-fill             /* #ffffff - Input backgrounds */
--tf-bg-solid               /* #ffffff - Solid backgrounds */

/* Text */
--tf-text-primary           /* #1f2937 - Main text */
--tf-text-secondary         /* #6b7280 - Secondary text */
--tf-text-muted             /* #9ca3af - Muted text */

/* Borders */
--tf-border                 /* #e5e7eb - Standard borders */
--tf-border-subtle          /* #f0f0f0 - Subtle borders */
--tf-border-strong          /* #d1d5db - Strong borders */
--tf-divider                /* #e5e7eb - Dividers */

/* Component backgrounds */
--tf-header-bg              /* #ffffff - Header */
--tf-sidebar-bg             /* #ffffff - Sidebar */
--tf-footer-bg              /* #f9fafb - Footer */
--tf-nav-hover              /* #ecfdf5 - Nav hover */

/* Ring for focus states */
--tf-ring                   /* #047857 - Focus indicator */
```

## Usage Patterns

### In TSX/JSX Components

```tsx
import { components, colors } from '@/lib/design-tokens'

// Using design tokens directly
export function MyComponent() {
  return (
    <div className={components.card.default}>
      <h2 className={colors.text.primary}>Heading</h2>
      <p className={colors.text.secondary}>Secondary text</p>
      <button className={components.button.primary}>
        Click me
      </button>
    </div>
  )
}
```

### In CSS/Inline Styles

```tsx
// Using CSS variables in style attribute
export function MyElement() {
  return (
    <div style={{ 
      backgroundColor: 'var(--tf-surface)',
      color: 'var(--tf-text-primary)',
      border: '2px solid var(--tf-border)'
    }}>
      Content
    </div>
  )
}

// Using CSS classes with variables
export function MyCard() {
  return (
    <div className="p-6 rounded-lg" style={{
      backgroundColor: 'var(--tf-surface)',
      borderColor: 'var(--tf-border)'
    }}>
      <h3 className="font-semibold" style={{ color: 'var(--tf-text-primary)' }}>
        Card Title
      </h3>
    </div>
  )
}
```

### Tailwind Classes

```tsx
// Green brand color (primary)
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Button
</button>

// Success color (semantic)
<div className="bg-green-500 text-white">Success Alert</div>

// Warning color (semantic)
<div className="bg-amber-500 text-white">Warning Alert</div>

// Error color (semantic)
<div className="bg-red-500 text-white">Error Alert</div>

// Info color (semantic)
<div className="bg-blue-500 text-white">Info Alert</div>

// Surface backgrounds
<card className="bg-gray-50 border border-gray-300">
  Content
</card>

// Text colors
<p className="text-gray-900">Primary text</p>
<p className="text-gray-600">Secondary text</p>
<p className="text-gray-500">Muted text</p>

// Focus states
<input className="focus:ring-2 focus:ring-green-700 focus:border-green-700" />
```

## Component Examples

### Button Patterns

```tsx
// Primary Button (Green)
<Button variant="default">
  Save Changes
</Button>
// bg-primary (#047857), text-white, hover:bg-primary-hover

// Secondary Button
<Button variant="secondary">
  Learn More
</Button>
// bg-gray-100, text-gray-900

// Outline Button (Green border)
<Button variant="outline">
  Cancel
</Button>
// border-2 border-primary, text-primary, hover:bg-primary-light

// Success Button
<Button variant="success">
  Confirm
</Button>
// bg-green-500, text-white

// Warning Button
<Button variant="warning">
  Proceed with Caution
</Button>
// bg-amber-500, text-white

// Error/Destructive Button
<Button variant="error">
  Delete
</Button>
// bg-red-500, text-white

// Ghost Button (No background)
<Button variant="ghost">
  Help
</Button>
// transparent, text-gray-900, hover:bg-gray-100

// Link Button
<Button variant="link">
  Link Text
</Button>
// text-primary, underline
```

### Badge Patterns

```tsx
// Default Badge (Green)
<Badge>Active</Badge>
// bg-primary, text-white

// Success Badge
<Badge variant="success">Confirmed</Badge>
// bg-green-500, text-white

// Warning Badge
<Badge variant="warning">Pending</Badge>
// bg-amber-500, text-white

// Error Badge
<Badge variant="error">Failed</Badge>
// bg-red-500, text-white

// Info Badge
<Badge variant="info">New</Badge>
// bg-blue-500, text-white

// Outline Badge
<Badge variant="outline">Optional</Badge>
// border-2 border-primary, text-primary
```

### Card Patterns

```tsx
// Simple Card
<div className={components.card.default}>
  <h3 className={colors.text.primary}>Title</h3>
  <p className={colors.text.secondary}>Content</p>
</div>
// white bg, subtle border, shadow

// Subtle Card
<div className={components.card.subtle}>
  <p>Lighter background option</p>
</div>
// gray-50 bg, minimal border, no shadow

// Interactive Card (Clickable)
<div className={components.card.interactive}>
  Click me
</div>
// white bg, hover effect, cursor pointer

// Strong Card (Emphasized)
<div className={components.card.strong}>
  Important content
</div>
// white bg, strong border, elevated shadow
```

### Input Patterns

```tsx
// Default Input
<input 
  type="text"
  className={components.input.default}
  placeholder="Enter text"
/>
// white bg, gray border, green focus ring

// Subtle Input
<input 
  type="text"
  className={components.input.subtle}
  placeholder="Enter text"
/>
// gray-50 bg, subtle border

// With Label
<div className="space-y-2">
  <label className={colors.text.primary}>
    Email Address
  </label>
  <input 
    type="email"
    className={components.input.default}
    placeholder="you@example.com"
  />
</div>

// With Error State
<div className="space-y-2">
  <input 
    type="text"
    className={components.input.default}
    style={{ borderColor: 'var(--tf-danger)' }}
  />
  <p className={colors.text.error}>This field is required</p>
</div>

// With Success State
<div className="space-y-2">
  <input 
    type="text"
    className={components.input.default}
    style={{ borderColor: 'var(--tf-success)' }}
  />
  <p className={colors.text.success}>Looks good!</p>
</div>
```

### Navigation Patterns

```tsx
// Active Navigation Item (Green highlight)
<div className={components.nav.itemActive}>
  Dashboard
</div>
// bg-primary-light, border-primary, text-primary

// Inactive Navigation Item
<div className={components.nav.item}>
  Settings
</div>
// transparent, hover:bg-primary-light, text-secondary

// Navigation Sidebar
<aside className={components.sidebar.default}>
  <nav className="space-y-1">
    <a href="#" className={components.nav.itemActive}>Active</a>
    <a href="#" className={components.nav.item}>Inactive</a>
    <a href="#" className={components.nav.item}>Inactive</a>
  </nav>
</aside>
// white bg, right border, fixed width

// Header with Navigation
<header className={components.header.default}>
  <nav className="flex items-center gap-4">
    <a href="/" className={colors.text.primary}>Logo</a>
    <a href="#" className={components.nav.item}>Features</a>
    <a href="#" className={components.nav.item}>Pricing</a>
  </nav>
</header>
// white bg, bottom border, fixed position
```

### Alert/Status Patterns

```tsx
// Success Alert
<div className="bg-green-50 border-l-4 border-green-500 p-4">
  <p className="text-green-800">Success! Your changes have been saved.</p>
</div>
// light green bg, green border, green text

// Warning Alert
<div className="bg-amber-50 border-l-4 border-amber-500 p-4">
  <p className="text-amber-800">Warning: Please verify your information.</p>
</div>
// light amber bg, amber border, amber text

// Error Alert
<div className="bg-red-50 border-l-4 border-red-500 p-4">
  <p className="text-red-800">Error: Something went wrong.</p>
</div>
// light red bg, red border, red text

// Info Alert
<div className="bg-blue-50 border-l-4 border-blue-500 p-4">
  <p className="text-blue-800">Note: This feature is new.</p>
</div>
// light blue bg, blue border, blue text

// Info Alert with Icon
<div className="flex gap-3 bg-blue-50 border-l-4 border-blue-500 p-4">
  <InfoIcon className="text-blue-500" />
  <p className="text-blue-800">Informational message</p>
</div>
```

### Form Patterns

```tsx
// Form Container
<form className={components.container.form}>
  <div className="space-y-4">
    {/* Form fields */}
  </div>
</form>

// Form Field Group
<div className="space-y-2">
  <label htmlFor="email" className={`${colors.text.primary} font-medium`}>
    Email Address
  </label>
  <input 
    id="email"
    type="email"
    className={components.input.default}
    placeholder="you@example.com"
  />
  <p className={colors.text.secondary}>
    We'll never share your email with anyone else.
  </p>
</div>

// Form Actions
<div className="flex gap-3 mt-6">
  <button className={components.button.primary}>
    Save
  </button>
  <button className={components.button.secondary}>
    Cancel
  </button>
</div>

// Form with Validation Errors
<form className={components.container.form}>
  <div className="space-y-4">
    <div className="space-y-2">
      <label className={colors.text.primary}>Password</label>
      <input 
        type="password"
        className={components.input.default}
        style={{ borderColor: 'var(--tf-danger)' }}
      />
      <p className={colors.text.error}>Password must be at least 8 characters</p>
    </div>
  </div>
  <button className={components.button.error}>
    Fix Errors
  </button>
</form>
```

## Dark Mode Considerations

The current color system is designed for light mode (white backgrounds). For future dark mode implementation:

```css
/* Reserve these for dark mode later */
.dark {
  --tf-page-bg: #1f2937;           /* Dark gray */
  --tf-surface: #111827;           /* Very dark gray */
  --tf-text-primary: #ffffff;      /* White text */
  --tf-border: #374151;            /* Dark border */
  /* ... etc */
}
```

## Accessibility Checklist

When building components with this color system:

- [ ] **Text Contrast**: Ensure 4.5:1 minimum for normal text (WCAG AA)
- [ ] **UI Components**: Ensure 3:1 minimum for component boundaries
- [ ] **Focus Indicators**: Visible focus ring on interactive elements
- [ ] **Color Meaning**: Don't rely on color alone to convey information
- [ ] **Button States**: Clear visual distinction between enabled/disabled/hover
- [ ] **Link Styling**: Underline or other non-color indicator
- [ ] **Form Labels**: Properly associated with input fields
- [ ] **Error Messages**: Clearly visible and associated with input

## Common Mistakes to Avoid

❌ **Don't:**
```tsx
// Using hardcoded colors instead of CSS variables
<button style={{ backgroundColor: '#047857' }}>
  Click me
</button>

// Mixing brand colors without semantic meaning
<div className="bg-green-600">
  <p className="text-amber-500">This is confusing</p>
</div>

// Ignoring contrast ratios
<p className="text-amber-300 bg-yellow-100">
  Hard to read
</p>

// Using color alone for status indication
<div className="bg-red-500">Error occurred</div>
// Should also have an icon or text indicator
```

✅ **Do:**
```tsx
// Use CSS variables and design tokens
<button className={components.button.primary}>
  Click me
</button>

// Use semantic color meanings
<div className="bg-green-50">
  <span className="text-green-700">Success</span>
</div>

// Maintain accessibility standards
<p className="text-red-900 bg-red-50">
  Clear and readable
</p>

// Combine color with icons and text
<div className="flex gap-2 bg-red-50 p-4">
  <AlertIcon className="text-red-600" />
  <span className="text-red-800">Error occurred</span>
</div>
```

## Testing Your Colors

### Browser DevTools
1. Open Inspector (F12)
2. Select an element
3. Go to Accessibility tab
4. Check contrast ratio
5. Should see ✓ AA or ✓ AAA badge

### Manual Testing
```bash
# Test in browser console
const color1 = new Color('#047857'); // primary
const color2 = new Color('#ffffff'); // white
color1.contrast(color2); // 10.3 - AAA compliant ✓
```

### Visual Testing
- [ ] Check all interactive states (hover, focus, active, disabled)
- [ ] Test with high contrast mode enabled
- [ ] View with color blind simulator (Deuteranopia, Protanopia, Tritanopia)
- [ ] Check print styles
- [ ] Test on different screen sizes

## Support & Questions

For questions about the color system:
1. Review `COLOR_SYSTEM.md` for complete specifications
2. Check `design-tokens.ts` for current token definitions
3. Test contrast ratios at https://webaim.org/resources/contrastchecker/
4. Refer to component examples in this guide
