import { Pool, Position } from '@uniswap/v3-sdk'
import { useCurrency } from 'hooks/Tokens'
import { usePool } from 'hooks/usePools'
import { PositionDetails } from 'types/position'

/**
 * @deprecated Legacy Pools pages. Use this instead: apps/web/src/pages/Pool/Positions/create/hooks.tsx
 */
export function useDerivedPositionInfo(positionDetails: PositionDetails | undefined): {
  position?: Position
  pool?: Pool
} {
  const currency0 = useCurrency(positionDetails?.token0)
  const currency1 = useCurrency(positionDetails?.token1)

  // construct pool data
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, positionDetails?.fee)

  let position = undefined
  if (pool && positionDetails) {
    position = new Position({
      pool,
      liquidity: positionDetails.liquidity.toString(),
      tickLower: positionDetails.tickLower,
      tickUpper: positionDetails.tickUpper,
    })
  }

  return {
    position,
    pool: pool ?? undefined,
  }
}
