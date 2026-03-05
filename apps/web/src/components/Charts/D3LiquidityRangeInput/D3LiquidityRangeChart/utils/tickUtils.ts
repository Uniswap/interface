import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import { ChartEntry } from '~/components/Charts/LiquidityRangeInput/types'
import { getTickToPrice, getV4TickToPrice } from '~/utils/getTickToPrice'

/**
 * Snaps a tick to the nearest valid tick boundary based on tickSpacing.
 * Also clamps to valid tick range (MIN_TICK to MAX_TICK).
 */
export function snapTickToSpacing(tick: number, tickSpacing: number): number {
  // Round to integer first (nearestUsableTick requires integers)
  const roundedTick = Math.round(tick)
  // Clamp to valid tick range
  const clampedTick = Math.max(TickMath.MIN_TICK, Math.min(TickMath.MAX_TICK, roundedTick))
  // Use nearestUsableTick to snap to valid boundary
  return nearestUsableTick(clampedTick, tickSpacing)
}

/**
 * Navigates to the next or previous tick in liquidity data
 */
export function navigateTick({
  currentTick,
  direction,
  tickSpacing,
  liquidityData,
  baseCurrency,
  quoteCurrency,
  protocolVersion,
}: {
  currentTick: number
  direction: 'increment' | 'decrement'
  tickSpacing: number
  liquidityData?: ChartEntry[]
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  protocolVersion: ProtocolVersion
}): ChartEntry | undefined {
  // No direction adjustment needed - tick inversion is handled at the chart boundary
  const newTick = currentTick + (direction === 'increment' ? tickSpacing : -tickSpacing)
  const liquidityActive = liquidityData?.find((d) => d.tick === newTick)?.liquidityActive ?? 0

  const absoluteMaxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)
  const absoluteMinTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)

  // If the new tick is outside the absolute min/max ticks return undefined to indicate we can't navigate further
  if (newTick > absoluteMaxTick || newTick < absoluteMinTick) {
    return undefined
  }

  let price0: Price<Currency, Currency> | undefined
  if (protocolVersion === ProtocolVersion.V4) {
    price0 = getV4TickToPrice({ baseCurrency, quoteCurrency, tick: newTick })
  } else {
    price0 = getTickToPrice({ baseToken: baseCurrency as Token, quoteToken: quoteCurrency as Token, tick: newTick })
  }

  return {
    liquidityActive,
    tick: newTick,
    price0: Number(price0?.toFixed(8) ?? 0),
  }
}
