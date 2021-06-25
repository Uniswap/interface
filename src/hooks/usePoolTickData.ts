import { Currency } from '@uniswap/sdk-core'
import { FeeAmount, tickToPrice, TICK_SPACINGS } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { PoolState, usePool } from './usePools'
import { useAllV3Ticks } from './useAllV3Ticks'
import { useEffect, useState } from 'react'
import { TickProcessed } from 'constants/ticks'
import computeSurroundingTicks from 'utils/computeSurroundingTicksSorted'

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

  const [ticksProcessed, setTicksProcessed] = useState<TickProcessed[]>([])

  const tickSpacing = feeAmount && TICK_SPACINGS[feeAmount]

  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick =
    pool[1]?.tickCurrent && tickSpacing ? Math.floor(pool[1]?.tickCurrent / tickSpacing) * tickSpacing : undefined

  const { loading, error, valid, tickData } = useAllV3Ticks(currencyA?.wrapped, currencyB?.wrapped, feeAmount)

  const token0 = currencyA?.wrapped
  const token1 = currencyB?.wrapped

  useEffect(() => {
    if (!token0 || !token1 || !activeTick || pool[0] !== PoolState.EXISTS || tickData.length === 0) {
      setTicksProcessed([])
      return
    }

    //const tickToInitializedTick = keyBy(tickData, 'tick')
    tickData.sort((a, b) => a.tick - b.tick)
    let pivot = -1
    for (let i = 1; i < tickData.length; i++) {
      if (tickData[i].tick > activeTick) {
        pivot = i - 1
        break
      }
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: JSBI.BigInt(pool[1]?.liquidity ?? 0),
      tickIdx: activeTick,
      liquidityNet: tickData[pivot].tick === activeTick ? JSBI.BigInt(tickData[pivot].liquidityNet) : JSBI.BigInt(0),
      price0: tickToPrice(token0, token1, activeTick).toFixed(PRICE_FIXED_DIGITS),
    }

    const subsequentTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, tickData, pivot, true)

    const previousTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, tickData, pivot, false)

    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    setTicksProcessed(ticksProcessed)
  }, [token0, token1, activeTick, pool, tickData])

  return {
    loading: loading || pool[0] === PoolState.LOADING,
    error: error || pool[0] === PoolState.INVALID,
    valid: valid,
    activeTick,
    tickData: ticksProcessed,
  }
}
