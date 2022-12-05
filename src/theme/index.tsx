import { rootCssString } from 'nft/css/cssStringFromTheme'
import React, { useMemo } from 'react'
import { createGlobalStyle, css, ThemeProvider as StyledComponentsThemeProvider } from 'styled-components/macro'

import { useIsDarkMode } from '../state/user/hooks'
import { darkTheme, lightTheme } from './colors'
import { darkDeprecatedTheme, lightDeprecatedTheme } from './deprecatedColors'

// todo - remove and replace imports with a new path
export * from './components'
export * from './components/text'

export const MEDIA_WIDTHS = {
  deprecated_upToExtraSmall: 500,
  deprecated_upToSmall: 720,
  deprecated_upToMedium: 960,
  deprecated_upToLarge: 1280,
}

const BREAKPOINTS = {
  xs: 396,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
  xxxl: 1920,
}

// deprecated - please use the ones in styles.ts file
const transitions = {
  duration: {
    slow: '500ms',
    medium: '250ms',
    fast: '125ms',
  },
  timing: {
    ease: 'ease',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
}

const opacities = {
  hover: 0.6,
  click: 0.4,
  disabled: 0.5,
  enabled: 1,
}

const deprecated_mediaWidthTemplates: { [width in keyof typeof MEDIA_WIDTHS]: typeof css } = Object.keys(
  MEDIA_WIDTHS
).reduce((accumulator, size) => {
  ;(accumulator as any)[size] = (a: any, b: any, c: any) => css`
    @media (max-width: ${(MEDIA_WIDTHS as any)[size]}px) {
      ${css(a, b, c)}
    }
  `
  return accumulator
}, {}) as any

function getSettings(darkMode: boolean) {
  return {
    grids: {
      sm: 8,
      md: 12,
      lg: 24,
    },

    // shadows
    shadow1: darkMode ? '#000' : '#2F80ED',

    // media queries
    deprecated_mediaWidth: deprecated_mediaWidthTemplates,

    // deprecated - please use hardcoded exported values instead of
    // adding to the theme object
    breakpoint: BREAKPOINTS,
    transition: transitions,
    opacity: opacities,
  }
}

function getTheme(darkMode: boolean) {
  return {
    darkMode,
    ...(darkMode ? darkTheme : lightTheme),
    ...(darkMode ? darkDeprecatedTheme : lightDeprecatedTheme),
    ...getSettings(darkMode),
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useIsDarkMode()
  const themeObject = useMemo(() => getTheme(darkMode), [darkMode])
  return <StyledComponentsThemeProvider theme={themeObject}>{children}</StyledComponentsThemeProvider>
}

export const ThemedGlobalStyle = createGlobalStyle`
  html {
    color: ${({ theme }) => theme.deprecated_text1};
    background-color: ${({ theme }) => theme.background} !important;
  }

  summary::-webkit-details-marker {
    display:none;
  }

  a {
    color: ${({ theme }) => theme.deprecated_blue1}; 
  }

  :root {
    ${({ theme }) => rootCssString(theme.darkMode)}
  }
`
