import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolInfoRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { PoolParameters } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { useEffect, useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { getSDKPoolFromPoolInformation } from 'uniswap/src/features/positions/getSDKPoolFromPoolInformation'
import { DYNAMIC_FEE_DATA } from 'uniswap/src/features/positions/types'
import { getWrappedTokenIfExists } from 'uniswap/src/utils/currency'
import { logger } from 'utilities/src/logger/logger'
import {
  CreatePositionInfo,
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  PositionState,
} from '~/features/Liquidity/Create/types'
import { usePoolLookupTokenAddresses } from '~/features/Liquidity/hooks/usePoolLookupTokenAddresses'
import { getCurrencyWithWrap, validateCurrencyInput } from '~/features/Liquidity/utils/currency'
import { isDynamicFeeTier } from '~/features/Liquidity/utils/feeTiers'
import { isUnsupportedLPChain } from '~/features/Liquidity/utils/isUnsupportedLPChain'
import { getProtocols } from '~/features/Liquidity/utils/protocolVersion'
import { PositionField } from '~/types/position'

function getSortedCurrencies(a: Maybe<Currency>, b: Maybe<Currency>): { [field in PositionField]: Maybe<Currency> } {
  if (!a || !b) {
    return { TOKEN0: a, TOKEN1: b }
  }

  if (a.isNative) {
    return { TOKEN0: a, TOKEN1: b }
  }

  if (b.isNative) {
    return { TOKEN0: b, TOKEN1: a }
  }

  return a.sortsBefore(b) ? { TOKEN0: a, TOKEN1: b } : { TOKEN0: b, TOKEN1: a }
}

/**
 * @internal - Only exported for testing
 */
export function getSortedCurrenciesForProtocol({
  a,
  b,
  protocolVersion,
}: {
  a: Maybe<Currency>
  b: Maybe<Currency>
  protocolVersion: ProtocolVersion
}): { [field in PositionField]: Maybe<Currency> } {
  if (!a || !b) {
    return { TOKEN0: a, TOKEN1: b }
  }

  if (protocolVersion === ProtocolVersion.V4) {
    return getSortedCurrencies(a, b)
  }

  const wrappedA = getCurrencyWithWrap(a, protocolVersion)
  const wrappedB = getCurrencyWithWrap(b, protocolVersion)
  const sorted = getSortedCurrencies(wrappedA, wrappedB)

  const currency0 = !sorted.TOKEN0 || wrappedA?.equals(sorted.TOKEN0) ? a : b
  const currency1 = !sorted.TOKEN1 || wrappedB?.equals(sorted.TOKEN1) ? b : a

  return { TOKEN0: currency0, TOKEN1: currency1 }
}

/**
 * @param state user-defined state for a position being created or migrated
 * @returns derived position information such as existing Pools
 */
export function useDerivedPositionInfo(
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> },
  state: PositionState,
): CreatePositionInfo {
  const { protocolVersion } = state
  const { tokenA, tokenB } = currencyInputs

  // Memoized so the derived currencies, and everything keyed on them down to the range chart's tick
  // pipeline, keep their identity across renders that don't touch the inputs.
  const sortedCurrencies = useMemo(
    () => getSortedCurrenciesForProtocol({ a: tokenA, b: tokenB, protocolVersion }),
    [tokenA, tokenB, protocolVersion],
  )
  const validCurrencyInput = validateCurrencyInput(sortedCurrencies)

  const token0 = getCurrencyWithWrap(sortedCurrencies.TOKEN0, protocolVersion)
  const token1 = getCurrencyWithWrap(sortedCurrencies.TOKEN1, protocolVersion)
  const protocol = getProtocols(protocolVersion)

  // The legs a v2/v3 pool holds. `getWrappedTokenIfExists` returns the module-level wrapped token for a
  // native input and the token itself otherwise, so flipping a leg between ETH and WETH (the deposit
  // step's "Add as ETH" toggle) leaves these, and the pool and chart data built on them, untouched.
  const wrappedToken0 = getWrappedTokenIfExists(sortedCurrencies.TOKEN0)
  const wrappedToken1 = getWrappedTokenIfExists(sortedCurrencies.TOKEN1)
  const wrappedCurrencies = useMemo(
    () => ({ [PositionField.TOKEN0]: wrappedToken0, [PositionField.TOKEN1]: wrappedToken1 }),
    [wrappedToken0, wrappedToken1],
  )

  const isFeeValid = protocolVersion === ProtocolVersion.V2 ? true : state.fee !== undefined
  const isChainUnsupported = isUnsupportedLPChain(token0?.chainId, protocolVersion)

  // Permissioned pools are indexed under the PA adapter, not the displayed sec-token;
  // an unmapped lookup always misses and the flow falsely reports "creating new pool".
  const {
    lookupAddress0,
    lookupAddress1,
    orientationFlipped,
    isLoading: isLookupAddressLoading,
  } = usePoolLookupTokenAddresses({ token0, token1 })

  const {
    data: poolData,
    isLoading: poolIsLoading,
    isFetched: poolDataIsFetched,
    refetch: refetchPoolData,
  } = useQuery(
    liquidityQueries.poolInfo({
      params: new PoolInfoRequest({
        protocol: protocol!,
        chainId: token0?.chainId,
        poolReferences: [],
        poolParameters: new PoolParameters({
          tokenAddressA: lookupAddress0,
          tokenAddressB: lookupAddress1,
          fee: isDynamicFeeTier(state.fee) ? DYNAMIC_FEE_DATA.feeAmount : state.fee?.feeAmount,
          hookAddress: state.hook,
          tickSpacing: state.fee?.tickSpacing,
        }),
      }),
      enabled: validCurrencyInput && protocol !== undefined && isFeeValid && !isChainUnsupported,
      // Keep an existing pool's current price/tick fresh so the chart's price line tracks the market.
      // The range itself never re-anchors off this poll — syncCurrentTickFromParent bails for existing
      // pools. Only polls once a pool exists — a not-yet-created pool returns no pools, so the interval
      // resolves to false and no polling happens while creating.
      refetchInterval: (query) => (query.state.data?.pools.length ? PollingInterval.Fast : false),
    }),
  )

  const fetchedPoolOrPair = poolData?.pools && poolData.pools.length > 0 ? poolData.pools[0] : undefined
  // The response's sqrtPriceX96/tick are denominated in the pool's on-chain (adapter) sort order.
  // When adapter substitution flips the pair's sort order relative to the displayed sec-tokens, an
  // SDK pool built from the displayed currencies would read the price inverted, so fail closed:
  // drop the pool and let the permissioned-creation guard block the flow. No live pair flips today
  // (verified against all deployed sec-token/adapter pairs); this protects future pairs.
  const poolOrPair = orientationFlipped ? undefined : fetchedPoolOrPair
  useEffect(() => {
    if (orientationFlipped && fetchedPoolOrPair) {
      logger.error(new Error('Permissioned pool dropped: adapter sort order flips displayed pair orientation'), {
        tags: { file: 'useDerivedPositionInfo', function: 'useDerivedPositionInfo' },
        extra: { lookupAddress0, lookupAddress1 },
      })
    }
  }, [orientationFlipped, fetchedPoolOrPair, lookupAddress0, lookupAddress1])
  // Don't declare "new pool" while the lookup key may still change to the adapter pair.
  const creatingPoolOrPair = poolDataIsFetched && !poolOrPair && !isChainUnsupported && !isLookupAddressLoading

  // Zero active liquidity doesn't say the pool holds no positions — only that none straddle the
  // current tick, which is what decides whether there is a distribution to chart there. Compared
  // against the raw served string rather than the SDK pool's `liquidity`, because the field is
  // optional on the wire and the SDK conversion defaults it to '0': reading it here keeps "the server
  // didn't say" distinct from "the pool is genuinely empty".
  const poolHasNoActiveLiquidity = poolOrPair?.poolLiquidity === '0'

  const hooks = poolOrPair?.hookAddress || ''
  const v2Pair = useMemo(
    () =>
      protocolVersion === ProtocolVersion.V2
        ? getSDKPoolFromPoolInformation({ poolOrPair, token0: wrappedToken0, token1: wrappedToken1, protocolVersion })
        : undefined,
    [protocolVersion, poolOrPair, wrappedToken0, wrappedToken1],
  )
  const v3Pool = useMemo(
    () =>
      protocolVersion === ProtocolVersion.V3
        ? getSDKPoolFromPoolInformation({ poolOrPair, token0: wrappedToken0, token1: wrappedToken1, protocolVersion })
        : undefined,
    [protocolVersion, poolOrPair, wrappedToken0, wrappedToken1],
  )
  // v4 holds native and wrapped native as distinct currencies, so its pool follows the displayed legs.
  const v4Pool = useMemo(
    () =>
      protocolVersion === ProtocolVersion.V4
        ? getSDKPoolFromPoolInformation({
            poolOrPair,
            token0: sortedCurrencies.TOKEN0,
            token1: sortedCurrencies.TOKEN1,
            protocolVersion,
            hooks,
          })
        : undefined,
    [protocolVersion, poolOrPair, sortedCurrencies, hooks],
  )

  return useMemo(() => {
    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return {
        currencies: {
          display: sortedCurrencies,
          sdk: sortedCurrencies,
        },
        protocolVersion: ProtocolVersion.V4,
        refetchPoolData: () => undefined,
      }
    }

    if (protocolVersion === ProtocolVersion.V2) {
      return {
        currencies: {
          display: sortedCurrencies,
          sdk: wrappedCurrencies,
        },
        protocolVersion,
        pair: v2Pair,
        protocolFee: poolOrPair?.protocolFee,
        creatingPoolOrPair,
        poolHasNoActiveLiquidity,
        poolOrPairLoading: poolIsLoading,
        refetchPoolData,
      } satisfies CreateV2PositionInfo
    }

    if (protocolVersion === ProtocolVersion.V3) {
      return {
        currencies: {
          display: sortedCurrencies,
          sdk: wrappedCurrencies,
        },
        protocolVersion,
        pool: v3Pool,
        protocolFee: poolOrPair?.protocolFee,
        creatingPoolOrPair,
        poolHasNoActiveLiquidity,
        poolOrPairLoading: poolIsLoading,
        poolId: poolOrPair?.poolReferenceIdentifier,
        refetchPoolData,
      } satisfies CreateV3PositionInfo
    }

    return {
      currencies: {
        display: sortedCurrencies,
        sdk: sortedCurrencies,
      },
      protocolVersion, // V4
      pool: v4Pool,
      protocolFee: poolOrPair?.protocolFee,
      creatingPoolOrPair,
      poolHasNoActiveLiquidity,
      poolOrPairLoading: poolIsLoading,
      poolId: poolOrPair?.poolReferenceIdentifier,
      refetchPoolData,
    } satisfies CreateV4PositionInfo
  }, [
    protocolVersion,
    poolOrPair,
    creatingPoolOrPair,
    poolHasNoActiveLiquidity,
    poolIsLoading,
    refetchPoolData,
    sortedCurrencies,
    wrappedCurrencies,
    v2Pair,
    v3Pool,
    v4Pool,
  ])
}
