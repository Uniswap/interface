import { transparentize } from 'polished'
import React, { useMemo } from 'react'
import styled, {
  ThemeProvider as StyledComponentsThemeProvider,
  createGlobalStyle,
  css,
  DefaultTheme,
} from 'styled-components'
import { useIsDarkMode } from '../state/user/hooks'
import { Text, TextProps } from 'rebass'
import { Colors } from './styled'
import swapBottomBg from '../assets/images/tele/swapBottomBg.svg'

export * from './components'

const MEDIA_WIDTHS = {
  upToExtraSmall: 500,
  upToSmall: 720,
  upToMedium: 960,
  upToLarge: 1280,
}

const mediaWidthTemplates: { [width in keyof typeof MEDIA_WIDTHS]: typeof css } = Object.keys(MEDIA_WIDTHS).reduce(
  (accumulator, size) => {
    ; (accumulator as any)[size] = (a: any, b: any, c: any) => css`
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

export function colors(darkMode: boolean): Colors {
  return {
    // base
    white,
    black,

    // text
    text1: darkMode ? '#D7DCE0' : '#D7DCE0',
    text2: darkMode ? '#D7DCE0' : '#D7DCE0',
    text3: darkMode ? '#6C7284' : '#6C7284',
    text4: darkMode ? '#565A69' : '#565A69',
    text5: darkMode ? '#2C2F36' : '#2C2F36',
    textBlack: darkMode ? '#05050E' : '#05050E',

    // backgrounds / greys
    bg1: darkMode ? '#212429' : '#212429',
    bg2: darkMode ? 'rgba(5, 5, 14, 0.8)' : 'rgba(5, 5, 14, 0.8)',
    bg3: darkMode ? '#40444F' : '#40444F',
    bg4: darkMode ? '#565A69' : '#565A69',
    bg5: darkMode ? '#6C7284' : '#6C7284',


    //specialty colors
    modalBG: darkMode ? 'rgba(0,0,0,.425)' : 'rgba(0,0,0,.425)',
    advancedBG: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.1)',

    //primary colors
    // green
    // white
    primary2: darkMode ? '#FFFFFF' : '#FFFFFF',
    primary3: darkMode ? '#4D8FEA' : '#4D8FEA',
    primary4: darkMode ? '#376bad70' : '#376bad70',
    primary5: darkMode ? '#153d6f70' : '#153d6f70',

    // 黑白灰
    common1: darkMode ? '#05050e' : '#05050e',
    common2: darkMode ? '#FFFFFF' : '#FFFFFF',
    common3: darkMode ? '#9b9b9f' : '#9b9b9f',
    // green
    primary1: darkMode ? '#39E1BA' : '#39E1BA',
    primary1Hover: darkMode ? '#74EACF' : '#74EACF',

    bgSwap: darkMode ? '#1d2f38' : '#1d2f38',
    colorTransparent: darkMode ? 'transparent' : 'transparent',
    bgSwapInput: darkMode ? 'rgba(5, 5, 14, 0.5)' : 'rgba(5, 5, 14, 0.5)',



    // color text
    primaryText1: darkMode ? '#6da8ff' : '#6da8ff',

    // secondary colors
    secondary1: darkMode ? '#2172E5' : '#2172E5',
    secondary2: darkMode ? '#17000b26' : '#17000b26',
    secondary3: darkMode ? '#17000b26' : '#17000b26',

    // other
    red1: '#FD4040',
    red2: '#F82D3A',
    red3: '#D60000',
    green1: '#27AE60',
    yellow1: '#FFE270',
    yellow2: '#F3841E',
    blue1: '#2172E5',

    // dont wanna forget these blue yet
    // blue4: darkMode ? '#153d6f70' : '#C4D9F8',
    // blue5: darkMode ? '#153d6f70' : '#EBF4FF',

    textHover: darkMode ? '#05050E' : '#05050E',
    textSelect: darkMode ? '#05050E' : '#05050E',
    textDisable: darkMode ? '#05050E' : '#05050E',

  }
}

export function theme(darkMode: boolean): DefaultTheme {
  return {
    ...colors(darkMode),

    grids: {
      sm: 8,
      md: 12,
      lg: 24,
    },

    //shadows
    shadow1: darkMode ? '#000' : '#2F80ED',

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

const TextWrapper = styled(Text) <{ color: keyof Colors }>`
  color: ${({ color, theme }) => (theme as any)[color]};
`

export const TYPE = {
  main(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text2'} {...props} />
  },
  link(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'primary1'} {...props} />
  },
  black(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text1'} {...props} />
  },
  white(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'white'} {...props} />
  },
  body(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color={'text1'} {...props} />
  },
  largeHeader(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={24} {...props} />
  },
  mediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={20} {...props} />
  },
  subHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
  small(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={11} {...props} />
  },
  blue(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'blue1'} {...props} />
  },
  yellow(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'yellow1'} {...props} />
  },
  darkGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text3'} {...props} />
  },
  gray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'#9b9b9f'} {...props} />
  },
  green01(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'#39E1BA'} {...props} />
  },
  italic(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={12} fontStyle={'italic'} color={'text2'} {...props} />
  },
  error({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={500} color={error ? 'red1' : 'text2'} {...props} />
  },
}

export const FixedGlobalStyle = createGlobalStyle`
html, input, textarea, button {
  font-family: 'Inter', sans-serif;
  font-display: fallback;
}
@supports (font-variation-settings: normal) {
  html, input, textarea, button {
    font-family: 'Inter var', sans-serif;
  }
}

html,
body {
  margin: 0;
  padding: 0;
}

iframe {
  pointer-events: none;
}

a {
   color: ${colors(false).blue1}; 
}

* {
  box-sizing: border-box;
}

button {
  user-select: none;
}

html {
  font-size: 16px;
  font-variant: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;
  
}
`

export const ThemedGlobalStyle = createGlobalStyle`
html {
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.common1};
  /* background: url(${swapBottomBg}) center top 7rem no-repeat rgba(0,0,0,1);
  background-size: 61%; */
  box-sizing: border-box;
  font-size: max(1.56vw, 16px);
  ${({ theme }) => theme.mediaWidth.upToSmall`
    // font-size: max(4.15vw, 16px);
    font-size: 4.15vw;
  `};
}

body {
  /* min-height: 100vh; */
  background-position: 0 -30vh;
  background-repeat: no-repeat;
  background-image: ${({ theme }) =>
    `radial-gradient(50% 50% at 50% 50%, ${transparentize(0.9, theme.primary1)} 0%, ${transparentize(
      1,
      theme.bg1
    )} 100%)`};
}
`
