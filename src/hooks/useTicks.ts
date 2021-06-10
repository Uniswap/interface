import { Currency } from '@uniswap/sdk-core'
import { FeeAmount, Pool, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { ZERO_ADDRESS } from 'constants/misc'
import { useEffect, useMemo, useState } from 'react'
import { Result, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useTickLens } from './useContract'
import { PoolState, usePool } from './usePools'
import { TickData } from 'constants/ticks'

function bitmapIndex(tick: number, tickSpacing: number) {
  return Math.floor(tick / tickSpacing / 256)
}

const REFRESH_FREQUENCY = { blocksPerFetch: 4 }

export function useTicks(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined,
  activeTick: number | undefined,
  numSurroundingTicks: number | undefined
): {
  loading: boolean
  syncing: boolean
  error: boolean
  valid: boolean
  tickData: TickData[]
} {
  const [tickDataLatestSynced, setTickDataLatestSynced] = useState<TickData[]>([])

  const pool = usePool(currencyA, currencyB, feeAmount)

  const poolAddress =
    currencyA && currencyB && feeAmount && pool.length === 2 && pool[0] === PoolState.EXISTS
      ? Pool.getAddress(currencyA?.wrapped, currencyB?.wrapped, feeAmount)
      : undefined

  const tickSpacing = feeAmount && TICK_SPACINGS[feeAmount]

  const minIndex = useMemo(
    () =>
      tickSpacing && activeTick && numSurroundingTicks
        ? bitmapIndex(activeTick - numSurroundingTicks * tickSpacing, tickSpacing)
        : undefined,
    [tickSpacing, activeTick, numSurroundingTicks]
  )

  const maxIndex = useMemo(
    () =>
      tickSpacing && activeTick && numSurroundingTicks
        ? bitmapIndex(activeTick + numSurroundingTicks * tickSpacing, tickSpacing)
        : undefined,
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

  // return the latest synced tickData even if we are still loading the newest data
  useEffect(() => {
    if (!syncing && !loading && !error && valid) {
      setTickDataLatestSynced(tickData)
    }
  }, [error, loading, syncing, tickData, valid])

  return useMemo(
    () => ({ loading, syncing, error, valid, tickData: tickDataLatestSynced }),
    [loading, syncing, error, valid, tickDataLatestSynced]
  )
}
