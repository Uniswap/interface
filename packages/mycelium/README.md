# @universe/mycelium

Mycelium is Uniswap's shared Tailwind CSS design system for Tailwind v4.

## Usage

### CSS (in your app's main CSS file)

```css
@import "tailwindcss";
@import "@universe/mycelium/tailwind";
@import "@universe/mycelium/fonts"; /* Optional: for web apps */
```

`@universe/mycelium/tailwind` imports:
- Theme tokens (colors, typography, breakpoints, border radius)
- CSS variables (shadows, dark mode)
- Base styles
- Animations

`@universe/mycelium/fonts` imports:
- Basel Grotesk font faces (bundled, no CORS issues)

### JavaScript (for the cn utility)

```typescript
import { cn } from '@universe/mycelium'

// Merge class names with Tailwind conflict resolution
cn('text-sm', 'text-body-1') // => 'text-body-1'
cn('bg-red-500', isActive && 'bg-blue-500') // => conditional classes
```

## What's Included

### Typography Scale
- `text-heading-1`, `text-heading-2`, `text-heading-3`
- `text-subheading-1`, `text-subheading-2`
- `text-body-1`, `text-body-2`, `text-body-3`, `text-body-4`
- `text-button-1`, `text-button-2`, `text-button-3`, `text-button-4`

### Color Tokens
- Semantic: `neutral1-3`, `surface1-5`, `accent1-4`
- Status: `success`, `warning`, `critical`
- Network: `network-ethereum`, `network-optimism`, etc.
- Full palettes: gray, pink, red, yellow, green, blue, gold, magenta, purple

### Animations
- View transitions
- Dialog animations
- Button loading states
- Console terminal effects
- Logo carousel
