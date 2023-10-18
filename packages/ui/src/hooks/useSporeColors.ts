import { ColorTokens, ThemeKeys, useTheme } from 'tamagui'

export const useSporeColors = useTheme as unknown as () => {
  [key in ThemeKeys]: {
    val: ColorTokens
    get: () => ColorTokens | string
    variable: string
  }
}
