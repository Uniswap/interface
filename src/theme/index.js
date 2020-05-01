import React, { useEffect } from 'react'
import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle, css } from 'styled-components'
import { getQueryParam, checkSupportedTheme } from '../utils'
import { SUPPORTED_THEMES } from '../constants'
import { useDarkModeManager } from '../contexts/LocalStorage'
import { Text } from 'rebass'

export * from './components'

const MEDIA_WIDTHS = {
  upToExtraSmall: 500,
  upToSmall: 600,
  upToMedium: 960,
  upToLarge: 1280
}

const mediaWidthTemplates = Object.keys(MEDIA_WIDTHS).reduce((accumulator, size) => {
  accumulator[size] = (...args) => css`
    @media (max-width: ${MEDIA_WIDTHS[size]}px) {
      ${css(...args)}
    }
  `
  return accumulator
}, {})

const white = '#FFFFFF'
const black = '#000000'

export default function ThemeProvider({ children }) {
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const themeURL = checkSupportedTheme(getQueryParam(window.location, 'theme'))
  const themeToRender = themeURL
    ? themeURL.toUpperCase() === SUPPORTED_THEMES.DARK
      ? true
      : themeURL.toUpperCase() === SUPPORTED_THEMES.LIGHT
      ? false
      : darkMode
    : darkMode
  useEffect(() => {
    toggleDarkMode(themeToRender)
  }, [toggleDarkMode, themeToRender])
  return <StyledComponentsThemeProvider theme={theme(themeToRender)}>{children}</StyledComponentsThemeProvider>
}

const theme = darkMode => ({
  // base
  white,
  black,

  // text
  text1: darkMode ? '#FFFFFF' : '#000000',
  text2: darkMode ? '#888D9B' : '#565A69',
  text3: darkMode ? '#6C7284' : '#888D9B',
  text4: '#C3C5CB',
  text5: '#EDEEF2',

  // backgrounds / greys
  bg1: darkMode ? '#191B1F' : '#FFFFFF',
  bg2: darkMode ? '#2C2F36' : '#F7F8FA',
  bg3: darkMode ? '#40444F' : '#EDEEF2',
  bg4: darkMode ? '#565A69' : '#CED0D9',
  bg5: darkMode ? '#565A69' : '#888D9B',

  //blues
  blue1: '#2172E5',
  blue2: darkMode ? '#3680E7' : '#1966D2',
  blue3: darkMode ? '#4D8FEA' : '#165BBB',
  blue4: '#C4D9F8',
  blue5: '#EBF4FF',

  // pinks
  pink1: '#DC6BE5',
  pink2: '#ff007a',

  // other
  red1: '#FF6871',
  green1: '#27AE60',
  yellow1: '#FFE270',
  yellow2: '#F3841E',

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
})

export const TYPE = {
  main: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().text2} {...rest}>
      {children}
    </Text>
  ),
  black: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().text1} {...rest}>
      {children}
    </Text>
  ),
  largeHeader: ({ children, ...rest }) => (
    <Text fontWeight={600} fontSize={24} {...rest}>
      {children}
    </Text>
  ),
  mediumHeader: ({ children, ...rest }) => (
    <Text fontWeight={500} fontSize={20} color={theme().text1} {...rest}>
      {children}
    </Text>
  ),
  subHeader: ({ children, ...rest }) => (
    <Text fontWeight={400} fontSize={14} color={theme().text1} {...rest}>
      {children}
    </Text>
  ),
  body: ({ children, ...rest }) => (
    <Text fontWeight={400} fontSize={16} color={'#191B1F'} {...rest}>
      {children}
    </Text>
  ),
  blue: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().blue1} {...rest}>
      {children}
    </Text>
  ),
  yellow: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().yellow2} {...rest}>
      {children}
    </Text>
  ),
  green: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().green1} {...rest}>
      {children}
    </Text>
  ),
  gray: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().bg3} {...rest}>
      {children}
    </Text>
  ),
  darkGray: ({ children, ...rest }) => (
    <Text fontWeight={500} color={theme().text3} {...rest}>
      {children}
    </Text>
  ),
  italic: ({ children, ...rest }) => (
    <Text fontWeight={500} fontSize={12} fontStyle={'italic'} color={theme().text2} {...rest}>
      {children}
    </Text>
  ),
  error: ({ children, error, ...rest }) => (
    <Text fontWeight={500} color={error ? theme().red1 : theme().text2} {...rest}>
      {children}
    </Text>
  )
}

export const GlobalStyle = createGlobalStyle`
  @import url('https://rsms.me/inter/inter.css');
  html { 
    font-family: 'Inter', sans-serif; 
    letter-spacing: -0.018em;
    font-feature-settings: 'cv01', 'cv02', 'cv03', 'cv04';
    }
  @supports (font-variation-settings: normal) {
    html { font-family: 'Inter var', sans-serif; }
  }
  
  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;    
  }

  body > div {
    height: 100%;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
}

  html {
    font-size: 16px;
    font-variant: none;
    color: ${({ theme }) => theme.text1};
    background-color: ${({ theme }) => theme.bg2};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
`
