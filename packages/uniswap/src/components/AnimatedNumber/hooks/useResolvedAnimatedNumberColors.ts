import { useMemo } from 'react'
import type { ColorTokens } from 'ui/src'
import type { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { getFadedDecimalColor } from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'
import { resolveAnimatedNumberColor } from 'uniswap/src/components/AnimatedNumber/utils/resolveAnimatedNumberColor'

export type ResolvedAnimatedNumberColors = {
  baseColor: string
  hasCustomColor: boolean
  decimalPartColor: string
  balanceChangeColor: string | undefined
}

type UseResolvedAnimatedNumberColorsParams = {
  colors: UseSporeColorsReturn
  color?: ColorTokens
  shouldFadeDecimals: boolean
  nextColor?: string
}

export function useResolvedAnimatedNumberColors({
  colors,
  color,
  shouldFadeDecimals,
  nextColor,
}: UseResolvedAnimatedNumberColorsParams): ResolvedAnimatedNumberColors {
  return useMemo(() => {
    const baseColor = resolveAnimatedNumberColor(colors, color)
    const hasCustomColor = color !== undefined
    const decimalPartColor = getFadedDecimalColor({
      shouldFadeDecimals,
      baseColor,
      fadedDecimalColor: colors.neutral2.val,
      hasCustomColor,
    })
    const balanceChangeColor = hasCustomColor ? undefined : nextColor

    return { baseColor, hasCustomColor, decimalPartColor, balanceChangeColor }
  }, [colors, color, shouldFadeDecimals, nextColor])
}
