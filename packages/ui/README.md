# Uniswap UI

This package holds a component library and themes that can be used across both mobile and web contexts. Below is instructions for both use and development of this package.

## Library Usage

### Core components

Many base components are available in the UI library. Below key use cases are detailed, but many more are available. 

While some are customized `tamagui` elements or even fully custom elements, many are simple or direct exposure of `tamagui` elements. If you would like to use any `tamagui` elements, please add them through this library to ensure a layer of abstraction between tamagui and our usage when possible.

#### Flex

The `Flex` component is the core organizational element of the UI library, acting as a base of a flexbox styling approach. Shortcuts are available for `row`, `grow`, `shrink`, `fill`, and `centered`. All other styling props can be added directly as needed.

#### Text

The `Text` element is the core element for displaying text through the app. The `variant` prop takes in the text variant from our design system (e.g `heading1`, `body2`, etc.) that is desired. All other text styling props can be added directly as needed.

#### Button

The `Button` element is used consistently to ensure action buttons maintain similar action and style, utilizing `size` and `theme` properties to enforce consistent usage. Even when not using either, this component ensures consistent haptics and other implementation details.

#### Icons and Logos

Icons and Logos are made available off a single import as `Icons.*` and `Logos.*`. These files are generated from placing the file in `packages/ui/src/assets/icons` or `packages/ui/src/assets/logos/svg` and running the generate command:

`yarn ui:build:icons`

When adding an SVG, please ensure you replace color references as needed with `currentColor` to ensure the asset respects the color property when used.

Custom icons that take props can be added by adding the file in `packages/ui/src/components/icons/allIcons.tsx`.

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

### Other notable usage

#### Accessing colors

We've made a hook `useSporeColors()` which gives you access to the current theme, and you can access the values off it as follows:

```tsx
import { useSporeColors } from 'ui/src'

function MyComponent() {
  const colors = useSporeColors()

  colors.accent1.val // returns something like #fff
  colors.accent1.get() // returns a "dynamic" color value
}
```

##### When to use `.get()` vs `.val`

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

#### When should you use `styled()` vs inline props

When possible, usage of `styled` should be limited to use within the `ui` package or direct styling only repetition of . In general try to use the following rules:

1. If it's used only once, always prefer inline for simplicity's sake. It avoids having to name things and avoids having to jump between files or places in code to understand styling.

2. If it's used more than once, try to create a component that abstracts properties to the minimum needed. This new component should live as close to the usage as possible, so if used only within a single file, keep it within that file. You should only use `styled` when said component is being used more than once, otherwise defer to inline styles.

3. If it's used across multiple apps or has a strong potential to be, consider extracting it into a shared package. To decide where to place it, see "What code should be placed in the package?"

## Library Design

### What code should be placed in the package?

The `ui` package should be where we put all low level interface components that are shared between apps (or will likely be shared). It should *not* contain components that are specific to any one app, or which touch app-level data in any way.

A good rule of thumb is: if it deals with app-specific state (eg anything thats stored in redux) or has a very complex interface, then:

- If it's specific to just one app, put it in that app.
- Else if it's shared between multiple apps, put it in a shared package above the UI package, e.g `packages/{package}`.

Otherwise, if it's simpler, put it in `packages/ui`.

Think of `packages/ui` as our low level and more pure building blocks for interface, and `packages/{package}` as our higher level shared components that deal with complex dependencies or app-specific state.

### Optimization

The Tamagui optimizing compiler will extract CSS and do tree-flattening optimizations for all of `ui`, and for all usages of components from `ui` in the apps.

Where it will bail out of optimization is if you define a new `styled()` component outside of `ui` and then use that component.

But this is fine! It will still be pretty fast.

Also, in the future we can turn `enableDynamicEvaluation` which enables the compiler to optimize those one-off `styled()` definitions within apps to also extract CSS and flatten. Its still a bit of a beta feature so no rush to turn it on, and likely it's fast enough that we don't need to worry about it.

### useStyle, useProps, and usePropsAndStyle

These three are useful more advanced patterns to get styles or props from Tamagui form into plain objects and [are documented on the Tamagui site](https://tamagui.dev/docs/core/exports#useprops).

In short:

- `useProps`: takes in props returns props as-is just with media queries resolved and shorthands expanded (not transformed so tokens like $color stay as $color)
- `useStyle`: takes in props returns only styles (media queries, shorthands, tokens, etc resolved)
- `usePropsAndStyle`: splits the props and styles apart for you, fully resolves everything

Also the `forComponent` pattern is useful and works with all of them:

```tsx
const CustomText = styled(Text, {
  variants: {
    large: {
      true: {
        fontSize: 100
      }
    }
  }
})

useStyle({ large: true }, { forComponent: CustomText } }) 
// returns { fontSize: 100 }
```
