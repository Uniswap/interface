import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { useGetRangeDisplay } from 'uniswap/src/features/positions/hooks/useGetRangeDisplay'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { shouldReverseForWaterfall } from 'uniswap/src/features/tokens/waterfallPriority'

/**
 * A position's price range as displayed: min/max in waterfall order, with a v2 pair's implicit
 * 0 → ∞ range filled in. `hasRange` is false for a v3/v4 position whose ticks weren't served.
 */
export function usePositionRangeDisplay(position: PositionInfo): {
  minPrice: string
  maxPrice: string
  tokenASymbol: string
  tokenBSymbol: string
  pricesInverted: boolean
  hasRange: boolean
} {
  const pricesInverted = shouldReverseForWaterfall(position.currency0Amount.currency, position.currency1Amount.currency)
  const isV2 = position.version === ProtocolVersion.V2

  const priceOrdering = useMemo(() => {
    if (isV2) {
      return { quote: position.currency1Amount.currency, base: position.currency0Amount.currency }
    }
    if (!position.position) {
      return {}
    }
    return {
      priceLower: position.position.token0PriceLower,
      priceUpper: position.position.token0PriceUpper,
      quote: position.position.amount1.currency,
      base: position.position.amount0.currency,
    }
  }, [isV2, position])

  const { minPrice, maxPrice, tokenASymbol, tokenBSymbol } = useGetRangeDisplay({
    priceOrdering,
    tickSpacing: position.tickSpacing,
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    pricesInverted,
  })

  return {
    minPrice: isV2 ? '0' : minPrice,
    maxPrice: isV2 ? '∞' : maxPrice,
    tokenASymbol,
    tokenBSymbol,
    pricesInverted,
    hasRange: isV2 || (position.tickLower !== undefined && position.tickUpper !== undefined),
  }
}
