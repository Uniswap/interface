import { useMemo } from 'react'
import { Result, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useTickLens } from './useContract'

// the following should probably all be from the sdk, just mocking it for now
function MIN_TICK(tickSpacing: number) {
  return Math.ceil(-887272 / tickSpacing) * tickSpacing
}

function MAX_TICK(tickSpacing: number) {
  return Math.floor(887272 / tickSpacing) * tickSpacing
}

function bitmapIndex(tick: number, tickSpacing: number) {
  const compressed = tick / tickSpacing
  return compressed >> 8
}

const REFRESH_FREQUENCY = { blocksPerFetch: 10 }

interface TickData {
  tick: number
  liquidityNet: number
  liquidityGross: number
}

export function useAllV3Ticks(
  poolAddress: string,
  tickSpacing: number
): {
  loading: boolean
  syncing: boolean
  error: boolean
  valid: boolean
  tickData: TickData[]
} {
  const tickLens = useTickLens()

  const minIndex = useMemo(() => bitmapIndex(MIN_TICK(tickSpacing), tickSpacing), [tickSpacing])
  const maxIndex = useMemo(() => bitmapIndex(MAX_TICK(tickSpacing), tickSpacing), [tickSpacing])

  const tickLensArgs = useMemo(
    () =>
      new Array(maxIndex - minIndex + 1)
        .fill(0)
        .map((_, i) => i + minIndex)
        .map((wordIndex) => [poolAddress, wordIndex]),
    [minIndex, maxIndex, poolAddress]
  )

  const callStates = useSingleContractMultipleData(
    tickLens,
    'getPopulatedTicksInWord',
    tickLensArgs,
    REFRESH_FREQUENCY,
    2_000_000
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

  return {
    loading,
    syncing,
    error,
    valid,
    tickData,
  }
}
