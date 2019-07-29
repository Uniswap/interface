import React from 'react'
import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle } from 'styled-components'
import theme from './index.js'

const defaultContextData = {
  dark: false,
  toggle: () => {}
}

const ThemeContext = React.createContext(defaultContextData)
const useTheme = () => React.useContext(ThemeContext)

const useEffectDarkMode = () => {
  const [themeState, setThemeState] = React.useState({
    dark: false,
    hasThemeMounted: false
  })
  React.useEffect(() => {
    const lsDark = localStorage.getItem('dark') === 'true'
    setThemeState({ ...themeState, dark: lsDark, hasThemeMounted: true })
  }, [themeState, setThemeState])

  return [themeState, setThemeState]
}

const ThemeProvider = ({ children }) => {
  const [themeState, setThemeState] = useEffectDarkMode()

  if (!themeState.hasThemeMounted) {
    return <div />
  }

  const toggle = () => {
    const dark = !themeState.dark
    localStorage.setItem('dark', JSON.stringify(dark))
    setThemeState({ ...themeState, dark })
  }

  const computedTheme = themeState.dark ? theme('dark') : theme('light')

  return (
    <StyledComponentsThemeProvider theme={computedTheme}>
      <ThemeContext.Provider
        value={{
          dark: themeState.dark,
          toggle
        }}
      >
        {children}
      </ThemeContext.Provider>
    </StyledComponentsThemeProvider>
  )
}

export { ThemeProvider, useTheme }

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
    font-size: 16px;
    font-variant: none;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    background-color:${({ theme }) => theme.darkBG};
    color:${({ theme }) => theme.black};
  }

  #root {
    ${({ theme }) => theme.flexColumnNoWrap}
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
  }
`
