import { useSporeColors } from '@universe/mycelium'
import type { UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'

/**
 * Hook that returns a color value from the theme string such as neutral1
 * @param color - Theme key for the desired color
 * @returns Color object with:
 * - val: raw color value
 * - get(): returns CSS var on Web (avoids re-renders) and raw value on native
 */
export function useColorHexFromThemeKey(
  color: keyof UseSporeColorsReturn,
): UseSporeColorsReturn[keyof UseSporeColorsReturn] {
  const colors = useSporeColors()
  return colors[color]
}
