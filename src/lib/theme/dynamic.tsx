import { darken, lighten, opacify, transparentize } from 'polished'
import { readableColor } from 'polished'
import { ReactNode, useMemo } from 'react'
import { hex } from 'wcag-contrast'

import styled, { ThemedProvider, useTheme } from './styled'
import { Colors, ComputedTheme } from './theme'

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

export function getDynamicTheme(theme: ComputedTheme, color: string): ComputedTheme {
  const colors = { light, dark }[readableColor(color, 'light', 'dark', false)]
  return {
    ...theme,
    module: color,
    onHover: opacify(0.25),
    ...colors,
  }
}

function getAccessibleColor(theme: ComputedTheme, color: string) {
  const dynamic = getDynamicTheme(theme, color)
  const { darkMode } = dynamic
  let { primary } = dynamic
  let AAscore = hex(color, primary)
  while (AAscore < 3) {
    color = darkMode ? lighten(0.005, color) : darken(0.005, color)
    primary = getDynamicTheme(theme, color).primary
    AAscore = hex(color, primary)
  }
  return color
}

interface DynamicThemeProviderProps {
  color?: string
  children: ReactNode
}

const ColorProvider = styled.div`
  color: ${({ theme }) => theme.primary};
`

export function DynamicThemeProvider({ color, children }: DynamicThemeProviderProps) {
  const theme = useTheme()
  const value = useMemo(() => {
    if (!color) {
      return theme
    }

    const accessibleColor = getAccessibleColor(theme, color)
    return accessibleColor ? getDynamicTheme(theme, accessibleColor) : theme
  }, [theme, color])
  return (
    <ThemedProvider theme={value}>
      <ColorProvider>{children}</ColorProvider>
    </ThemedProvider>
  )
}
