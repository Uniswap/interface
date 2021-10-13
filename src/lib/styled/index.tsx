import { ReactNode } from 'react'
import { Text, TextProps as TextPropsWithCss } from 'rebass'
// eslint-disable-next-line no-restricted-imports
import styled, {
  ThemedBaseStyledInterface,
  ThemeProvider as StyledProvider,
  ThemeProviderComponent,
  useTheme as useStyled,
} from 'styled-components/macro'

import { Colors, Theme } from './theme'
export type { Colors, Theme } from './theme'

const themed = styled as unknown as ThemedBaseStyledInterface<Theme>
export default themed
export const useTheme = useStyled as unknown as () => Theme

function colors(darkMode: boolean): Colors {
  const white = '#FFF'
  const black = '#000'

  return {
    white,
    black,

    text: darkMode ? white : black,
    icon: darkMode ? '#888D9B' : '#EDEEF2',
    action: darkMode ? '#2172E5' : '#E8006F',
    selected: darkMode ? '#2172E5' : '#E8006F',

    bg: darkMode ? '#191B1F' : white,
    modalBg: darkMode ? '#2C2F36' : '#EDEEF2',
    alertBg: darkMode ? black : white,

    confirm: darkMode ? '#2172E5' : '#E8006F',
    success: darkMode ? '#27AE60' : '#007D35',
    error: darkMode ? '#FD4040' : '#DF1F38',
  }
}

export function getTheme(darkMode: boolean): Theme {
  return {
    ...colors(darkMode),
    accentOpacity: 0.6,
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

interface TextProps extends Omit<TextPropsWithCss, 'css'> {
  accent?: boolean
}

const TextWrapper = themed(Text)<{ accent: boolean; color?: keyof Colors }>`
  font-family: ${({ theme }) => theme.font};
  color: ${({ color = 'text' as keyof Colors, theme }) => (theme as Theme)[color]};
  opacity: ${({ accent, theme }) => (accent ? theme.accentOpacity : 1.0)};
`

export const TYPE = {
  title(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={16} {...props} />
  },
  label(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={12} {...props} />
  },
  detail(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={12} {...props} />
  },
  text(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={14} {...props} />
  },
  subtext(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
}

export enum Layer {
  MODAL = 10,
  POPOVER = 100,
}
