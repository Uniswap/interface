import { shade, tint, transparentize } from 'polished'
import { readableColor } from 'polished'
import { ReactNode, useMemo } from 'react'
import { hex } from 'wcag-contrast'

import { ThemedProvider, useTheme } from './styled'
import { Colors, Theme } from './theme'

export type { Colors, Theme } from './theme'
export type Color = keyof Colors

type DynamicColors = Pick<Colors, 'interactive' | 'outline' | 'primary' | 'secondary' | 'onInteractive'>

const black = '#000000'
const white = '#FFFFFF'

const light: DynamicColors = {
  // surface
  interactive: transparentize(1 - 0.54, black),
  outline: transparentize(1 - 0.24, black),

  // text
  primary: black,
  secondary: transparentize(1 - 0.64, black),
  onInteractive: white,
}

const dark: DynamicColors = {
  // surface
  interactive: transparentize(1 - 0.48, white),
  outline: transparentize(1 - 0.12, white),

  // text
  primary: white,
  secondary: transparentize(1 - 0.6, white),
  onInteractive: black,
}

export function getDynamicTheme(theme: Theme, color: string) {
  const darkMode = JSON.parse(readableColor(color, 'false', 'true', false))
  return {
    ...theme,
    darkMode,

    // surface
    module: color,

    ...(darkMode ? dark : light),
  }
}

function getAccessibleColor(theme: Theme, color: string) {
  const dynamic = getDynamicTheme(theme, color)
  const { darkMode } = dynamic
  let { primary } = dynamic
  let AAscore = hex(color, primary)
  while (AAscore < 3) {
    color = darkMode ? tint(0.005, color) : shade(0.005, color)
    primary = getDynamicTheme(theme, color).primary
    AAscore = hex(color, primary)
  }
  return color
}

interface DynamicThemeProviderProps {
  color?: string
  children: ReactNode
}

export function DynamicThemeProvider({ color, children }: DynamicThemeProviderProps) {
  const theme = useTheme()
  const value = useMemo(() => {
    if (!color) {
      return theme
    }

    const accessibleColor = getAccessibleColor(theme, color)
    return accessibleColor ? getDynamicTheme(theme, accessibleColor) : theme
  }, [theme, color])
  return <ThemedProvider theme={value}>{children}</ThemedProvider>
}
