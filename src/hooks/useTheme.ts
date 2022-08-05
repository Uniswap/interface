import { Context, useContext } from 'react'
import { DefaultTheme, ThemeContext } from 'styled-components'

export default function useTheme() {
  return useContext(ThemeContext as Context<DefaultTheme>)
}
