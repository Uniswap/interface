import 'lib/assets/fonts/index.css'

import { mix, transparentize } from 'polished'
import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

import styled, { ThemedProvider } from './styled'
import { Colors, ComputedTheme, Theme } from './theme'

export type { Color, Colors, Theme } from './theme'

export default styled
export * from './dynamic'
export * from './layer'
export * from './styled'
export * as ThemedText from './type'

export const lightTheme: Colors = {
  // surface
  accent: '#FF007A',
  container: '#F7F8FA',
  module: '#E2E3E9',
  interactive: '#CED0D9',
  outline: '#C3C5CB',
  dialog: '#FFFFFF',

  // text
  primary: '#000000',
  secondary: '#565A69',
  hint: '#888D9B',
  onInteractive: '#000000',

  // state
  active: '#2172E5',
  success: '#27AE60',
  warning: '#F3B71E',
  error: '#FD4040',

  currentColor: 'currentColor',
}

export const darkTheme: Colors = {
  // surface
  accent: '#2172E5',
  container: '#191B1F',
  module: '#2C2F36',
  interactive: '#40444F',
  outline: '#565A69',
  dialog: '#000000',

  // text
  primary: '#FFFFFF',
  secondary: '#888D9B',
  hint: '#6C7284',
  onInteractive: '#FFFFFF',

  // state
  active: '#2172E5',
  success: '#27AE60',
  warning: '#F3B71E',
  error: '#FD4040',

  currentColor: 'currentColor',
}

export const defaultTheme = {
  borderRadius: 1,
  fontFamily: '"Inter", sans-serif',
  fontFamilyVariable: '"InterVariable", sans-serif',
  fontFamilyCode: 'IBM Plex Mono',
  tokenColorExtraction: true,
  ...lightTheme,
}

export function useSystemTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
  const [systemTheme, setSystemTheme] = useState(prefersDark.matches ? darkTheme : lightTheme)
  prefersDark.addEventListener('change', (e) => {
    setSystemTheme(e.matches ? darkTheme : lightTheme)
  })
  return systemTheme
}

const ThemeContext = createContext<ComputedTheme>(toComputedTheme(defaultTheme))

interface ThemeProviderProps {
  theme?: Theme
  children: ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const contextTheme = useContext(ThemeContext)
  const value = useMemo(() => {
    return toComputedTheme({
      ...contextTheme,
      ...theme,
    } as Required<Theme>)
  }, [contextTheme, theme])
  return (
    <ThemeContext.Provider value={value}>
      <ThemedProvider theme={value}>{children}</ThemedProvider>
    </ThemeContext.Provider>
  )
}

function toComputedTheme(theme: Required<Theme>): ComputedTheme {
  return {
    ...theme,
    borderRadius: clamp(
      Number.isFinite(theme.borderRadius) ? (theme.borderRadius as number) : theme.borderRadius ? 1 : 0
    ),
    onHover: (color: string) =>
      color === theme.primary ? transparentize(0.4, theme.primary) : mix(0.16, theme.primary, color),
  }

  function clamp(value: number) {
    return Math.min(Math.max(value, 0), 1)
  }
}
