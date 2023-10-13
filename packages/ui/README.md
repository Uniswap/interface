## Where to put code

The `ui` package should be where we put all low level interface components. It should *not* contain components that are specific to any one app, or which touch app-level data in any way. A good rule of thumb is: if it deals with redux state, it goes into `packages/app`, if it only handles internal state and is generally useful across multiple apps, it goes in `ui`.

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
