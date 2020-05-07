import React, { useEffect } from 'react'
import styled, { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle, css } from 'styled-components'
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

export const theme = darkMode => ({
  // base
  white,
  black,

  // text
  text1: darkMode ? '#FFFFFF' : '#000000',
  text2: darkMode ? '#CED0D9' : '#565A69',
  text3: darkMode ? '#6C7284' : '#888D9B',
  text4: darkMode ? '#565A69' : '#C3C5CB',
  text5: '#EDEEF2',

  // backgrounds / greys
  bg1: darkMode ? '#212429' : '#FFFFFF',
  bg2: darkMode ? '#2C2F36' : '#F7F8FA',
  bg3: darkMode ? '#40444F' : '#EDEEF2',
  bg4: darkMode ? '#565A69' : '#CED0D9',
  bg5: darkMode ? '#565A69' : '#888D9B',

  modalBG: darkMode ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)',
  advancedBG: darkMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.6)',

  //blues
  blue1: darkMode ? '#2172E5' : '#ff007a',
  blue2: darkMode ? '#3680E7' : '#1966D2',
  blue3: darkMode ? '#4D8FEA' : '#165BBB',
  // blue4: darkMode ? '#153d6f70' : '#C4D9F8',
  // blue5: darkMode ? '#153d6f70' : '#EBF4FF',
  blue4: darkMode ? '#153d6f70' : '#F6DDE8',
  blue5: darkMode ? '#153d6f70' : '#FDEAF1',

  buttonSecondaryText: darkMode ? '#6da8ff' : '#ff007a',

  // blue1: '#ff007a',
  // blue4: '#F6DDE8',
  // blue5: '#FDEAF1',

  // pinks
  pink1: '#DC6BE5',
  pink2: darkMode ? '#2172E5' : '#ff007a',
  pink3: darkMode ? '#17000b26' : '#F6DDE8',
  pink4: darkMode ? '#17000b26' : '#FDEAF1',

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

const TextWrapper = styled(Text)`
  color = ${({ color, theme }) => theme[color]}
`

export const TYPE = {
  main: ({ children, ...rest }) => (
    <TextWrapper fontWeight={500} color={'text2'} {...rest}>
      {children}
    </TextWrapper>
  ),
  black: ({ children, ...rest }) => (
    <TextWrapper fontWeight={500} color={'text1'} {...rest}>
      {children}
    </TextWrapper>
  ),
  largeHeader: ({ children, ...rest }) => (
    <TextWrapper fontWeight={600} fontSize={24} {...rest}>
      {children}
    </TextWrapper>
  ),
  mediumHeader: ({ children, ...rest }) => (
    <TextWrapper fontWeight={500} fontSize={20} color={'text1'} {...rest}>
      {children}
    </TextWrapper>
  ),
  subHeader: ({ children, ...rest }) => (
    <TextWrapper fontWeight={400} fontSize={14} color={'text1'} {...rest}>
      {children}
    </TextWrapper>
  ),
  body: ({ children, ...rest }) => (
    <TextWrapper fontWeight={400} fontSize={16} color={'text1'} {...rest}>
      {children}
    </TextWrapper>
  ),
  blue: ({ children, ...rest }) => (
    <TextWrapper fontWeight={500} color={'blue1'} {...rest}>
      {children}
    </TextWrapper>
  ),
  yellow: ({ children, ...rest }) => (
    <TextWrapper fontWeight={500} color={'yellow2'} {...rest}>
      {children}
    </TextWrapper>
  ),
  green: ({ children, ...rest }) => (
    <TextWrapper fontWeight={500} color={'green1'} {...rest}>
      {children}
    </TextWrapper>
  ),
  gray: ({ children, ...rest }) => (
    <TextWrapper fontWeight={500} color={'bg3'} {...rest}>
      {children}
    </TextWrapper>
  ),
  darkGray: ({ children, ...rest }) => (
    <TextWrapper fontWeight={500} color={'text3'} {...rest}>
      {children}
    </TextWrapper>
  ),
  italic: ({ children, ...rest }) => (
    <TextWrapper fontWeight={500} fontSize={12} fontStyle={'italic'} color={'text2'} {...rest}>
      {children}
    </TextWrapper>
  ),
  error: ({ children, error, ...rest }) => (
    <TextWrapper fontWeight={500} color={error ? 'red1' : 'text2'} {...rest}>
      {children}
    </TextWrapper>
  )
}

export const GlobalStyle = createGlobalStyle`
@import url('https://rsms.me/inter/inter.css');
html { font-family: 'Inter', sans-serif; letter-spacing: -0.018em;}
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
