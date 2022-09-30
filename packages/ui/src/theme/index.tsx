import React, { useMemo } from 'react'
import { isMobile } from 'react-device-detect'
import { Text, TextProps } from 'rebass'
import styled, {
  createGlobalStyle,
  css,
  DefaultTheme,
  ThemeProvider as StyledComponentsThemeProvider
} from 'styled-components'

import swapBottomBg from '../assets/images/tele/swapBottomBg.svg'
import { useIsDarkMode } from '../state/user/hooks'
import { Colors } from './styled'

export * from './components'

const MEDIA_WIDTHS = {
  upToExtraSmall: 500,
  upToSmall: 720,
  upToMedium: 960,
  upToLarge: 1280
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

export function colors(darkMode: boolean): Colors {
  return {
    // base
    white,
    black,

    // text
    text1: darkMode ? '#FFFFFF' : '#FFFFFF',
    text2: darkMode ? '#FFFFFF' : '#FFFFFF',
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
    textDisable: darkMode ? '#05050E' : '#05050E'
  }
}

export function theme(darkMode: boolean): DefaultTheme {
  return {
    ...colors(darkMode),

    grids: {
      sm: 8,
      md: 12,
      lg: 24
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
    `
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
  }
}

export const FixedGlobalStyle = createGlobalStyle`
html, input, textarea, button {
  font-family: 'Inter', sans-serif;
  font-display: fallback;
}
@supports (font-variation-settings: normal) {
  html, input, textarea, button {
    font-family: 'Poppins';
  }
}


@font-face {
  font-family: 'Poppins';
  src: url('../assets/fonts/font-poppins-regular.ttf');
}
html,
body {
  font-family: 'Poppins';
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden auto;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  font-family: 'Poppins';
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
  font-variant: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;
  
}

::-webkit-scrollbar {
  width: 0.4rem;
  height: 8px;
  background-color: rgba(0, 0, 0, 0);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
}
`

export const ThemedGlobalStyle = createGlobalStyle`
html {
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.common1};
  /* background: url(${swapBottomBg}) center top 7rem no-repeat rgba(0,0,0,1);
  background-size: 61%; */
  box-sizing: border-box;
  // font-size: min(1.56vw, 16px);
  font-size: ${() => (isMobile ? '14px' : 'min(calc(10.718px + 0.171vw),14px)')};// 750:12 to 1920:14
  // font-size: ${() => (isMobile ? '14px' : 'min(calc(9.436px + 0.342vw),16px)')};// 750:12 to 1920:16

  // ${({ theme }) => theme.mediaWidth.upToSmall`
  //   // font-size: max(4.15vw, 16px);
  //   font-size: 4.15vw;
  // `};

}

body {
  /* min-height: 100vh; */
}
#root {
  width: 100%;
  height: 100%;
}
.title {
  font-size: 1.5rem !important;
}
.secondary-title {
  font-size: 1.25rem !important;
}
.text-emphasize {
  font-size: 1.125rem !important;
}
.text {
  font-size: 1rem !important;
}
.text-small {
  font-size: 0.875rem !important;
}
.text-detail {
  font-size: 0.75rem !important;
}


.primary-button-text {
  font-size: 1.5rem !important;
}
.secondary-button-text {
  font-size: 1rem !important;
}
.thirdary-button-text {
  font-size: 0.875rem !important;
}
.forthary-button-text {
  font-size: 0.75rem !important;
}

.biggest-radius {
  border-radius: 3rem!important;
}
.bigger-radius {
  border-radius: 2rem!important;
}
.middle-radius {
  border-radius: 1.5rem!important;
}
.smaller-radius {
  border-radius: 1rem!important;
}
.smallest-radius {
  border-radius: 0.75rem!important;
}
.extreme-small-radius {
  border-radius: 0.5rem!important;
}
`
