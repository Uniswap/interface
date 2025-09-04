# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

This is the **UI package** within the Universe monorepo - a cross-platform component library that provides low-level, reusable UI components for all Uniswap applications (web, iOS, Android).

### Key Principles
- Components must be platform-agnostic and work across web, iOS, and Android
- No business logic - only presentation and interaction
- Components wrap Tamagui implementation details to provide a clean API
- Only export what's needed from `ui/src`

## Development Commands

```bash
# Build icon components from SVG files
bun ui build:icons

# Build only missing icon components
bun ui build:icons:missing

# Run linting (ESLint with max warnings = 0)
bun ui lint

# Run tests
bun ui test

# Type checking
bun ui typecheck

# Format code
bun ui format
```

## Component Development

### Creating a New Component

1. Create component file in appropriate directory under `src/components/`
2. Use Tamagui's styled components for styling
3. Follow existing patterns for TypeScript interfaces and props
4. Export from `src/index.ts` if it should be public

Example component structure:
```tsx
import { styled } from '@tamagui/core'
import { ComponentProps, forwardRef } from 'react'

interface MyComponentProps extends ComponentProps<typeof StyledComponent> {
  variant?: 'primary' | 'secondary'
  // ... other props
}

const StyledComponent = styled(View, {
  // Tamagui styling
})

export const MyComponent = forwardRef<View, MyComponentProps>(
  ({ variant = 'primary', ...rest }, ref) => {
    return <StyledComponent ref={ref} {...rest} />
  }
)
```

### Platform-Specific Code

Use file extensions for platform-specific implementations:
- `.native.tsx` - React Native (iOS/Android)
- `.web.tsx` - Web only
- `.tsx` - Shared across all platforms

## Styling Guidelines

### Using Theme Tokens

Always use theme tokens instead of hardcoded values:
```tsx
// ✅ Good
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

const colors = useSporeColors()
<View style={{ backgroundColor: colors.surface1.val }} />

// ❌ Bad
<View style={{ backgroundColor: '#000000' }} />
```

### Tamagui Styling

Use Tamagui's style props for consistent theming:
```tsx
<Text
  color="$neutral1"
  fontSize="$medium"
  $short={{ fontSize: '$small' }} // Responsive
/>
```

### Responsive Breakpoints

Available breakpoints:
- `$short` - Height < 668px
- `$tall` - Height > 668px  
- `$gtSm` - Width >= 640px
- `$gtMd` - Width >= 768px
- `$gtLg` - Width >= 1024px

## Icons and Logos

### Adding New Icons

1. Place SVG file in `src/assets/icons/`
2. Run `bun ui build:icons`
3. Import from `ui/src/components/icons`

Icons are automatically generated with:
- Regular and animated versions
- Theme color support via `currentColor`
- Consistent sizing and props

### Using Icons
```tsx
import { AlertTriangle } from 'ui/src/components/icons'

// Regular icon
<AlertTriangle color="$statusCritical" size="$icon.20" />

// Animated icon
<AlertTriangle.Animated
  animationSequence={fadeInAnimation}
  color="$neutral2"
/>
```

## Core Components

### Flex
Main layout component with flex properties:
```tsx
<Flex row gap="$spacing12" justify="space-between">
  {/* content */}
</Flex>
```

### Text
Typography component with variants:
```tsx
<Text variant="body1" color="$neutral1">
  Content
</Text>
```

Variants: `heading1-3`, `subheading1-2`, `body1-3`, `buttonLabel1-4`, `monospace`

### AnimatedFlex
For animations using React Native Reanimated:
```tsx
<AnimatedFlex entering={FadeIn} exiting={FadeOut}>
  {/* content */}
</AnimatedFlex>
```

## Theme System

### Colors
Access via `useSporeColors()` hook:
```tsx
const colors = useSporeColors()
// colors.neutral1, colors.accent1, colors.surface1, etc.
```

### Spacing
Use theme spacing tokens: `$spacing2`, `$spacing4`, `$spacing8`, etc.

### Typography
Font tokens: `$small`, `$medium`, `$large`, etc.

## Testing

### Component Testing Pattern
```tsx
import { render } from 'ui/src/test/test-utils'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <MyComponent title="Test" />
    )
    expect(getByText('Test')).toBeTruthy()
  })
})
```

### Mocking Platform
```tsx
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}))
```

## Performance Considerations

1. Use `memo` for complex components that re-render frequently
2. Avoid inline styles - use Tamagui styled components
3. Use `FlatList` for long lists on mobile
4. Lazy load heavy components with dynamic imports

## Common Patterns

### Loading States
```tsx
<Flex centered fill>
  <SpinningLoader size="$icon.24" />
</Flex>
```

### Animations
```tsx
import { FadeIn, FadeOut } from 'ui/src/animations'

<AnimatedFlex entering={FadeIn} exiting={FadeOut}>
  {/* content */}
</AnimatedFlex>
```

### QR Codes
```tsx
import { QRCodeDisplay } from 'ui/src/components/QRCodeScanner/QRCode'

<QRCodeDisplay 
  data={address}
  size={200}
  color={colors.neutral1.val}
/>
```

## Integration with Other Packages

When using UI components in other packages:
```tsx
import { Flex, Text, useSporeColors } from 'ui/src'
```

## Debugging Tips

1. Check platform-specific files if behavior differs between platforms
2. Verify theme tokens are being used correctly
3. Use React DevTools to inspect Tamagui style props
4. Check if component is exported from `src/index.ts`

## Do's and Don'ts

### Do's
- Use existing components before creating new ones
- Follow established patterns for consistency
- Test on all platforms (web, iOS, Android)
- Use TypeScript strictly
- Keep components focused and single-purpose

### Don'ts
- Don't add business logic to UI components
- Don't use hardcoded colors or dimensions
- Don't create components that only work on one platform
- Don't expose Tamagui internals in component APIs
- Don't forget to export public components from index.ts
