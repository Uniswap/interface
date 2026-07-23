# @universe/tailwind

Shared Tailwind v4 design tokens — the single source of truth for the Uniswap
palette, typography, radii, breakpoints, and semantic color aliases across every
surface (web, extension, mobile, and the Mycelium component library).

There is **no build step**: consumers `@import` the CSS directly and their
bundler (Vite + `@tailwindcss/vite` on web, uniwind's Metro transformer on
React Native) compiles it.

## Entrypoints

| Import | Platform | Contents |
|---|---|---|
| `@import "@universe/tailwind/tailwind"` | Web (Vite) | Full bundle: `theme` + `variables` + `base` + `animations` |
| `@import "@universe/tailwind/native"` | React Native (uniwind) | Shared palette + semantic aliases in uniwind's `@variant` theme format |
| `@import "@universe/tailwind/theme"` | Any | Raw `@theme` palette only (no semantic/dark layer) |
| `@import "@universe/tailwind/fonts"` | Web | Basel Grotesk `@font-face` declarations |
| `@universe/tailwind/types` | Any | TypeScript token vocabulary (`TypographyClass`, `ColorToken`, …) |

### Web (Vite + `@tailwindcss/vite`)

```css
@import "tailwindcss";
@import "@universe/tailwind/tailwind";
```

### React Native (uniwind)

```css
/* apps/<app>/src/global.css */
@import "tailwindcss";
@import "uniwind";
@import "@universe/tailwind/native";
@source "../..";
```

Drive dark mode from the app's resolved color scheme:

```ts
import { Uniwind } from 'uniwind'
import { useSelectedColorScheme } from 'uniswap/src/features/appearance/hooks'

const scheme = useSelectedColorScheme() // 'light' | 'dark'
useEffect(() => Uniwind.setTheme(scheme), [scheme])
```

## Architecture

```
css/theme.css        @theme palette — selector-free, 100% hex/rgba. Shared by BOTH web and native.
css/variables.css    Web semantic aliases + shadcn compat (:root/.dark + @theme inline).
css/base.css         @custom-variant dark + @layer base resets (web).
css/animations.css   @keyframes + state-driven classes (web only).
css/fonts.css        Basel Grotesk @font-face (web; RN loads fonts natively).
tailwind.css         Web bundle entry.
native.css           React Native (uniwind) entry.
```

### Why web and native diverge (a little)

The token **values** are shared verbatim. Only the dark-mode **mechanism**
differs and cannot be unified in one selector:

- **Web** flips a `.dark` ancestor class (`@custom-variant dark (&:is(.dark *))`).
- **uniwind** has no DOM; it switches themes via `Uniwind.setTheme()`, so the
  light/dark overrides live in `@layer theme { :root { @variant … } }` buckets.

`src/tokens.parity.test.ts` enforces that the two dialects expose the identical
set of semantic color utilities, and that uniwind's "every theme defines the
same variables" rule holds — so the layers can't silently drift.

> Requires `tailwindcss >= 4.0.0` as a peer dependency.
