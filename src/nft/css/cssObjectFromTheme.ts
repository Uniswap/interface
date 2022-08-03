import { assignInlineVars } from '@vanilla-extract/dynamic'

import { Theme, themeVars } from './sprinkles.css'

const resolveTheme = (theme: Theme | (() => Theme)) => (typeof theme === 'function' ? theme() : theme)

export function cssObjectFromTheme(
  theme: Theme | (() => Theme),
  { extends: baseTheme }: { extends?: Theme | (() => Theme) } = {}
) {
  const resolvedThemeVars = {
    // We use an object spread here to ensure it's a plain object since vanilla-extract's
    // var objects have a custom 'toString' method that returns a CSS string, but we don't
    // want to leak this to our consumers since they're unaware we're using vanilla-extract.
    // Instead, we want them to handle this explicitly via our 'cssStringFromTheme' function.
    ...assignInlineVars(themeVars, resolveTheme(theme)),
  }

  if (!baseTheme) {
    return resolvedThemeVars
  }

  const resolvedBaseThemeVars = assignInlineVars(themeVars, resolveTheme(baseTheme))

  const filteredVars = Object.fromEntries(
    Object.entries(resolvedThemeVars).filter(([varName, value]) => value !== resolvedBaseThemeVars[varName])
  )

  return filteredVars
}
