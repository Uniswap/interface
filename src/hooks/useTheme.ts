import { useContext } from 'react'
import { ThemeContext } from 'styled-components'

export default function useTheme() {
  return useContext(ThemeContext)
}
