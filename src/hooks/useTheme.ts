import { useContext } from 'react'
import { ThemeContext } from 'styled-components/macro'

export default function useTheme() {
  return useContext(ThemeContext)
}
