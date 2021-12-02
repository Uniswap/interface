/* eslint-disable no-restricted-imports */
import assert from 'assert'
import merge from 'lodash/merge'
import { transparentize } from 'polished'
import { readableColor } from 'polished'
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { Icon } from 'react-feather'
import styled, {
  css as styledCss,
  keyframes as styledKeyframes,
  ThemedBaseStyledInterface,
  ThemedCssFunction,
  ThemeProvider as StyledProvider,
  ThemeProviderComponent,
  useTheme as useStyled,
} from 'styled-components/macro'

import { Colors, Theme } from './theme'

export type { Colors, Theme } from './theme'
export type Color = keyof Colors

export default styled as unknown as ThemedBaseStyledInterface<Theme>
export const css = styledCss as unknown as ThemedCssFunction<Theme>
export const keyframes = styledKeyframes
export const useTheme = useStyled as unknown as () => Theme

interface IconOptions {
  color?: Color | 'currentColor'
}

export function icon(Icon: Icon, { color = 'secondary' }: IconOptions = {}) {
  return styled(Icon)<{ theme: Theme }>`
    clip-path: stroke-box;
    height: 1em;
    stroke: ${({ theme }) => (color === 'currentColor' ? 'currentColor' : theme[color])};
    width: 1em;
  `
}

const light: Colors = {
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
  contrast: '#000000',

  // state
  active: '#2172E5',
  success: '#27AE60',
  warning: '#F3B71E',
  error: '#FD4040',
}

const dark: Colors = {
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
  contrast: '#FFFFFF',

  // state
  active: '#2172E5',
  success: '#27AE60',
  warning: '#F3B71E',
  error: '#FD4040',
}

export function getDynamicTheme(color: string, theme: Theme): Theme {
  const primary = readableColor(color, light.primary, dark.primary)
  const darkMode = JSON.parse(readableColor(color, 'true', 'false', false))
  const interactive = transparentize(0.46, primary)
  return {
    ...theme,
    darkMode,

    // surface
    module: color,
    interactive,
    outline: transparentize(0.76, primary),

    // text
    primary: transparentize(0.4, primary),
    secondary: transparentize(0.46, primary),
    hint: transparentize(0.76, primary),
    contrast: readableColor(interactive),
  }
}

export function getDefaultTheme(): Theme {
  return {
    darkMode: true,
    fontFamily: '"Inter var", sans-serif',
    borderRadius: 1,
    light,
    dark,
  }
}

interface ThemeProviderProps {
  theme?: Partial<Theme>
  children: ReactNode
}

const ThemedProvider = StyledProvider as unknown as ThemeProviderComponent<Theme>
const OriginalTheme = createContext<Theme | undefined>(undefined)

export function Provider({ theme, children }: ThemeProviderProps) {
  const value: Theme = useMemo(() => {
    const value = merge({}, getDefaultTheme(), theme)
    const colors: Colors = value.darkMode ? value.dark : value.light
    return merge({}, colors, value)
  }, [theme])
  return (
    <OriginalTheme.Provider value={value}>
      <ThemedProvider theme={value}>{children}</ThemedProvider>
    </OriginalTheme.Provider>
  )
}

interface DynamicThemeProviderProps {
  color?: string
  children: ReactNode
}

/** Applies a dynamic theme. */
export function DynamicProvider({ color, children }: DynamicThemeProviderProps) {
  const theme = useTheme()
  const value = useMemo(() => (color ? getDynamicTheme(color, theme) : theme), [color, theme])
  return <ThemedProvider theme={value}>{children}</ThemedProvider>
}

/** Applies the original theme, ignoring any dynamic theme. */
export function OriginalProvider({ children }: { children: ReactNode }) {
  const theme = useContext(OriginalTheme)
  assert(theme)
  return <ThemedProvider theme={theme}>{children}</ThemedProvider>
}
