import type { ColorTokens } from 'ui/src'
import type { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { getIsValidSporeColor } from 'ui/src/theme/tokens'

/** Resolve an optional color token to a CSS/RN color value; defaults to neutral1. */
export function resolveAnimatedNumberColor(colors: UseSporeColorsReturn, color?: ColorTokens): string {
  if (!color || !getIsValidSporeColor(color)) {
    return String(colors.neutral1.val)
  }

  const key = color.slice(1) as keyof UseSporeColorsReturn
  return String(colors[key].val)
}
