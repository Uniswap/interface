import React from 'react'
import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle } from 'styled-components'

const theme = {
  uniswapPink: '#DC6BE5',
  royalBlue: '#2f80ed',
  salmonRed: '#ff6871',
  white: '#FFF',
  black: '#000'
}

export default function ThemeProvider({ children }) {
  return <StyledComponentsThemeProvider theme={theme}>{children}</StyledComponentsThemeProvider>
}

export const GlobalStyle = createGlobalStyle`
  @import url('https://rsms.me/inter/inter.css');
  
  html,
  body {
    padding: 0;
    margin: 0;
    font-family: Inter, sans-serif;
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
    background-color: ${props => props.theme.white};
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
