import React, { useMemo } from 'react'
import styled, {
  ThemeProvider as StyledComponentsThemeProvider,
  createGlobalStyle,
  css,
  DefaultTheme
} from 'styled-components'
import { useIsDarkMode } from '../state/user/hooks'
import { Text, TextProps } from 'rebass'
import { Colors } from './styled'

export * from './components'

const MEDIA_WIDTHS = {
  upToExtraSmall: 576,
  upToSmall: 768,
  upToMedium: 992,
  upToLarge: 1200,
  upToXL: 1400,
  upToXXL: 1800
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
    text: darkMode ? '#ffffff' : '#333333',
    darkText: '#333333',
    textReverse: darkMode ? '#333333' : '#ffffff',
    subText: darkMode ? '#A7B6BD' : '#868787',

    text2: darkMode ? '#C3C5CB' : '#565A69',
    text3: darkMode ? '#6C7284' : '#888D9B',
    text4: darkMode ? '#565A69' : '#C3C5CB',
    text6: darkMode ? '#6d8591' : '#565A69',
    text7: darkMode ? '#c9d2d7' : '#565A69',
    text8: darkMode ? '#5c6468' : '#5c6468',
    text9: darkMode ? '#859aa5' : '#859aa5',
    text10: darkMode ? '#00a2f7' : '#00a2f7',
    text11: darkMode ? '#f4f4f4' : '#565A69',
    text12: darkMode ? '#4aff8c' : '#0CE15B',
    text13: darkMode ? '#f5f5f5' : '#333333',
    disableText: darkMode ? '#6C7284' : '#A7B6BD',

    // backgrounds
    tableHeader: darkMode ? '#303E46' : '#F9F9F9',
    background: darkMode ? '#243036' : '#ffffff',
    bg1: darkMode ? '#212429' : '#FFFFFF',
    bg2: darkMode ? '#222c31' : '#F7F8FA',
    bg3: darkMode ? '#40444F' : '#dcdbdc',
    bg4: darkMode ? '#565A69' : '#CED0D9',
    bg5: darkMode ? '#6C7284' : '#888D9B',
    bg6: darkMode ? '#243036' : '#FFFFFF',
    bg7: darkMode ? '#31CB9E' : '#98e5ce',
    bg8: darkMode ? '#1d7a5f' : '#31CB9E',
    bg9: darkMode ? '#1d2a32' : '#ecebeb',
    bg10: darkMode ? '#263239' : '#f5f5f5',
    bg11: darkMode ? '#1b2226' : '#ebeaea',
    bg12: darkMode ? '#11171a' : '#f5f5f5',
    bg13: darkMode ? '#1f292e' : '#e8e9ed',
    bg14: darkMode ? '#40505a' : '#a9a9a9',
    bg15: darkMode ? '#1f292e' : '#f5f5f5',
    bg16: darkMode ? '#1f292e' : '#ffffff',
    bg17: darkMode ? '#31cb9e33' : '#31cb9e1a',
    bg18: darkMode ? '#1a4052' : '#ecebeb',
    bg19: darkMode ? '#222c31' : '#ffffff',
    bg20: darkMode ? '#243036' : '#F5F5F5',
    bg21: darkMode
      ? 'linear-gradient(90deg, rgba(29, 122, 95, 0.5) 0%, rgba(29, 122, 95, 0) 100%)'
      : 'linear-gradient(90deg, rgba(49, 203, 158, 0.15) 0%, rgba(49, 203, 158, 0) 100%)',
    bg22: darkMode
      ? 'linear-gradient(90deg, rgba(255, 83, 123, 0.4) 0%, rgba(255, 83, 123, 0) 100%)'
      : 'linear-gradient(90deg, rgba(255, 83, 123, 0.15) 0%, rgba(255, 83, 123, 0) 100%)',

    buttonBlack: darkMode ? '#11171a' : '#f5f5f5',
    buttonGray: darkMode ? '#40444f' : '#dcdbdc',
    poweredByText: darkMode ? '#A7B6BD' : '#5C6468',

    //specialty colors
    modalBG: darkMode ? 'rgba(0,0,0,.425)' : 'rgba(0,0,0,0.3)',
    advancedBG: darkMode ? '#1d272b' : '#ecebeb',
    advancedBorder: darkMode ? '#303e46' : '#dcdbdc',

    //primary colors
    primary: '#31CB9E',
    primary2: darkMode ? '#3680E7' : '#3680E7',
    primary3: darkMode ? '#4D8FEA' : '#4D8FEA',
    primary4: darkMode ? '#376bad70' : '#376bad70',
    primary5: darkMode ? '#153d6f70' : '#31cb9e',

    // color text
    primaryText2: darkMode ? '#a7b6bd' : '#13191b',

    // secondary colors
    secondary1: darkMode ? '#31cb9e' : '#31cb9e',
    secondary2: darkMode ? '#17000b26' : '#17000b26',
    secondary3: darkMode ? '#17000b26' : '#17000b26',
    secondary4: '#2FC99E',

    // border colors
    border: darkMode ? '#40505A' : '#dcdbdc ',
    btnOutline: darkMode ? '#31cb9e' : '#333333',

    // table colors
    oddRow: darkMode ? '#283339' : '#f4f4f4',
    evenRow: darkMode ? '#303e46' : '#ffffff',

    // other
    red: darkMode ? '#FF537B' : '#FF6871',
    red1: '#FF6871',
    red2: '#F82D3A',
    red3: '#D60000',
    green: '#31CB9E',
    green1: '#27AE60',
    yellow1: '#FFE270',
    yellow2: '#F3841E',
    blue1: '#31cb9e',
    warning: '#FFAF01',
    lightBlue: '#78d5ff',
    darkBlue: '#1183b7',
    blue: darkMode ? '#78d5ff' : '#31cb9e',
    lightGreen: '#98E5CE',
    apr: '#0faaa2'
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
    `,
    darkMode: darkMode
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
    return <TextWrapper fontWeight={500} color={'primary'} {...props} />
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
  h3(props: TextProps) {
    return <TextWrapper fontSize={'18px'} fontWeight={500} color={'#E1F5FE'} lineheight={'21px'} my={0} {...props} />
  },
  small(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={11} {...props} />
  },
  blue(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'primary'} {...props} />
  },
  yellow(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'yellow1'} {...props} />
  },
  darkGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text3'} {...props} />
  },
  gray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'bg3'} {...props} />
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
  font-family: 'Work Sans', 'Inter', sans-serif;
  font-display: fallback;
}
@supports (font-variation-settings: normal) {
  html, input, textarea, button {
    font-family: 'Work Sans', 'Inter var', sans-serif;
  }
}

html,
body {
  margin: 0;
  padding: 0;
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
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => theme.bg2};
}

body {
  min-height: 100vh;
  background: ${({ theme }) => theme.bg12};
}

.staked-only-switch[aria-checked="false"] {
  background: ${({ theme }) => theme.bg14} !important;
}

.staked-only-switch[aria-checked="false"] div {
  background: ${({ theme }) => theme.bg12} !important;
}

.staked-only-switch div {
  background:  ${({ theme }) => theme.primary};
}

#language-selector {
  &:focus-visible {
    outline-width: 0;
  }
}
`
