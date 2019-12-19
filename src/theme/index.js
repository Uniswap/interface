import React, { useEffect } from 'react'
import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle, css } from 'styled-components'
import { getQueryParam, checkSupportedTheme } from '../utils'
import { SUPPORTED_THEMES } from '../constants'
import { useDarkModeManager } from '../contexts/LocalStorage'

export * from './components'

const MEDIA_WIDTHS = {
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
  white,
  black,
  textColor: darkMode ? white : '#010101',
  greyText: darkMode ? white : '#6C7284',

  // for setting css on <html>
  backgroundColor: darkMode ? '#333639' : white,

  modalBackground: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)',
  inputBackground: darkMode ? '#202124' : white,
  placeholderGray: darkMode ? '#5F5F5F' : '#E1E1E1',
  shadowColor: darkMode ? '#000' : '#2F80ED',

  // grays
  concreteGray: darkMode ? '#292C2F' : '#FAFAFA',
  mercuryGray: darkMode ? '#333333' : '#E1E1E1',
  silverGray: darkMode ? '#737373' : '#C4C4C4',
  chaliceGray: darkMode ? '#7B7B7B' : '#AEAEAE',
  doveGray: darkMode ? '#C4C4C4' : '#737373',

  colors: {
    blue1: darkMode ? '#DC6BE5' : '#D4E4FA',
    blue2: darkMode ? '#1966D2' : '#A9C8F5',
    blue3: darkMode ? '#165BBB' : '#7DACF0',
    blue4: darkMode ? '#2D47A6' : '#5190EB',
    blue5: darkMode ? '#C4D9F8' : '#2172E5',
    blue6: darkMode ? '#C4D9F8' : '#1A5BB6',
    blue7: darkMode ? '#C4D9F8' : '#144489',
    blue8: darkMode ? '#C4D9F8' : '#0E2F5E',
    blue9: darkMode ? '#C4D9F8' : '#191B1F',

    grey1: darkMode ? '#292C2F' : '#F7F8FA',
    grey2: darkMode ? '#F7F8FA' : '#EDEEF2',
    grey3: darkMode ? '#CED0D9' : '#CED0D9',
    grey4: darkMode ? '#888D9B' : '#888D9B',
    grey5: darkMode ? '#888D9B' : '#6C7284',
    grey6: darkMode ? '#565A69' : '#565A69',
    grey7: darkMode ? '#40444F' : '#40444F',
    grey8: darkMode ? '#2C2F36' : '#2C2F36',
    grey9: darkMode ? '#191B1F' : '#191B1F',

    white: '#FFFFFF',

    green1: '#E6F3EC',
    green2: '#27AE60',

    pink1: '#DC6BE5',


     

    pink2: '#FFF8FD',

    yellow1: '#F3BE1E',
    yellow2: '#F7F2E3',

    red1: '#FF6871'
  },

  shadows: {
    small: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    large: '0px 6px 10px rgba(0, 0, 0, 0.15)'
  },

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

export const GlobalStyle = createGlobalStyle`
  @import url('https://rsms.me/inter/inter.css');
  html { font-family: 'Inter', sans-serif; }
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
    color: ${({ theme }) => theme.textColor};
    background-color: ${({ theme }) => theme.backgroundColor};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
`
