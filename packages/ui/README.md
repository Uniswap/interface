# `ui` Package

This package holds a component library and themes that can be used across all apps.

## UI Package Philosophy

The `ui` package contains all low level components that are shared between apps. It should *not* contain components that are specific to any one app or Uniswap business logic. Each component should be guided by the following principles:

- All components should be compatible with all platforms.
- Wrap as many implementation details as possible, including any direct exports from Tamagui.
- Export only what’s needed from `ui/src` or another allowlisted path.
- Only include components that will be used beyond a single feature.

Components that are shared between all applications but encode Uniswap business logic should most likely be placed in the `uniswap` package!

## Icons and Logos

Icons and logos are placed in `ui/src/components/{icons|logos}`. These files are generated from placing the file in `packages/ui/src/assets/icons` or `packages/ui/src/assets/logos/svg` and running the generate command(s):

```bash
# Generate all icons
bun ui build:icons
# Generate any icons that do not yet have an existing TS file
bun ui build:icons:missing
```

When adding an SVG, please ensure you replace color references as needed with `currentColor` to ensure the asset respects the color property when used.

Custom icons that take props can be added to the same icons import by adding the file in `packages/ui/src/components/icons/index.ts`.

## Core Components

Many base components are available in the UI library. While some are customized `tamagui` elements or even fully custom elements, many are simple or direct exposure of `tamagui` elements. If you would like to use any `tamagui` elements, please add them through this library to ensure a layer of abstraction between tamagui and our usage when possible.

Below are summaries of the most commonly used elements.

### Flex

The `Flex` component is the core organizational element of the UI library, acting as a base of a flexbox styling approach. Shortcuts are available for `row`, `grow`, `shrink`, `fill`, and `centered`. All other styling props can be added directly as needed.

### Text

The `Text` element is the core element for displaying text through the app. The `variant` prop takes in the text variant from our design system (e.g `heading1`, `body2`, etc.) that is desired. All other text styling props can be added directly as needed.

## Theme and Platform

### Theming

Theming is applied through two primary methods:

1. Any components that take in design systems values (e.g `heading1`, `body2`, etc.) will automatically respect the theme.
2. In all other cases, `useSporeColors` will return the current theme colors to be used in any component.

To force a specific theme usage, the `Theme` wrapper will ensure other theme elements pick up the specific theme.

```javascript
<Theme name="dark">
  ...
</Theme>
```

### Screen Size Differences

All breakpoints for both vertical and horizontal sizing have been defined in `packages/ui/src/theme/breakpoints.ts`.

To account for screen size references, components take in props to adapt custom style per breakpoint, like so:

```javascript
<Flex
  margin="20"
  $short={{ margin: 10 }}
>
  ...
</Flex>
```

When components cannot take in these props or a value needs to be resued multiple times, the `useMedia` hook allows these same breakpoint values to be defined programmatically.

### Colors

We've made a hook `useSporeColors()` which gives you access to the current theme, and you can access the values off it as follows:

```tsx
import { useSporeColors } from 'ui/src'

function MyComponent() {
  const colors = useSporeColors()

  colors.accent1.val // returns something like #fff
  colors.accent1.get() // returns a "dynamic" color value
}
```

#### When to use `.get()` vs `.val`

After some discussion we've come to prefer `.val` by default. This will always return the raw string color (in our case hex color) on all platforms, whereas `.get()` returns either an Object (iOS) or a string, which can cause issues when used with things like animations, or external components.

Using .val has some performance downside vs .get in that all usages of .val will re-render when themes change, whereas .get will avoid re-renders on iOS and Web by optimizing to platform-specific constructs. On iOS, it optimizes to [DynamicColorIOS](https://reactnative.dev/docs/dynamiccolorios), on web a CSS variable like `var(--accent1)`.

So if/when we notice slowness in our light/dark mode change, we'll want to check if our usages of .val are causing expensive re-renders and see if we can convert them to .get.

In summary:

- Prefer `.val` which always returns the original color string, like `#fff`.
- Using `.get()` returns a dynamic value depending on the platform and avoids re-rendering when themes change between light and dark. This is nice for fast light/dark mode switching (and in the future if we use sub-themes, it would also avoid re-renders there).
  - On Android it returns the same as .val, `#fff`
  - On iOS, it returns an object like `{ dynamic: { light: '#fff', dark: '#000' } }`
  - On the web, it returns a CSS variable string, `var(--colorName)`
  - You can call `.get('web')` to only optimize for web, or `.get('ios')` to only optimize for ios.
