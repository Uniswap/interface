import { Currency } from '@uniswap/sdk-core'
import { FeeAmount, nearestUsableTick, TickMath, tickToPrice, TICK_SPACINGS } from '@uniswap/v3-sdk'
import keyBy from 'lodash.keyby'
import JSBI from 'jsbi'
import { PoolState, usePool } from './usePools'
import { useTicks } from './useTicks'
import { useMemo } from 'react'
import { TickProcessed } from 'constants/ticks'
import computeSurroundingTicks from 'utils/computeSurroundingTicks'

export const PRICE_FIXED_DIGITS = 4

const DEFAULT_SURROUNDING_TICKS = {
  [FeeAmount.LOW]: 2_250,
  [FeeAmount.MEDIUM]: 6_931,
  [FeeAmount.HIGH]: 10_986,
}

export function usePoolTickData(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined,
  numSurroundingTicks?: number
): {
  loading: boolean
  syncing: boolean
  error: boolean
  valid: boolean
  activeTick: number | undefined
  tickData: TickProcessed[]
} {
  const pool = usePool(currencyA, currencyB, feeAmount)

  const tickSpacing = feeAmount && TICK_SPACINGS[feeAmount]

  numSurroundingTicks =
    numSurroundingTicks ??
    (feeAmount && tickSpacing ? Math.floor(DEFAULT_SURROUNDING_TICKS[feeAmount] / tickSpacing) : undefined)

  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick =
    pool[1]?.tickCurrent && tickSpacing ? nearestUsableTick(pool[1]?.tickCurrent, tickSpacing) : undefined

  const { loading, syncing, error, valid, tickData } = useTicks(
    currencyA,
    currencyB,
    feeAmount,
    activeTick,
    numSurroundingTicks
  )

  const token0 = currencyA?.wrapped
  const token1 = currencyB?.wrapped

  return useMemo(() => {
    if (
      !token0 ||
      !token1 ||
      loading ||
      syncing ||
      error ||
      !valid ||
      pool[0] !== PoolState.EXISTS ||
      !activeTick ||
      !tickSpacing ||
      !numSurroundingTicks
    ) {
      return {
        loading: loading || pool[0] === PoolState.LOADING,
        syncing: syncing,
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
      price1: tickToPrice(token1, token0, activeTickForPrice).toFixed(PRICE_FIXED_DIGITS),
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
      numSurroundingTicks,
      true
    )

    const previousTicks = computeSurroundingTicks(
      token0,
      token1,
      activeTickProcessed,
      tickToInitializedTick,
      tickSpacing,
      numSurroundingTicks,
      false
    )

    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    return {
      loading: false,
      syncing: false,
      error: false,
      valid: true,
      activeTick,
      tickData: ticksProcessed,
    }
  }, [token0, token1, activeTick, loading, syncing, error, valid, tickData, pool, tickSpacing, numSurroundingTicks])
}
