import { darken, lighten, opacify, transparentize } from 'polished'
import { readableColor } from 'polished'
import { ReactNode, useMemo } from 'react'
import { hex } from 'wcag-contrast'

import { ThemedProvider, useTheme } from './styled'
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
  const colors = { light, dark }[readableColor(color, 'light', 'dark', false) as 'light' | 'dark']
  return {
    ...theme,
    ...colors,
    module: color,
    onHover: (color: string) => (color === colors.primary ? transparentize(0.4, colors.primary) : opacify(0.25, color)),
  }
}

function getAccessibleColor(theme: ComputedTheme, color: string) {
  const dynamic = getDynamicTheme(theme, color)
  let { primary } = dynamic
  let AAscore = hex(color, primary)
  const contrastify = hex(color, '#000') > hex(color, '#fff') ? darken : lighten
  while (AAscore < 3) {
    color = contrastify(0.005, color)
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
    return getDynamicTheme(theme, accessibleColor)
  }, [theme, color])
  return (
    <ThemedProvider theme={value}>
      <div style={{ color: value.primary }}>{children}</div>
    </ThemedProvider>
  )
}
