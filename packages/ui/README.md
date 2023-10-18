## Where to put code

The `ui` package should be where we put all low level interface components that are shared between apps (or will likely be shared). It should *not* contain components that are specific to any one app, or which touch app-level data in any way.

A good rule of thumb is: if it deals with app-specific state (eg anything thats stored in redux) or has a very complex interface, then:

- If it's specific to just one app, put it in that app, like `apps/mobile` or `apps/web`.
- Else if it's shared between mutliple apps, put it in `packages/app`.

Otherwise, if it's simpler, put it in `packages/ui`.

Think of `packages/ui` as our low level and more pure building blocks for interface, and `packages/app` as our higher level shared components that deal with complex dependencies or app-specific state.

## When to use `styled()` vs inline props

Rule of thumb:

1. If it's used only once, always prefer inline for simplicity's sake. It avoids having to name things and avoids having to jump up/down to see what's going on.

2. If it's used more than once, you may want to pull it out into a `styled()` component that is shared between the multiple usages to avoid inconsistencies. But it still should live as close to the usage as possible, so if used only within a single file, keep it within that file. Or if used only within a single app but in a few files, keep it in that app.

3. If it's used across multiple apps or has a strong potential to be, see the "Where to put code" section above.

## Optimization

The Tamagui optimizing compiler will extract CSS and do tree-flattening optimizations for all of `ui`, and for all usages of components from `ui` in the apps.

Where it will bail out of optimization is if you define a new `styled()` component outside of `ui` and then use that component.

But this is fine! It will still be pretty fast.

Also, in the future we can turn `enableDynamicEvaluation` which enables the compiler to optimize those one-off `styled()` definitions within apps to also extract CSS and flatten. Its still a bit of a beta feature so no rush to turn it on, and likely it's fast enough that we don't need to worry about it.

## Accessing colors

We've made a hook `useSporeColors()` which gives you access to the current theme, and you can access the values off it as follows:

```tsx
import { useSporeColors } from 'ui/src'

function MyComponent() {
  const colors = useSporeColors()

  colors.accent1.val // returns something like #fff
  colors.accent1.get() // returns a "dynamic" color value
}
```

### When to use `.get()` vs `.val`

Using `.val` will always return the original color value as a string, like `#ffffff`.

Using `.get()` returns a dynamic value depending on the platform and avoids re-rendering when themes change between light and dark. This is really nice for fast changing between light/dark mode (and in the future if we use sub-themes, it would also avoid re-renders there).

On the web, `.get()` returns a CSS variable string. For example `colors.accent1.get()` would return `var(--accent1)`.

On iOS, `.get()` returns [DynamicColorIOS](https://reactnative.dev/docs/dynamiccolorios). This is actually just a plain object that looks like:

```js
{
  dynamic: {
    light: '#fff',
    dark: '#000'
  }
}
```

So in general - prefer `.get()` but use val when:

- On mobile if you are passing a value to some sort of component that doesn't know how to deal with the `DynamicColorIOS`, use .val. For example ExpoLinearGradient, some SVG props, or things like reanimated animated styles.
- On web, if you are passing to external components that don't support CSS variables.

There's one more option: Tamagui takes one argument to get, which is the platform it should optimize for. So if you do `.get('web')`, this will return the CSS variable on web, but on native falls back to `.val`.

## useStyle, useProps, and usePropsAndStyle

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
