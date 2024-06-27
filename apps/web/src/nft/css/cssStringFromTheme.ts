import { darkTheme } from 'nft/themes/darkTheme'
import { lightTheme } from 'nft/themes/lightTheme'

import { cssObjectFromTheme } from './cssObjectFromTheme'
import { Theme } from './sprinkles.css'

function cssStringFromTheme(theme: Theme | (() => Theme), options: { extends?: Theme | (() => Theme) } = {}) {
  return Object.entries(cssObjectFromTheme(theme, options))
    .map(([key, value]) => `${key}:${value};`)
    .join('')
}

export function rootCssString(isDarkMode: boolean) {
  return isDarkMode ? cssStringFromTheme(darkTheme) : cssStringFromTheme(lightTheme)
}
