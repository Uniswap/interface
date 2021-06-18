import { Currency } from '@uniswap/sdk-core'
import { FeeAmount, nearestUsableTick, TickMath, tickToPrice, TICK_SPACINGS } from '@uniswap/v3-sdk'
import keyBy from 'lodash.keyby'
import JSBI from 'jsbi'
import { PoolState, usePool } from './usePools'
import { useAllV3Ticks } from './useAllV3Ticks'
import { useMemo } from 'react'
import { TickProcessed } from 'constants/ticks'
import computeSurroundingTicks from 'utils/computeSurroundingTicks'

const PRICE_FIXED_DIGITS = 8

export function usePoolTickData(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
): {
  loading: boolean
  error: boolean
  valid: boolean
  activeTick: number | undefined
  tickData: TickProcessed[]
} {
  const pool = usePool(currencyA, currencyB, feeAmount)

  const tickSpacing = feeAmount && TICK_SPACINGS[feeAmount]

  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick =
    pool[1]?.tickCurrent && tickSpacing ? nearestUsableTick(pool[1]?.tickCurrent, tickSpacing) : undefined

  const { loading, error, valid, tickData } = useAllV3Ticks(currencyA?.wrapped, currencyB?.wrapped, feeAmount)

  const token0 = currencyA?.wrapped
  const token1 = currencyB?.wrapped

  return useMemo(() => {
    if (
      !token0 ||
      !token1 ||
      loading ||
      error ||
      !valid ||
      pool[0] !== PoolState.EXISTS ||
      activeTick === undefined ||
      !tickSpacing
    ) {
      return {
        loading: loading || pool[0] === PoolState.LOADING,
        error: error || pool[0] === PoolState.INVALID,
        valid: false,
        activeTick,
        tickData: [],
      }
    }

    const tickToInitializedTick = keyBy(tickData, 'tick')

    // ensure active tick is within supported range
    let activeTickForPrice = activeTick
    if (activeTickForPrice < TickMath.MIN_TICK) {
      activeTickForPrice = TickMath.MIN_TICK
    } else if (activeTickForPrice > TickMath.MAX_TICK) {
      activeTickForPrice = TickMath.MAX_TICK
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: JSBI.BigInt(pool[1]?.liquidity ?? 0),
      tickIdx: activeTick,
      liquidityNet: JSBI.BigInt(0),
      liquidityGross: JSBI.BigInt(0),
      price0: tickToPrice(token0, token1, activeTickForPrice).toFixed(PRICE_FIXED_DIGITS),
    }

    // if active tick is initialized, fill liquidity
    if (tickToInitializedTick[activeTick]) {
      activeTickProcessed.liquidityNet = JSBI.BigInt(tickToInitializedTick[activeTick].liquidityNet)
      activeTickProcessed.liquidityGross = JSBI.BigInt(tickToInitializedTick[activeTick].liquidityGross)
    }

    const subsequentTicks = computeSurroundingTicks(
      token0,
      token1,
      activeTickProcessed,
      tickToInitializedTick,
      tickSpacing,
      true
    )

    const previousTicks = computeSurroundingTicks(
      token0,
      token1,
      activeTickProcessed,
      tickToInitializedTick,
      tickSpacing,
      false
    )

    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    return {
      loading: false,
      error: false,
      valid: true,
      activeTick,
      tickData: ticksProcessed,
    }
  }, [token0, token1, activeTick, loading, error, valid, tickData, pool, tickSpacing])
}
