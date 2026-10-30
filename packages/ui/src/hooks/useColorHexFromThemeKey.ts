import { useSporeColors } from '@universe/mycelium'
import { DynamicColor } from '@universe/mycelium/theme-hooks-compat'
import type { SporeColorToken, SporeThemeKeys } from 'ui/src/theme/color/types'

export type ColorHexFromThemeKey = {
  val: SporeColorToken
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
export function useColorHexFromThemeKey(color: SporeThemeKeys): ColorHexFromThemeKey {
  const colors = useSporeColors()
  const colorFromTheme = colors[color]

  return colorFromTheme
}
