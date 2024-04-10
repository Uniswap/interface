import { OpaqueColorValue } from 'react-native'
import { ColorTokens, ThemeKeys, useTheme } from 'tamagui'

export type DynamicColor = ColorTokens | string | OpaqueColorValue

export const useSporeColors = useTheme as unknown as () => {
  [key in ThemeKeys]: {
    val: ColorTokens
    get: () => DynamicColor
    variable: string
  }
}
