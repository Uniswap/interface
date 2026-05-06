import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import {
  floorTickToSpacing,
  snapTickToSpacing,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'

// Tick tolerance for detecting strategy matches (number of ticks)
const TICK_TOLERANCE = 1

// Calculate expected ticks for a given strategy
export function calculateStrategyTicks({
  priceStrategy,
  currentTick,
  tickSpacing,
  defaultMinTick,
  defaultMaxTick,
}: {
  priceStrategy: DefaultPriceStrategy
  currentTick: number
  tickSpacing: number
  defaultMinTick?: number
  defaultMaxTick?: number
}): { minTick: number; maxTick: number } {
  // Get usable min/max ticks aligned to tickSpacing
  const usableMinTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
  const usableMaxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)

  switch (priceStrategy) {
    case DefaultPriceStrategy.STABLE: {
      // Anchor to the lower edge of the bucket containing currentTick (floor,
      // not nearest-snap). The price-line dot is rendered at the bucket center,
      // so flooring keeps the ±3 range symmetric around the dot regardless of
      // where currentTick sits within its bucket. Nearest-snap would round to
      // the wrong bucket when currentTick is in the upper half of its band.
      const bucketLowerTick = floorTickToSpacing(currentTick, tickSpacing)
      const minTick = bucketLowerTick - 3 * tickSpacing
      const maxTick = bucketLowerTick + 3 * tickSpacing

      return {
        minTick: Math.max(usableMinTick, minTick),
        maxTick: Math.min(usableMaxTick, maxTick),
      }
    }
    case DefaultPriceStrategy.WIDE: {
      // -50% lower: find tick at half the current price
      // price = 1.0001^tick, so half price = 1.0001^(tick + delta)
      // 0.5 * price = 1.0001^newTick => newTick = tick + log(0.5)/log(1.0001)
      const halfPriceTickDelta = Math.round(Math.log(0.5) / Math.log(1.0001))
      const minTick = snapTickToSpacing(currentTick + halfPriceTickDelta, tickSpacing)

      // +100% upper: find the tick that is 100% above the current tick
      const hundredPriceTickDelta = Math.round(Math.log(2) / Math.log(1.0001))
      const maxTick = snapTickToSpacing(currentTick + hundredPriceTickDelta, tickSpacing)
      return {
        minTick: Math.max(usableMinTick, minTick),
        maxTick: Math.min(usableMaxTick, maxTick),
      }
    }
    case DefaultPriceStrategy.ONE_SIDED_UPPER: {
      // Start just above current tick
      const minTick = snapTickToSpacing(currentTick + tickSpacing, tickSpacing)
      // +100% upper: find the tick that is 100% above the current tick
      const hundredPriceTickDelta = Math.round(Math.log(2) / Math.log(1.0001))
      const maxTick = snapTickToSpacing(currentTick + hundredPriceTickDelta, tickSpacing)
      return {
        minTick,
        maxTick: Math.min(usableMaxTick, maxTick),
      }
    }
    case DefaultPriceStrategy.ONE_SIDED_LOWER: {
      // -50% lower (same as WIDE), go to just below current tick
      const halfPriceTickDelta = Math.round(Math.log(0.5) / Math.log(1.0001))
      const minTick = snapTickToSpacing(currentTick + halfPriceTickDelta, tickSpacing)
      const maxTick = snapTickToSpacing(currentTick - tickSpacing, tickSpacing)
      return {
        minTick: Math.max(usableMinTick, minTick),
        maxTick,
      }
    }
    case DefaultPriceStrategy.FULL_RANGE:
      return {
        minTick: usableMinTick,
        maxTick: usableMaxTick,
      }
    case DefaultPriceStrategy.CUSTOM:
      return {
        minTick: defaultMinTick ?? currentTick,
        maxTick: defaultMaxTick ?? currentTick,
      }
    default:
      return { minTick: currentTick, maxTick: currentTick }
  }
}

// Detect which strategy matches the current min/max ticks
export function detectTickStrategy({
  minTick,
  maxTick,
  currentTick,
  tickSpacing,
}: {
  minTick?: number
  maxTick?: number
  currentTick: number
  tickSpacing: number
}): DefaultPriceStrategy | undefined {
  if (minTick === undefined || maxTick === undefined) {
    return undefined
  }

  const strategies = [
    DefaultPriceStrategy.STABLE,
    DefaultPriceStrategy.WIDE,
    DefaultPriceStrategy.ONE_SIDED_LOWER,
    DefaultPriceStrategy.ONE_SIDED_UPPER,
    DefaultPriceStrategy.FULL_RANGE,
  ]

  for (const strategy of strategies) {
    const expectedTicks = calculateStrategyTicks({ priceStrategy: strategy, currentTick, tickSpacing })

    const minDiff = Math.abs(minTick - expectedTicks.minTick)
    const maxDiff = Math.abs(maxTick - expectedTicks.maxTick)

    if (minDiff <= TICK_TOLERANCE && maxDiff <= TICK_TOLERANCE) {
      return strategy
    }
  }

  return undefined
}
