import { Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk/dist/'
import { useEffect, useMemo, useState } from 'react'
import { Result, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useTickLens } from './useContract'
import { TickData } from 'constants/ticks'

function bitmapIndex(tick: number, tickSpacing: number) {
  return Math.floor(tick / tickSpacing / 256)
}

const REFRESH_FREQUENCY = { blocksPerFetch: 24 }

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

  const poolAddress = token0 && token1 && feeAmount ? Pool.getAddress(token0, token1, feeAmount) : undefined

  const tickLensArgs: [string, number][] = useMemo(
    () =>
      maxIndex && minIndex && poolAddress
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

  // return the latest synced tickdata even if we are still loading the newest data
  useEffect(() => {
    if (!syncing && !loading && !error && valid) {
      const tickData = callStates
        .map(({ result }) => (result as Result)?.populatedTicks)
        .reduce(
          (accumulator, current) => [
            ...accumulator,
            ...(current?.map((tickData: TickData) => {
              return {
                tick: tickData.tick,
                liquidityNet: tickData.liquidityNet.toString(),
              }
            }) ?? []),
          ],
          []
        )

      setTickDataLatestSynced(tickData)
    }
  }, [callStates, error, loading, syncing, valid, setTickDataLatestSynced])

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
