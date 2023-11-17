import { assignInlineVars } from '@vanilla-extract/dynamic'

import { Theme, themeVars } from './sprinkles.css'

const resolveTheme = (theme: Theme | (() => Theme)) => (typeof theme === 'function' ? theme() : theme)

export function cssObjectFromTheme(
  theme: Theme | (() => Theme),
  { extends: baseTheme }: { extends?: Theme | (() => Theme) } = {}
) {
  const resolvedThemeVars = {
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
