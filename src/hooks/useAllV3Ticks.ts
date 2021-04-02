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
  return (tick / tickSpacing) >> 8
}

// todo this hook needs some tlc around return values
export function useAllV3Ticks(poolAddress: string, tickSpacing: number): Result[] | null {
  const tickLens = useTickLens()

  const min = MIN_TICK(tickSpacing)
  const max = MAX_TICK(tickSpacing)
  const minIndex = bitmapIndex(min, tickSpacing)
  const maxIndex = bitmapIndex(max, tickSpacing)

  const tickLensArgs = new Array(maxIndex - minIndex + 1)
    .fill(0)
    .map((_, i) => i + minIndex)
    .map((wordIndex) => [poolAddress, wordIndex])

  const callStates = useSingleContractMultipleData(
    tickLens,
    'getPopulatedTicksInWord',
    tickLensArgs,
    undefined,
    2_000_000
  )

  const canReturn = callStates.every(
    (callState) => !callState.error && !callState.loading && !callState.syncing && callState.valid && callState.result
  )

  return canReturn
    ? callStates
        .map(({ result }) => (result as Result).populatedTicks)
        .reduce((accumulator, current) => [...accumulator, ...current], [])
    : null
}
