import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount, nearestUsableTick, Pool, TICK_SPACINGS, tickToPrice } from '@uniswap/v3-sdk'
import { SupportedChainId } from 'constants/chains'
import { ZERO_ADDRESS } from 'constants/misc'
import JSBI from 'jsbi'
import { useSingleContractMultipleData } from 'lib/hooks/multicall'
import ms from 'ms.macro'
import { useEffect, useMemo, useState } from 'react'
import { useAllV3TicksQuery } from 'state/data/enhanced'
import computeSurroundingTicks from 'utils/computeSurroundingTicks'

import { useTickLens } from './useContract'
import { PoolState, usePool } from './usePools'

const PRICE_FIXED_DIGITS = 8
const CHAIN_IDS_MISSING_SUBGRAPH_DATA = [SupportedChainId.ARBITRUM_ONE, SupportedChainId.ARBITRUM_RINKEBY]

export interface TickData {
  tick: number
  liquidityNet: JSBI
  liquidityGross: JSBI
}

// Tick with fields parsed to JSBIs, and active liquidity computed.
export interface TickProcessed {
  tick: number
  liquidityActive: JSBI
  liquidityNet: JSBI
  price0: string
}

const REFRESH_FREQUENCY = { blocksPerFetch: 2 }

const getActiveTick = (tickCurrent: number | undefined, feeAmount: FeeAmount | undefined) =>
  tickCurrent && feeAmount ? Math.floor(tickCurrent / TICK_SPACINGS[feeAmount]) * TICK_SPACINGS[feeAmount] : undefined

const bitmapIndex = (tick: number, tickSpacing: number) => {
  return Math.floor(tick / tickSpacing / 256)
}

function useTicksFromTickLens(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined,
  numSurroundingTicks: number | undefined = 125
) {
  const [tickDataLatestSynced, setTickDataLatestSynced] = useState<TickData[]>([])

  const [poolState, pool] = usePool(currencyA, currencyB, feeAmount)

  const tickSpacing = feeAmount && TICK_SPACINGS[feeAmount]

  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick = pool?.tickCurrent && tickSpacing ? nearestUsableTick(pool?.tickCurrent, tickSpacing) : undefined

  const poolAddress =
    currencyA && currencyB && feeAmount && poolState === PoolState.EXISTS
      ? Pool.getAddress(currencyA?.wrapped, currencyB?.wrapped, feeAmount)
      : undefined

  // it is also possible to grab all tick data but it is extremely slow
  // bitmapIndex(nearestUsableTick(TickMath.MIN_TICK, tickSpacing), tickSpacing)
  const minIndex = useMemo(
    () =>
      tickSpacing && activeTick ? bitmapIndex(activeTick - numSurroundingTicks * tickSpacing, tickSpacing) : undefined,
    [tickSpacing, activeTick, numSurroundingTicks]
  )

  const maxIndex = useMemo(
    () =>
      tickSpacing && activeTick ? bitmapIndex(activeTick + numSurroundingTicks * tickSpacing, tickSpacing) : undefined,
    [tickSpacing, activeTick, numSurroundingTicks]
  )

  const tickLensArgs: [string, number][] = useMemo(
    () =>
      maxIndex && minIndex && poolAddress && poolAddress !== ZERO_ADDRESS
        ? new Array(maxIndex - minIndex + 1)
            .fill(0)
            .map((_, i) => i + minIndex)
            .map((wordIndex) => [poolAddress, wordIndex])
        : [],
    [minIndex, maxIndex, poolAddress]
  )

  const tickLens = useTickLens()
  const callStates = useSingleContractMultipleData(
    tickLensArgs.length > 0 ? tickLens : undefined,
    'getPopulatedTicksInWord',
    tickLensArgs,
    REFRESH_FREQUENCY
  )

  const isError = useMemo(() => callStates.some(({ error }) => error), [callStates])
  const isLoading = useMemo(() => callStates.some(({ loading }) => loading), [callStates])
  const IsSyncing = useMemo(() => callStates.some(({ syncing }) => syncing), [callStates])
  const isValid = useMemo(() => callStates.some(({ valid }) => valid), [callStates])

  const tickData: TickData[] = useMemo(
    () =>
      callStates
        .map(({ result }) => result?.populatedTicks)
        .reduce(
          (accumulator, current) => [
            ...accumulator,
            ...(current?.map((tickData: TickData) => {
              return {
                tick: tickData.tick,
                liquidityNet: JSBI.BigInt(tickData.liquidityNet),
                liquidityGross: JSBI.BigInt(tickData.liquidityGross),
              }
            }) ?? []),
          ],
          []
        ),
    [callStates]
  )

  // reset on input change
  useEffect(() => {
    setTickDataLatestSynced([])
  }, [currencyA, currencyB, feeAmount])

  // return the latest synced tickData even if we are still loading the newest data
  useEffect(() => {
    if (!IsSyncing && !isLoading && !isError && isValid) {
      setTickDataLatestSynced(tickData.sort((a, b) => a.tick - b.tick))
    }
  }, [isError, isLoading, IsSyncing, tickData, isValid])

  return useMemo(
    () => ({ isLoading, IsSyncing, isError, isValid, tickData: tickDataLatestSynced }),
    [isLoading, IsSyncing, isError, isValid, tickDataLatestSynced]
  )
}

function useTicksFromSubgraph(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
) {
  const poolAddress =
    currencyA && currencyB && feeAmount ? Pool.getAddress(currencyA?.wrapped, currencyB?.wrapped, feeAmount) : undefined

  return useAllV3TicksQuery(poolAddress ? { poolAddress: poolAddress?.toLowerCase(), skip: 0 } : skipToken, {
    pollingInterval: ms`30s`,
  })
}

// Fetches all ticks for a given pool
function useAllV3Ticks(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
): {
  isLoading: boolean
  isUninitialized: boolean
  isError: boolean
  error: unknown
  ticks: TickData[] | undefined
} {
  const useSubgraph = currencyA ? !CHAIN_IDS_MISSING_SUBGRAPH_DATA.includes(currencyA.chainId) : true

  const tickLensTickData = useTicksFromTickLens(!useSubgraph ? currencyA : undefined, currencyB, feeAmount)
  const subgraphTickData = useTicksFromSubgraph(useSubgraph ? currencyA : undefined, currencyB, feeAmount)

  return {
    isLoading: useSubgraph ? subgraphTickData.isLoading : tickLensTickData.isLoading,
    isUninitialized: useSubgraph ? subgraphTickData.isUninitialized : false,
    isError: useSubgraph ? subgraphTickData.isError : tickLensTickData.isError,
    error: useSubgraph ? subgraphTickData.error : tickLensTickData.isError,
    ticks: useSubgraph ? subgraphTickData.data?.ticks : tickLensTickData.tickData,
  }
}

export function usePoolActiveLiquidity(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
): {
  isLoading: boolean
  isUninitialized: boolean
  isError: boolean
  error: any
  activeTick: number | undefined
  data: TickProcessed[] | undefined
} {
  const pool = usePool(currencyA, currencyB, feeAmount)

  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick = useMemo(() => getActiveTick(pool[1]?.tickCurrent, feeAmount), [pool, feeAmount])

  const { isLoading, isUninitialized, isError, error, ticks } = useAllV3Ticks(currencyA, currencyB, feeAmount)

  return useMemo(() => {
    if (
      !currencyA ||
      !currencyB ||
      activeTick === undefined ||
      pool[0] !== PoolState.EXISTS ||
      !ticks ||
      ticks.length === 0 ||
      isLoading ||
      isUninitialized
    ) {
      return {
        isLoading: isLoading || pool[0] === PoolState.LOADING,
        isUninitialized,
        isError,
        error,
        activeTick,
        data: undefined,
      }
    }

    const token0 = currencyA?.wrapped
    const token1 = currencyB?.wrapped

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot = ticks.findIndex(({ tick }) => tick > activeTick) - 1

    if (pivot < 0) {
      // consider setting a local error
      console.error('TickData pivot not found')
      return {
        isLoading,
        isUninitialized,
        isError,
        error,
        activeTick,
        data: undefined,
      }
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: JSBI.BigInt(pool[1]?.liquidity ?? 0),
      tick: activeTick,
      liquidityNet: Number(ticks[pivot].tick) === activeTick ? JSBI.BigInt(ticks[pivot].liquidityNet) : JSBI.BigInt(0),
      price0: tickToPrice(token0, token1, activeTick).toFixed(PRICE_FIXED_DIGITS),
    }

    const subsequentTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, true)

    const previousTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, false)

    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    return {
      isLoading,
      isUninitialized,
      isError,
      error,
      activeTick,
      data: ticksProcessed,
    }
  }, [currencyA, currencyB, activeTick, pool, ticks, isLoading, isUninitialized, isError, error])
}
