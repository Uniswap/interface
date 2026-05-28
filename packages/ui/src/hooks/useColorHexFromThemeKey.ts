import { ColorTokens, ThemeKeys } from 'tamagui'
import { DynamicColor, useSporeColors } from 'ui/src/hooks/useSporeColors'

export type ColorHexFromThemeKey = {
  val: ColorTokens
  get: () => DynamicColor
  variable: string
}

/**
 * Hook that returns a color value from the theme string such as neutral1
 * @param color - Theme key for the desired color
 * @returns Color object with:
 * - val: raw color value
 * - get(): returns CSS var on Web (avoids re-renders) and raw value on native
 */
export function useColorHexFromThemeKey(color: ThemeKeys): ColorHexFromThemeKey {
  const colors = useSporeColors()
  const colorFromTheme = colors[color]

  return colorFromTheme
}
