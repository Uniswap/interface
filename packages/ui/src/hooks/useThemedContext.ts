import { useContext } from 'react'
import { AnyIfEmpty } from 'react-redux'
import { ThemeContext, DefaultTheme } from 'styled-components'

export default function useThemedContext() {
  const theme = useContext(ThemeContext as React.Context<AnyIfEmpty<DefaultTheme>>)
  return theme
}
