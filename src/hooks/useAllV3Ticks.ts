import { Token } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk/dist/'
import { ZERO_ADDRESS } from '../constants'
import { useEffect, useMemo, useState } from 'react'
import { Result, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useTickLens, useV3Factory } from './useContract'

function bitmapIndex(tick: number, tickSpacing: number) {
  return Math.floor(tick / tickSpacing / 256)
}

const REFRESH_FREQUENCY = { blocksPerFetch: 2 }

interface TickData {
  tick: number
  liquidityNet: number
  liquidityGross: number
}

// for now, reconsider using this function, it consumes a lot of data and cpu to fetch all the ticks.
export function useAllV3Ticks(
  token0: Token | undefined,
  token1: Token | undefined,
  feeAmount: FeeAmount | undefined
): {
  loading: boolean
  syncing: boolean
  error: boolean
  valid: boolean
  tickData: TickData[]
} {
  const tickSpacing = feeAmount && TICK_SPACINGS[feeAmount]

  const minIndex = useMemo(
    () => (tickSpacing ? bitmapIndex(nearestUsableTick(TickMath.MIN_TICK, tickSpacing), tickSpacing) : undefined),
    [tickSpacing]
  )
  const maxIndex = useMemo(
    () => (tickSpacing ? bitmapIndex(nearestUsableTick(TickMath.MAX_TICK, tickSpacing), tickSpacing) : undefined),
    [tickSpacing]
  )

  const [tickDataLatestSynced, setTickDataLatestSynced] = useState<TickData[]>([])

  // fetch the pool address
  const factoryContract = useV3Factory()
  const poolAddress = useSingleCallResult(factoryContract, 'getPool', [token0?.address, token1?.address, feeAmount])
    .result?.[0]

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
    REFRESH_FREQUENCY,
    3_000_000
  )

  const error = useMemo(() => callStates.some(({ error }) => error), [callStates])
  const loading = useMemo(() => callStates.some(({ loading }) => loading), [callStates])
  const syncing = useMemo(() => callStates.some(({ syncing }) => syncing), [callStates])
  const valid = useMemo(() => callStates.some(({ valid }) => valid), [callStates])

  const tickData = useMemo(
    () =>
      callStates
        .map(({ result }) => (result as Result)?.populatedTicks)
        .reduce(
          (accumulator, current) => [
            ...accumulator,
            ...(current?.map((tickData: TickData) => {
              return {
                tick: tickData.tick,
                liquidityNet: tickData.liquidityNet,
                liquidityGross: tickData.liquidityGross,
              }
            }) ?? []),
          ],
          []
        ),
    [callStates]
  )

  // return the latest synced tickdata even if we are still loading the newest data
  useEffect(() => {
    if (!syncing && !loading && !error && valid) {
      setTickDataLatestSynced(tickData)
    }
  }, [error, loading, syncing, tickData, valid])

  return useMemo(
    () => ({
      loading,
      syncing,
      error,
      valid,
      tickData: tickDataLatestSynced,
    }),
    [loading, syncing, error, valid, tickDataLatestSynced]
  )
}
