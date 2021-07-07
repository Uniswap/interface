import { ThemeContext } from 'styled-components/macro'
import { useContext } from 'react'

export default function useTheme() {
  return useContext(ThemeContext)
}
