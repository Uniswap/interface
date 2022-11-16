import { getTheme } from './index'

type InferredTheme = ReturnType<typeof getTheme>

declare module 'styled-components/macro' {
  export interface DefaultTheme extends InferredTheme {
    darkMode: boolean
  }
}
