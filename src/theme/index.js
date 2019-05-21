import React from 'react'
import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle, css } from 'styled-components'

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

const mediaHeightTemplates = Object.keys(MEDIA_WIDTHS).reduce((accumulator, size) => {
  accumulator[size] = (...args) => css`
    @media (max-height: ${MEDIA_WIDTHS[size] / (16 / 9)}px) {
      ${css(...args)}
    }
  `
  return accumulator
}, {})

const flexColumnNoWrap = css`
  display: flex;
  flex-flow: column nowrap;
`

const flexRowNoWrap = css`
  display: flex;
  flex-flow: row nowrap;
`

const theme = {
  white: '#FFFFFF',
  black: '#000000',
  // grays
  concreteGray: '#FAFAFA',
  mercuryGray: '#E1E1E1',
  silverGray: '#C4C4C4',
  chaliceGray: '#AEAEAE',
  doveGray: '#737373',
  mineshaftGray: '#2B2B2B',
  // blues
  zumthorBlue: '#EBF4FF',
  malibuBlue: '#5CA2FF',
  royalBlue: '#2F80ED',
  // purples
  wisteriaPurple: '#DC6BE5',
  // reds
  salmonRed: '#FF6871',
  // orange
  pizazzOrange: '#FF8F05',
  // pink
  uniswapPink: '#DC6BE5',
  // media queries
  mediaWidth: mediaWidthTemplates,
  mediaHeight: mediaHeightTemplates,
  // css snippets
  flexColumnNoWrap,
  flexRowNoWrap
}

export default function ThemeProvider({ children }) {
  return <StyledComponentsThemeProvider theme={theme}>{children}</StyledComponentsThemeProvider>
}

export const GlobalStyle = createGlobalStyle`
  @import url('https://rsms.me/inter/inter.css');
  html { font-family: 'Inter', sans-serif; }
  @supports (font-variation-settings: normal) {
    html { font-family: 'Inter var', sans-serif; }
  }
  
  html,
  body {
    padding: 0;
    margin: 0;
    font-variant: none;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  #root {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    height: 100vh;
    width: 100vw;
    overflow-x: hidden;
    overflow-y: auto;
    background-color: ${({ theme }) => theme.white};
    z-index: 100;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
    @media only screen and (min-width: 768px) {
      justify-content: center;
      align-items: center;
    }
  }

  #modal-root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 200;
  }

  .loader {
    border: 1px solid transparent;
    border-top: 1px solid ${props => props.theme.royalBlue};
    border-radius: 50%;
    width: 0.75rem;
    height: 0.75rem;
    margin-right: 0.25rem;
    animation: spin 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`
