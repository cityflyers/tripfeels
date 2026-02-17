# Dark Mode - Developer Quick Reference

## Color Variables (Use These!)

```css
/* Primary Brand */
--tf-primary: #10b981;              /* Main green */
--tf-primary-hover: #059669;        /* Button hover */
--tf-primary-active: #047857;       /* Button pressed */
--tf-primary-focus: #6ee7b7;        /* Focus states */

/* Backgrounds */
--tf-page-bg: #0f172a;              /* Page/main */
--tf-component-bg: #1e293b;         /* Cards/surfaces */
--tf-surface: #1e293b;              /* Panels */
--tf-surface-alt: #334155;          /* Elevated */
--tf-input-fill: #ffffff;           /* Input fields */

/* Text */
--tf-text-primary: #f1f5f9;         /* Headlines */
--tf-text-secondary: #cbd5e1;       /* Body text */
--tf-text-muted: #94a3b8;           /* Helper text */

/* Borders */
--tf-border: #475569;               /* Default border */
--tf-border-strong: #64748b;        /* Strong border */
--tf-divider: #475569;              /* Lines */

/* Status Colors */
--tf-success: #10b981;              /* Green */
--tf-warning: #fbbf24;              /* Amber */
--tf-danger: #ef4444;               /* Red */
--tf-info: #60a5fa;                 /* Blue */

/* Components */
--tf-header-bg: #1e293b;            /* Header */
--tf-sidebar-bg: #0f172a;           /* Sidebar */
--tf-footer-bg: #1e293b;            /* Footer */
--tf-nav-hover: #064e3b;            /* Nav hover */
```

## Common Patterns

### Text Colors
```jsx
// Primary text (headings)
className="text-[var(--tf-text-primary)]"

// Secondary text (body)
className="text-[var(--tf-text-secondary)]"

// Muted text (helpers)
className="text-[var(--tf-text-muted)]"
```

### Background Colors
```jsx
// Page background
className="bg-[var(--tf-page-bg)]"

// Component/card background
className="bg-[var(--tf-component-bg)]"

// Elevated surface
className="bg-[var(--tf-surface-alt)]"
```

### Borders
```jsx
// Default border (most elements)
className="border border-[var(--tf-border)]"

// Strong border (important elements)
className="border-2 border-[var(--tf-border-strong)]"

// Divider lines
className="border-b border-[var(--tf-divider)]"
```

### Input Fields (White!)
```jsx
// White input with proper styling
className="bg-[var(--tf-input-fill)] border-2 border-[var(--tf-border)] text-[var(--tf-text-primary)] placeholder:text-[var(--tf-text-muted)] focus:border-[var(--tf-primary)] focus:ring-2 focus:ring-[var(--tf-primary)]"
```

### Buttons
```jsx
// Primary button
className="bg-[var(--tf-primary)] hover:bg-[var(--tf-primary-hover)] text-white"

// Secondary button
className="bg-[var(--tf-surface-alt)] text-[var(--tf-text-primary)] hover:bg-[var(--tf-border)]"

// Outline button
className="border-2 border-[var(--tf-primary)] text-[var(--tf-primary)] hover:bg-[var(--tf-primary-light)]"
```

### Cards
```jsx
// Standard card
className="bg-[var(--tf-component-bg)] border border-[var(--tf-border)] shadow-lg rounded-lg p-6"

// Interactive card
className="bg-[var(--tf-component-bg)] border border-[var(--tf-border)] shadow-lg rounded-lg p-6 hover:shadow-xl hover:border-[var(--tf-primary)] cursor-pointer"
```

## Sidebar Icon Colors

```javascript
const getIconColor = (label: string): string => {
  const labelLower = label.toLowerCase()
  
  if (labelLower.includes('home') || labelLower.includes('dashboard')) {
    return '#10b981' // Green
  }
  
  if (labelLower.includes('user') || labelLower.includes('traveller')) {
    return '#60a5fa' // Blue
  }
  
  if (labelLower.includes('flight') || labelLower.includes('trip')) {
    return '#fbbf24' // Amber
  }
  
  if (labelLower.includes('setting')) {
    return '#a78bfa' // Purple
  }
  
  if (labelLower.includes('security')) {
    return '#ef4444' // Red
  }
  
  if (labelLower.includes('analytics') || labelLower.includes('report')) {
    return '#06b6d4' // Cyan
  }
  
  return '#10b981' // Default green
}
```

## Tailwind Classes

### Primary Color (Bright Green)
```jsx
bg-primary           // #10b981
text-primary        // #10b981
border-primary      // #10b981
hover:bg-primary    // Works with hover states
```

### Semantic Colors
```jsx
bg-green-500        // Success (#22c55e)
bg-amber-400        // Warning (#fbbf24)
bg-red-500          // Danger (#ef4444)
bg-blue-400         // Info (#60a5fa)
```

### Gray Scale
```jsx
bg-gray-50          // Lightest
bg-gray-100         // Very light
bg-gray-500         // Medium
bg-gray-900         // Darkest
text-gray-200       // Light text
text-gray-700       // Dark text
```

## Common Components

### Text Input
```jsx
<input 
  className="bg-[var(--tf-input-fill)] border-2 border-[var(--tf-border)] text-[var(--tf-text-primary)] placeholder:text-[var(--tf-text-muted)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--tf-primary)] focus:border-[var(--tf-primary)]"
  placeholder="Enter text..."
/>
```

### Button Primary
```jsx
<button className="bg-[var(--tf-primary)] hover:bg-[var(--tf-primary-hover)] text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all">
  Click me
</button>
```

### Card
```jsx
<div className="bg-[var(--tf-component-bg)] border border-[var(--tf-border)] rounded-lg p-6 shadow-lg">
  <h3 className="text-[var(--tf-text-primary)] font-semibold">Title</h3>
  <p className="text-[var(--tf-text-secondary)] mt-2">Description</p>
</div>
```

### Alert
```jsx
<div className="bg-[var(--tf-danger-light)] border-2 border-[var(--tf-danger)] rounded-lg p-4">
  <p className="text-[var(--tf-danger)] font-semibold">Error message</p>
</div>
```

## Do's and Don'ts

### ✅ DO
```jsx
// Use CSS variables
className="bg-[var(--tf-primary)]"

// Use Tailwind semantic classes
className="bg-green-500"

// Use design tokens
className={components.button.primary}

// Use proper contrast
className="text-[var(--tf-text-primary)]"
```

### ❌ DON'T
```jsx
// Don't hardcode colors
className="bg-green-400"

// Don't mix themes
className="bg-gray-100 text-white"

// Don't use deprecated colors
className="bg-blue-600"

// Don't forget contrast
className="text-gray-400" // On dark background
```

## Testing

### Colors to Test
- [ ] Bright green works everywhere (#10b981)
- [ ] Dark backgrounds are readable (#0f172a, #1e293b)
- [ ] White inputs stand out (#ffffff)
- [ ] Gray borders visible (#475569)
- [ ] Light text readable (#f1f5f9)
- [ ] All semantic colors bright

### Components to Test
- [ ] Buttons have hover states
- [ ] Inputs show focus border (green)
- [ ] Cards have proper shadow
- [ ] Text is never hard to read
- [ ] Borders always visible
- [ ] Icons are appropriately colored

## Debugging

### Issue: Text is too faint
**Solution**: Use `--tf-text-primary` instead of `--tf-text-secondary`

### Issue: Border invisible
**Solution**: Use `#475569` not lighter grays

### Issue: Input looks wrong
**Solution**: Keep background white, use `--tf-input-fill`

### Issue: Button not visible
**Solution**: Use bright primary `#10b981` with white text

### Issue: Card doesn't stand out
**Solution**: Add border + shadow: `border border-[var(--tf-border)] shadow-lg`

## Resources

- **Color Palette**: See `DARK_MODE_VISUAL_REFERENCE.md`
- **Component Examples**: See `DARK_MODE_REDESIGN.md`
- **Full Verification**: See `DARK_MODE_VERIFICATION_CHECKLIST.md`
- **Design System**: See `src/lib/design-tokens.ts`

---

**Quick Start**: Always use `var(--tf-*)` CSS variables for colors!
