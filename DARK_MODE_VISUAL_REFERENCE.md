# TripFeels Dark Mode - Visual Reference Guide

## Color Swatches

### Primary Brand Colors
```
┌─────────────────────────────────┐
│ Bright Green Primary            │
│ #10b981                         │
│ RGB: 16, 185, 129               │
│ HSL: 160°, 84%, 39%             │
│ USE: Main buttons, active icons │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Hover State (Darker)            │
│ #059669                         │
│ RGB: 5, 150, 105                │
│ USE: Button hover, focus        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Active State                    │
│ #047857                         │
│ RGB: 4, 120, 87                 │
│ USE: Pressed buttons            │
└─────────────────────────────────┘
```

### Dark Backgrounds
```
┌─────────────────────────────────┐
│ Page Background (Darkest)       │
│ #0f172a                         │
│ RGB: 15, 23, 42                 │
│ USE: Page/dashboard background │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Component Background            │
│ #1e293b                         │
│ RGB: 30, 41, 59                 │
│ USE: Cards, sidebar, header     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Surface (Lighter)               │
│ #334155                         │
│ RGB: 51, 65, 85                 │
│ USE: Elevated surfaces, hover   │
└─────────────────────────────────┘
```

### Text Colors
```
┌─────────────────────────────────┐
│ Primary Text (Brightest)        │
│ #f1f5f9                         │
│ RGB: 241, 245, 249              │
│ USE: Headlines, main text       │
│ CONTRAST: 15:1 on dark          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Secondary Text                  │
│ #cbd5e1                         │
│ RGB: 203, 213, 225              │
│ USE: Body copy, descriptions    │
│ CONTRAST: 10.5:1 on dark        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Muted Text                      │
│ #94a3b8                         │
│ RGB: 148, 163, 184              │
│ USE: Hints, secondary info      │
│ CONTRAST: 7.2:1 on dark         │
└─────────────────────────────────┘
```

### Borders & Dividers
```
┌─────────────────────────────────┐
│ Default Border                  │
│ #475569                         │
│ RGB: 71, 85, 105                │
│ USE: Card borders, dividers     │
│ VISIBILITY: Excellent on dark   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Strong Border                   │
│ #64748b                         │
│ RGB: 100, 116, 139              │
│ USE: Important borders          │
└─────────────────────────────────┘
```

### Semantic Colors (Bright on Dark)
```
┌─────────────────────────────────┐
│ Success / Positive              │
│ #10b981 (Bright Green)          │
│ USE: Confirmations, success     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Warning / Caution               │
│ #fbbf24 (Bright Amber)          │
│ RGB: 251, 191, 36               │
│ USE: Warnings, alerts           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Danger / Error                  │
│ #ef4444 (Bright Red)            │
│ RGB: 239, 68, 68                │
│ USE: Errors, destructive        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Info / Notice                   │
│ #60a5fa (Bright Blue)           │
│ RGB: 96, 165, 250               │
│ USE: Information, help          │
└─────────────────────────────────┘
```

### Input Fields
```
┌──────────────────────────────────┐
│ Background: White (#ffffff)      │
│ Border: #475569 (gray)          │
│ Focus Border: #10b981 (green)   │
│ Text: Dark (#1f2937)            │
│ Placeholder: #94a3b8 (muted)    │
│                                  │
│ ┌─ Search... ─────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│  (White input, visible focus)   │
└──────────────────────────────────┘
```

## Component Styling Guide

### Buttons

#### Primary Button
```
Background: #10b981 (Green)
Text: White (#ffffff)
Border: #10b981
Shadow: shadow-lg
Hover: Background → #059669
Active: Background → #047857
```

#### Secondary Button
```
Background: #334155 (Gray)
Text: #f1f5f9 (Light white)
Border: #64748b (Strong gray)
Shadow: shadow-md
Hover: Background → #475569
```

#### Danger Button
```
Background: #ef4444 (Red)
Text: White (#ffffff)
Shadow: shadow-lg
Hover: Background → #dc2626
```

### Cards
```
Background: #1e293b (Dark slate)
Border: 1px #475569 (Gray)
Shadow: shadow-lg (elevated)
Hover: shadow-xl + border-[#10b981]
Padding: p-6
Border Radius: rounded-lg
```

### Input Field
```
Background: #ffffff (White)
Border: 2px #475569 (Gray) → focus #10b981
Text: #1f2937 (Dark)
Placeholder: #94a3b8 (Muted)
Focus Ring: 2px #10b981
```

### Sidebar Icons (Category Colors)

```
Home/Dashboard       → Green  (#10b981)
Users/Travelers      → Blue   (#60a5fa)
Flights/Travel       → Amber  (#fbbf24)
Settings/Config      → Purple (#a78bfa)
Security/Protection  → Red    (#ef4444)
Analytics/Reporting  → Cyan   (#06b6d4)
```

## Typography Scale

```
Hero/Title:      32px, bold
Large Heading:   24px, semibold
Heading:         20px, semibold
Subheading:      16px, semibold
Body:            14px, normal
Body Small:      12px, normal
Label:           12px, medium
Caption:         11px, normal

For Dark Mode (emphasis):
Footer Links:    14px, medium (improved from 12px)
Footer Copyright: 14px, medium (improved from 11px)
Navigation:      14px, medium
```

## Spacing Scale

```
xs: 4px    (smallest gaps)
sm: 8px    (compact spacing)
md: 16px   (standard spacing)
lg: 24px   (comfortable spacing)
xl: 32px   (generous spacing)
2xl: 48px  (section spacing)
```

## Shadow Scale (Enhanced for Dark)

```
sm:     0 1px 2px 0 rgba(0,0,0,0.05)
md:     0 4px 6px -1px rgba(0,0,0,0.1)
lg:     0 10px 15px -3px rgba(0,0,0,0.3) ← DEFAULT
xl:     0 20px 25px -5px rgba(0,0,0,0.4) ← HOVER
2xl:    0 25px 50px -12px rgba(0,0,0,0.5)
```

## Border Radius Scale

```
sm:  0.25rem (2px)   - subtle
md:  0.375rem (3px)  - standard
lg:  0.5rem (4px)    - default for cards
xl:  0.75rem (6px)   - large components
2xl: 1rem (8px)      - major elements
```

## Contrast Ratios (WCAG Compliance)

```
Primary Text (#f1f5f9) on Dark (#1e293b):
Ratio: 15:1 ✓ AAA (exceeds all requirements)

Secondary Text (#cbd5e1) on Dark (#1e293b):
Ratio: 10.5:1 ✓ AAA

Muted Text (#94a3b8) on Dark (#1e293b):
Ratio: 7.2:1 ✓ AA

Green (#10b981) on Dark (#1e293b):
Ratio: 8.2:1 ✓ AAA (for icons/accents)

White (#ffffff) on White (#ffffff):
✗ NOT USED (text on inputs only)
```

## Interactive States

### Hover
- Brighten shadows (shadow-lg → shadow-xl)
- Shift color to hover state (-5% lighter or darker)
- Add subtle scale transform (0.98-1.02)

### Focus
- Ring: 2px solid primary (#10b981)
- Ring-offset: 2px transparent
- Visible on all interactive elements

### Active/Pressed
- Use active color (darker shade)
- Reduce shadow slightly
- Inset effect for buttons

### Disabled
- Opacity: 50%
- Cursor: not-allowed
- Color: #9ca3af (muted)

## Mobile Responsive Adjustments

```
xs (480px):  Increased tap targets, simpler layouts
sm (640px):  Standard mobile layout
md (768px):  Tablet adjustments
lg (1024px): Desktop layout
xl (1280px): Full-width optimizations
```

## Animation Guidelines

```
Duration:     200ms (fast interactions)
              300ms (standard transitions)
              500ms (longer sequences)

Easing:       ease-in-out (natural feel)
              ease-out (appear)
              ease-in (disappear)

Use For:      Hover states, modal opens,
              navigation transitions,
              notification appearances
```

---

## Usage Examples

### Dark Mode Page Layout
```
[HEADER: #1e293b with light text]
┌──────────────────────────────────┐
│ [SIDEBAR: #0f172a with           │
│  colored icons]                  │
│                [CONTENT: #0f172a] │
│    ┌──────────────────────────┐   │
│    │ [CARD: #1e293b]          │   │
│    │ text: light white        │   │
│    │ border: #475569          │   │
│    │ ┌──input: white──────┐   │   │
│    │ │ on focus: green    │   │   │
│    │ └────────────────────┘   │   │
│    │ [BTN: green]             │   │
│    └──────────────────────────┘   │
│                                    │
└──────────────────────────────────┘
[FOOTER: #1e293b with medium text]
```

### Sidebar Icon Colors
```
🏠 Home           → Green
👥 Users          → Blue  
✈️  Flights        → Amber
⚙️  Settings       → Purple
🔒 Security       → Red
📊 Analytics      → Cyan
```

---

**Theme**: Modern Dark Mode
**Primary Color**: Bright Green (#10b981)
**Accessibility**: WCAG AAA Compliant
**Updated**: Complete dark mode redesign
