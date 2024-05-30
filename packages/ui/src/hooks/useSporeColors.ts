// until the web app needs all of tamagui, avoid heavy imports there
// eslint-disable-next-line no-restricted-imports
import { ColorTokens, ThemeKeys, useTheme } from '@tamagui/core'

// copied from react-native (avoiding import for web)
type OpaqueColorValue = symbol & { __TYPE__: 'Color' }

export type DynamicColor = ColorTokens | string | OpaqueColorValue

export const useSporeColors = useTheme as unknown as () => {
  [key in ThemeKeys]: {
    val: ColorTokens
    get: () => DynamicColor
    variable: string
  }
}
