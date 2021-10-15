import { ReactNode } from 'react'
// eslint-disable-next-line no-restricted-imports
import styled, {
  ThemedBaseStyledInterface,
  ThemeProvider as StyledProvider,
  ThemeProviderComponent,
  useTheme as useStyled,
} from 'styled-components/macro'

import { Colors, Theme } from './theme'

export type { Colors, Theme } from './theme'
export type Color = keyof Colors

export default styled as unknown as ThemedBaseStyledInterface<Theme>
export const useTheme = useStyled as unknown as () => Theme

function colors(darkMode: boolean): Colors {
  return {
    // surface
    accent: '#2172E5',
    container: '#191B1F',
    module: '#2C2F36',
    interactive: '#40444F',
    outline: '#565A59',
    dialog: '#000000',

    // text
    primary: darkMode ? '#FFFFFF' : '#000000',
    secondary: '#888D9B',
    hint: '#6C7284',

    // state
    active: '#2172E5',
    success: '#27AE60',
    warning: '#F3B71E',
    error: '#FD4040',
  }
}

export function getTheme(darkMode: boolean): Theme {
  return {
    ...colors(darkMode),
    fontFamily: '"Inter var", sans-serif',
    borderRadius: 1,
  }
}

interface ThemeProviderProps {
  theme: Theme
  children: ReactNode
}

const ThemedProvider = StyledProvider as unknown as ThemeProviderComponent<Theme>

export function Provider({ theme, children }: ThemeProviderProps) {
  return <ThemedProvider theme={theme}>{children}</ThemedProvider>
}
