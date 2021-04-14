import { Token } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { ZERO_ADDRESS } from '../constants'
import { useMemo } from 'react'
import { Result, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useTickLens, useV3Factory } from './useContract'

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

const REFRESH_FREQUENCY = { blocksPerFetch: 2 }

interface TickData {
  tick: number
  liquidityNet: number
  liquidityGross: number
}

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
  const tickSpacing = useMemo(() => (feeAmount ? TICK_SPACINGS[feeAmount] : undefined), [feeAmount])

  const minIndex = useMemo(() => (tickSpacing ? bitmapIndex(MIN_TICK(tickSpacing), tickSpacing) : undefined), [
    tickSpacing,
  ])
  const maxIndex = useMemo(() => (tickSpacing ? bitmapIndex(MAX_TICK(tickSpacing), tickSpacing) : undefined), [
    tickSpacing,
  ])

  // fetch the pool address
  const factoryContract = useV3Factory()
  const addressParams = token0 && token1 && feeAmount ? [token0.address, token1.address, feeAmount] : undefined
  const poolAddress = useSingleCallResult(addressParams ? factoryContract : undefined, 'getPool', addressParams)
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
    1_500_000
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

  return useMemo(
    () => ({
      loading,
      syncing,
      error,
      valid,
      tickData,
    }),
    [loading, syncing, error, valid, tickData]
  )
}
