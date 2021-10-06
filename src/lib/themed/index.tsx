import { ReactNode } from 'react'
import styled, {
  ThemedBaseStyledInterface,
  ThemeProvider as StyledProvider,
  ThemeProviderComponent,
  useTheme as useStyled,
} from 'styled-components/macro'

import { Colors, Theme } from './theme'
export type { Theme } from './theme'

const themed = styled as unknown as ThemedBaseStyledInterface<Theme>
export default themed
export const useTheme = useStyled as unknown as () => Theme

function colors(darkMode: boolean): Colors {
  return {
    text1: darkMode ? '#FFFFFF' : '#000000',
    text2: darkMode ? '#888D9B' : '#565A69',

    icon1: darkMode ? '#888D9B' : '#EDEEF2',
    icon2: darkMode ? '#FFFFFF' : '#565A69',

    bg1: darkMode ? '#191B1F' : '#FFFFFF',
    bg2: darkMode ? '#2C2F36' : '#EDEEF2',
    bg3: darkMode ? '#000000' : '#FFFFFF',

    confirm: darkMode ? '#2172E5' : '#E8006F',
    success: darkMode ? '#27AE60' : '#007D35',
    warning: '#FF8F00',
    error: darkMode ? '#FD4040' : '#DF1F38',
  }
}

export function getTheme(darkMode: boolean): Theme {
  return {
    ...colors(darkMode),
    font: '"Inter var", sans-serif',
    borderRadius: 16,
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
