import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Hook, HookOptions } from '@uniswap/v4-sdk'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import type { PoolData } from '~/data/pools/poolData'
import { useLiquidityServiceGetPool } from '~/features/Liquidity/hooks/useLiquidityServiceGetPool'
import { getTickToPrice, getV4TickToPrice } from '~/features/Liquidity/utils/getTickToPrice'

// Pool prices routinely run to 1e-6 and below, so keep enough significant digits to survive `Number()`.
const SPOT_PRICE_SIGNIFICANT_DIGITS = 12

/**
 * Live spot price from the pool's active tick, oriented to match the chart's `priceInverted`
 * display so it lands in the same units as the price-history entries.
 *
 * Reads the same liquidity-service `GetPool` row the liquidity and depth tabs already load for this
 * pool (keyed on `{chainId, poolId}`), so the request is shared with them rather than being a new
 * data source.
 */
export function usePoolSpotPrice({
  poolData,
  isReversed,
  chainId,
  version,
  enabled,
}: {
  poolData: PoolData | undefined
  isReversed: boolean
  chainId: UniverseChainId
  version: RestProtocolVersion
  enabled: boolean
}): number | undefined {
  const poolId = poolData?.idOrAddress
  const { data } = useLiquidityServiceGetPool({ chainId, poolId, enabled })
  const pool = data?.pool

  return useMemo(() => {
    // `sqrtPriceX96` is only set on an initialized pool; pair it with `currentTick` (proto3-optional,
    // absent on an uninitialized row) so a real tick 0 (price 1) reads differently from "no tick".
    if (!pool?.sqrtPriceX96 || pool.currentTick === undefined || !poolData) {
      return undefined
    }
    // Custom-accounting hooks with no active liquidity fill swaps themselves, so slot0 is a stale placeholder.
    if (
      version === RestProtocolVersion.V4 &&
      pool.liquidity === '0' &&
      pool.hookAddress &&
      Hook.hasPermission(pool.hookAddress, HookOptions.BeforeSwapReturnsDelta)
    ) {
      return undefined
    }
    const currency0 = v2TokenToCurrency(poolData.token0)
    const currency1 = v2TokenToCurrency(poolData.token1)
    const [base, quote] = isReversed ? [currency1, currency0] : [currency0, currency1]

    const price =
      version === RestProtocolVersion.V4
        ? getV4TickToPrice({ baseCurrency: base, quoteCurrency: quote, tick: pool.currentTick })
        : getTickToPrice({ baseToken: base?.wrapped, quoteToken: quote?.wrapped, tick: pool.currentTick })

    return price ? Number(price.toSignificant(SPOT_PRICE_SIGNIFICANT_DIGITS)) : undefined
  }, [pool?.sqrtPriceX96, pool?.currentTick, pool?.liquidity, pool?.hookAddress, poolData, isReversed, version])
}
