import { Token } from '@uniswap/sdk-core'
import { TickData } from 'constants/ticks'
import { TickMath, tickToPrice } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { TickProcessed } from 'constants/ticks'

const PRICE_FIXED_DIGITS = 8

// Computes the numSurroundingTicks above or below the active tick.
export default function computeSurroundingTicks(
  token0: Token,
  token1: Token,
  activeTickProcessed: TickProcessed,
  tickIdxToInitializedTick: { [key: string]: TickData },
  tickSpacing: number,
  numSurroundingTicks: number,
  ascending: boolean
): TickProcessed[] {
  let previousTickProcessed: TickProcessed = {
    ...activeTickProcessed,
  }

  // Iterate outwards (either up or down depending on direction) from the active tick,
  // building active liquidity for every tick.
  let processedTicks: TickProcessed[] = []
  for (let i = 0; i < numSurroundingTicks; i++) {
    const currentTickIdx = ascending
      ? previousTickProcessed.tickIdx + tickSpacing
      : previousTickProcessed.tickIdx - tickSpacing

    if (currentTickIdx < TickMath.MIN_TICK || currentTickIdx > TickMath.MAX_TICK) {
      break
    }

    const currentTickProcessed: TickProcessed = {
      liquidityActive: previousTickProcessed.liquidityActive,
      tickIdx: currentTickIdx,
      liquidityNet: JSBI.BigInt(0),
      price0: tickToPrice(token0, token1, currentTickIdx).toFixed(PRICE_FIXED_DIGITS),
      price1: tickToPrice(token1, token0, currentTickIdx).toFixed(PRICE_FIXED_DIGITS),
      liquidityGross: JSBI.BigInt(0),
    }

    // Check if there is an initialized tick at our current tick.
    // If so copy the gross and net liquidity from the initialized tick.
    const currentInitializedTick = tickIdxToInitializedTick[currentTickIdx.toString()]
    if (currentInitializedTick) {
      currentTickProcessed.liquidityGross = JSBI.BigInt(currentInitializedTick.liquidityGross)
      currentTickProcessed.liquidityNet = JSBI.BigInt(currentInitializedTick.liquidityNet)
    }

    // Update the active liquidity.
    // If we are iterating ascending and we found an initialized tick we immediately apply
    // it to the current processed tick we are building.
    // If we are iterating descending, we don't want to apply the net liquidity until the following tick.
    if (ascending && currentInitializedTick) {
      currentTickProcessed.liquidityActive = JSBI.add(
        previousTickProcessed.liquidityActive,
        JSBI.BigInt(currentInitializedTick.liquidityNet)
      )
    } else if (!ascending && JSBI.notEqual(previousTickProcessed.liquidityNet, JSBI.BigInt(0))) {
      // We are iterating descending, so look at the previous tick and apply any net liquidity.
      currentTickProcessed.liquidityActive = JSBI.subtract(
        previousTickProcessed.liquidityActive,
        previousTickProcessed.liquidityNet
      )
    }

    processedTicks.push(currentTickProcessed)
    previousTickProcessed = currentTickProcessed
  }

  if (!ascending) {
    processedTicks = processedTicks.reverse()
  }

  return processedTicks
}
