import { useMemo } from 'react'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { type PriceMap, useCurrencyKeyPriceMap } from '~/hooks/useCurrencyKeyPriceMap'
import { PositionInfo } from '~/pages/PoolDetails/Pools/cache'

export function usePoolPriceMap(positions: PositionInfo[] | undefined): {
  priceMap: PriceMap
  pricesLoading: boolean
} {
  const currencyIds = useMemo(() => {
    if (!positions?.length) {
      return []
    }
    return Array.from(
      new Set(positions.flatMap(({ pool: { token0, token1 } }) => [currencyId(token0), currencyId(token1)])),
    )
  }, [positions])

  const { priceMap, loading: pricesLoading } = useCurrencyKeyPriceMap(currencyIds)

  return { priceMap, pricesLoading }
}
