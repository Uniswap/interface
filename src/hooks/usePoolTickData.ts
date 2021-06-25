import { Currency } from '@uniswap/sdk-core'
import { FeeAmount, tickToPrice, TICK_SPACINGS } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { PoolState, usePool } from './usePools'
import { useAllV3Ticks } from './useAllV3Ticks'
import { useEffect, useState } from 'react'
import { TickProcessed } from 'constants/ticks'
import computeSurroundingTicks from 'utils/computeSurroundingTicks'
import cloneDeep from 'lodash.clonedeep'

const PRICE_FIXED_DIGITS = 8

const getActiveTick = (tickCurrent: number | undefined, feeAmount: FeeAmount | undefined) =>
  tickCurrent && feeAmount ? Math.floor(tickCurrent / TICK_SPACINGS[feeAmount]) * TICK_SPACINGS[feeAmount] : undefined

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

  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick = getActiveTick(pool[1]?.tickCurrent, feeAmount)

  const { loading, error, valid, tickData } = useAllV3Ticks(currencyA?.wrapped, currencyB?.wrapped, feeAmount)

  const [ticksProcessed, setTicksProcessed] = useState<TickProcessed[]>([])

  useEffect(() => {
    if (!currencyA || !currencyB || !activeTick || pool[0] !== PoolState.EXISTS || tickData.length === 0) {
      setTicksProcessed([])
      return
    }

    const token0 = currencyA?.wrapped
    const token1 = currencyB?.wrapped

    const sortedTickData = cloneDeep(tickData).sort((a, b) => a.tick - b.tick)

    // find where the active tick would be
    const pivot = sortedTickData.findIndex(({ tick }) => tick > activeTick) - 1

    if (pivot === -1) {
      console.error('TickData pivot not found')
      return
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: JSBI.BigInt(pool[1]?.liquidity ?? 0),
      tickIdx: activeTick,
      liquidityNet:
        sortedTickData[pivot].tick === activeTick ? JSBI.BigInt(sortedTickData[pivot].liquidityNet) : JSBI.BigInt(0),
      price0: tickToPrice(token0, token1, activeTick).toFixed(PRICE_FIXED_DIGITS),
    }

    const subsequentTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, sortedTickData, pivot, true)

    const previousTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, sortedTickData, pivot, false)

    const newTicksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    setTicksProcessed(newTicksProcessed)
  }, [currencyA, currencyB, activeTick, pool, tickData])

  return {
    loading: loading || pool[0] === PoolState.LOADING,
    error: error || pool[0] === PoolState.INVALID,
    valid: valid,
    activeTick,
    tickData: ticksProcessed,
  }
}
