import React, { useMemo } from 'react'
import { Text, TextProps as TextPropsOriginal } from 'rebass'
import styled, {
  createGlobalStyle,
  css,
  DefaultTheme,
  ThemeProvider as StyledComponentsThemeProvider,
} from 'styled-components/macro'

import { useIsDarkMode } from '../state/user/hooks'
import { Colors } from './styled'

export * from './components'

type TextProps = Omit<TextPropsOriginal, 'css'>

export const MEDIA_WIDTHS = {
  upToExtraSmall: 500,
  upToSmall: 720,
  upToMedium: 960,
  upToLarge: 1280,
}

// Migrating to a standard z-index system https://getbootstrap.com/docs/5.0/layout/z-index/
// Please avoid using deprecated numbers
export enum Z_INDEX {
  deprecated_zero = 0,
  deprecated_content = 1,
  dropdown = 1000,
  sticky = 1020,
  fixed = 1030,
  modalBackdrop = 1040,
  offcanvas = 1050,
  modal = 1060,
  popover = 1070,
  tooltip = 1080,
}

const mediaWidthTemplates: { [width in keyof typeof MEDIA_WIDTHS]: typeof css } = Object.keys(MEDIA_WIDTHS).reduce(
  (accumulator, size) => {
    ;(accumulator as any)[size] = (a: any, b: any, c: any) => css`
      @media (max-width: ${(MEDIA_WIDTHS as any)[size]}px) {
        ${css(a, b, c)}
      }
    `
    return accumulator
  },
  {}
) as any

const white = '#FFFFFF'
const black = '#000000'

function colors(darkMode: boolean): Colors {
  return {
    darkMode,
    // base
    white,
    black,

    // text
    text1: darkMode ? '#FFFFFF' : '#000000',
    text2: darkMode ? '#C3C5CB' : '#6C86AD',
    text3: darkMode ? '#8F96AC' : '#6E727D',
    text4: darkMode ? '#B2B9D2' : '#C3C5CB',
    text5: darkMode ? '#2C2F36' : '#EDEEF2',

    // backgrounds / greys
    bg0: darkMode ? '#17161A' : '#FFFFFF',
    bg1: darkMode ? '#212121' : '#FFFFFF',
    bg2: darkMode ? '#292929' : '#F3F5FA',
    bg3: darkMode ? '#40444F' : '#EDF1FF',
    bg4: darkMode ? '#565A69' : '#ECF0F9',
    bg5: darkMode ? '#6C7284' : '#F3F5FA',
    bg6: darkMode ? '#17161A' : '#ecf1f8',

    //specialty colors
    modalBG: darkMode ? 'rgba(0,0,0,.425)' : 'rgba(0,0,0,0.3)',
    advancedBG: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.6)',

    //primary colors
    primary1: darkMode ? '#945DC8' : '#2F8AF5',
    primary2: darkMode ? '#9F6DCE' : '#2F8AF5D9',
    primary3: darkMode ? '#A97DD3' : '#2F8AF590',
    primary4: darkMode ? '#8554B470' : '#2F8AF560',
    primary5: darkMode ? '#764AA070' : '#2F8AF530',

    // color text
    primaryText1: darkMode ? '#FFFFFF' : '#2f8af5',

    // secondary colors
    secondary1: darkMode ? '#2D9CDB' : '#2D9CDB',
    secondary2: darkMode ? '#17000b26' : '#F6DDE8',
    secondary3: darkMode ? '#17000b26' : '#2F8AF530',

    // other
    red1: darkMode ? '#FF4343' : '#DA2D2B',
    red2: darkMode ? '#F82D3A' : '#DF1F38',
    red3: '#D60000',
    green1: darkMode ? '#27AE60' : '#007D35',
    yellow1: '#E3A507',
    yellow2: '#FF8F00',
    yellow3: '#F3B71E',
    blue1: darkMode ? '#2172E5' : '#0068FC',
    blue2: darkMode ? '#5199FF' : '#0068FC',
    purple1: darkMode ? '#945DC8' : '#764aa0',
    error: darkMode ? '#EB5757' : '#DF1F38',
    success: darkMode ? '#27AE60' : '#007D35',
    warning: '#FF8F00',

    // dont wanna forget these blue yet
    blue4: darkMode ? '#764aa070' : '#C4D9F8',
    // blue5: darkMode ? '#764aa070' : '#EBF4FF',
  }
}

function theme(darkMode: boolean): DefaultTheme {
  return {
    ...colors(darkMode),

    grids: {
      sm: 8,
      md: 12,
      lg: 24,
    },

    //shadows
    shadow1: darkMode ? '#000' : '#2F80ED',
    shadow2: darkMode ? '#17161A' : '#E2E9F6',
    shadow3: darkMode ? '#292929' : '#E2E9F6',

    // media queries
    mediaWidth: mediaWidthTemplates,

    // css snippets
    flexColumnNoWrap: css`
      display: flex;
      flex-flow: column nowrap;
    `,
    flexRowNoWrap: css`
      display: flex;
      flex-flow: row nowrap;
    `,
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useIsDarkMode()

  const themeObject = useMemo(() => theme(darkMode), [darkMode])

  return <StyledComponentsThemeProvider theme={themeObject}>{children}</StyledComponentsThemeProvider>
}

const TextWrapper = styled(Text)<{ color: keyof Colors }>`
  color: ${({ color, theme }) => (theme as any)[color]};
`

export const TYPE = {
  largeHeader(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={24} {...props} />
  },
  mediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={20} {...props} />
  },
  subHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={18} {...props} />
  },
  body(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color={'text1'} {...props} />
  },
  small(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
  italic(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} fontStyle={'italic'} color={'text2'} {...props} />
  },
  main(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'text2'} {...props} />
  },
  link(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'primary1'} {...props} />
  },
  label(props: TextProps) {
    return <TextWrapper fontWeight={600} color={'text1'} {...props} />
  },
  black(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'text1'} {...props} />
  },
  white(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'white'} {...props} />
  },
  blue(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'blue1'} {...props} />
  },
  purple(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'primary1'} {...props} />
  },
  yellow(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'yellow3'} {...props} />
  },
  darkGray(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'text2'} {...props} />
  },
  gray(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'bg3'} {...props} />
  },
  success(props: TextProps) {
    return <TextWrapper fontWeight={400} color={'green1'} {...props} />
  },
  error({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={400} color={error ? 'red1' : 'text2'} {...props} />
  },
}

export const ThemedGlobalStyle = createGlobalStyle`
  html {
    color: ${({ theme }) => theme.text1};
    background-color: ${({ theme }) => theme.black} !important;
  }

  a {
    color: ${({ theme }) => theme.blue1};
  }
`
