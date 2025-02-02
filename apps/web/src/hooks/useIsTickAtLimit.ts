import { TickMath, nearestUsableTick } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { Bound } from 'state/mint/v3/actions'

export default function useIsTickAtLimit(
  tickSpacing: number | undefined,
  tickLower: number | undefined,
  tickUpper: number | undefined,
) {
  return useMemo(
    () => ({
      [Bound.LOWER]:
        tickSpacing && tickLower ? tickLower === nearestUsableTick(TickMath.MIN_TICK, tickSpacing) : undefined,
      [Bound.UPPER]:
        tickSpacing && tickUpper ? tickUpper === nearestUsableTick(TickMath.MAX_TICK, tickSpacing) : undefined,
    }),
    [tickSpacing, tickLower, tickUpper],
  )
}
