import { getTheme } from 'theme/index'

type InferredTheme = ReturnType<typeof getTheme>

declare module 'styled-components' {
  export interface DefaultTheme extends InferredTheme {
    // An interface declaring no members is equivalent to its supertype.
    // That's why we redeclare a `darkMode` property in order to tell TypeScript our Theme is an InferredTheme
    darkMode: boolean
  }
}
