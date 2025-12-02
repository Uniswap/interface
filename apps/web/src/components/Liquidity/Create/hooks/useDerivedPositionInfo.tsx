import { Pool, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolInfoRequest, PoolParameters } from '@uniswap/client-trading/dist/trading/v1/api_pb'
import { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import {
  CreatePositionInfo,
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  DYNAMIC_FEE_DATA,
  FeeData,
  PositionState,
} from 'components/Liquidity/Create/types'
import { getCurrencyWithWrap, getTokenOrZeroAddress, validateCurrencyInput } from 'components/Liquidity/utils/currency'
import { getFeeTierKey, isDynamicFeeTier } from 'components/Liquidity/utils/feeTiers'
import { getSDKPoolFromPoolInformation, getV4SDKPoolFromRestPool } from 'components/Liquidity/utils/parseFromRest'
import {
  getProtocols,
  pairEnabledProtocolVersion,
  poolEnabledProtocolVersion,
} from 'components/Liquidity/utils/protocolVersion'
import { PoolState, usePool } from 'hooks/usePools'
import { PairState, useV2Pair } from 'hooks/useV2Pairs'
import { useMemo } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { usePoolInfoQuery } from 'uniswap/src/data/apiClients/tradingApi/usePoolInfoQuery'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'

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

function filterPoolByFeeTier(pool: Pool, feeTier: FeeData): Pool | undefined {
  if (getFeeTierKey(feeTier.feeAmount, feeTier.isDynamic) === getFeeTierKey(pool.fee, pool.isDynamicFee)) {
    return pool
  }
  return undefined
}

// TODO(LP-275): remove once PoolInfoEndpoint is fully rolled out
function useGetLegacyPoolOrPair({
  isPoolInfoEndpointEnabled,
  protocolVersion,
  validCurrencyInput,
  sortedCurrencies,
  fee,
  hook,
}: {
  isPoolInfoEndpointEnabled: boolean
  protocolVersion: ProtocolVersion
  validCurrencyInput: boolean
  sortedCurrencies: { [field in PositionField]: Maybe<Currency> }
  fee?: FeeData
  hook?: string
}): CreatePositionInfo {
  const { chainId } = useMultichainContext()
  const token0 = getCurrencyWithWrap(sortedCurrencies.TOKEN0, protocolVersion)
  const token1 = getCurrencyWithWrap(sortedCurrencies.TOKEN1, protocolVersion)

  const poolsQueryEnabled =
    fee !== undefined && !isPoolInfoEndpointEnabled && poolEnabledProtocolVersion(protocolVersion) && validCurrencyInput
  const {
    data: poolData,
    isLoading: poolIsLoading,
    isFetched: poolDataIsFetched,
    refetch: refetchPoolData,
  } = useGetPoolsByTokens(
    {
      fee: fee?.feeAmount,
      chainId,
      protocolVersions: [protocolVersion],
      token0: getTokenOrZeroAddress(token0),
      token1: getTokenOrZeroAddress(token1),
      hooks: hook?.toLowerCase() ?? ZERO_ADDRESS, // BE does not accept checksummed addresses
    },
    poolsQueryEnabled,
  )

  const pool =
    poolData?.pools && poolData.pools.length > 0 && fee ? filterPoolByFeeTier(poolData.pools[0], fee) : undefined

  const pairResult = useV2Pair(sortedCurrencies.TOKEN0?.wrapped, sortedCurrencies.TOKEN1?.wrapped)
  const pairIsLoading = pairResult[0] === PairState.LOADING

  const pair =
    validCurrencyInput && pairEnabledProtocolVersion(protocolVersion) ? pairResult[1] || undefined : undefined

  const v3PoolResult = usePool({
    currencyA: sortedCurrencies.TOKEN0?.wrapped,
    currencyB: sortedCurrencies.TOKEN1?.wrapped,
    feeAmount: fee?.feeAmount,
  })
  const v3Pool = protocolVersion === ProtocolVersion.V3 ? (v3PoolResult[1] ?? undefined) : undefined

  const v4Pool = useMemo(() => {
    return protocolVersion === ProtocolVersion.V4
      ? getV4SDKPoolFromRestPool({
          pool,
          token0: sortedCurrencies.TOKEN0,
          token1: sortedCurrencies.TOKEN1,
          hooks: pool?.hooks?.address || '',
        })
      : undefined
  }, [pool, protocolVersion, sortedCurrencies])

  const creatingPoolOrPair = useMemo(() => {
    if (!fee) {
      return false
    }

    if (protocolVersion === ProtocolVersion.UNSPECIFIED) {
      return false
    }

    if (protocolVersion === ProtocolVersion.V2) {
      return pairResult[0] === PairState.NOT_EXISTS
    }

    if (protocolVersion === ProtocolVersion.V3) {
      return v3PoolResult[0] === PoolState.NOT_EXISTS
    }

    return poolDataIsFetched && !pool
  }, [protocolVersion, pairResult, v3PoolResult, pool, poolDataIsFetched, fee])

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
          sdk: {
            [PositionField.TOKEN0]: sortedCurrencies.TOKEN0?.wrapped,
            [PositionField.TOKEN1]: sortedCurrencies.TOKEN1?.wrapped,
          },
        },
        protocolVersion,
        pair,
        creatingPoolOrPair,
        poolOrPairLoading: pairIsLoading,
        refetchPoolData,
      } satisfies CreateV2PositionInfo
    }

    if (protocolVersion === ProtocolVersion.V3) {
      return {
        currencies: {
          display: sortedCurrencies,
          sdk: {
            [PositionField.TOKEN0]: sortedCurrencies.TOKEN0?.wrapped,
            [PositionField.TOKEN1]: sortedCurrencies.TOKEN1?.wrapped,
          },
        },
        protocolVersion,
        pool: v3Pool,
        creatingPoolOrPair,
        poolOrPairLoading: poolIsLoading,
        poolId: pool?.poolId,
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
      creatingPoolOrPair,
      poolOrPairLoading: poolIsLoading,
      poolId: pool?.poolId,
      refetchPoolData,
    } satisfies CreateV4PositionInfo
  }, [
    protocolVersion,
    v4Pool,
    creatingPoolOrPair,
    poolIsLoading,
    pool?.poolId,
    pair,
    pairIsLoading,
    v3Pool,
    refetchPoolData,
    sortedCurrencies,
  ])
}

/**
 * @param state user-defined state for a position being created or migrated
 * @returns derived position information such as existing Pools
 */
export function useDerivedPositionInfo(
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> },
  state: PositionState,
): CreatePositionInfo {
  const isPoolInfoEndpointEnabled = getFeatureFlag(FeatureFlags.PoolInfoEndpoint)

  const { protocolVersion } = state
  const { tokenA, tokenB } = currencyInputs

  const sortedCurrencies = getSortedCurrenciesForProtocol({ a: tokenA, b: tokenB, protocolVersion })
  const validCurrencyInput = validateCurrencyInput(sortedCurrencies)

  const legacyPoolOrPair = useGetLegacyPoolOrPair({
    isPoolInfoEndpointEnabled,
    protocolVersion,
    validCurrencyInput,
    sortedCurrencies,
    fee: state.fee,
    hook: state.hook,
  })

  const token0 = getCurrencyWithWrap(sortedCurrencies.TOKEN0, protocolVersion)
  const token1 = getCurrencyWithWrap(sortedCurrencies.TOKEN1, protocolVersion)
  const protocol = getProtocols(protocolVersion)

  const isFeeValid = protocolVersion === ProtocolVersion.V2 ? true : state.fee !== undefined

  const {
    data: poolData,
    isLoading: poolIsLoading,
    isFetched: poolDataIsFetched,
    refetch: refetchPoolData,
  } = usePoolInfoQuery({
    params: new PoolInfoRequest({
      protocol: protocol!,
      chainId: token0?.chainId,
      poolReferences: [],
      poolParameters: new PoolParameters({
        tokenAddressA: getTokenOrZeroAddress(token0),
        tokenAddressB: getTokenOrZeroAddress(token1),
        fee: isDynamicFeeTier(state.fee) ? DYNAMIC_FEE_DATA.feeAmount : state.fee?.feeAmount,
        hookAddress: state.hook,
        tickSpacing: state.fee?.tickSpacing,
      }),
    }),
    enabled: isPoolInfoEndpointEnabled && validCurrencyInput && protocol !== undefined && isFeeValid,
  })

  const poolOrPair = poolData?.pools && poolData.pools.length > 0 ? poolData.pools[0] : undefined
  const creatingPoolOrPair = poolDataIsFetched && !poolOrPair

  return useMemo(() => {
    if (!isPoolInfoEndpointEnabled) {
      return legacyPoolOrPair
    }

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
      const pair = getSDKPoolFromPoolInformation({
        poolOrPair,
        token0: sortedCurrencies.TOKEN0?.wrapped,
        token1: sortedCurrencies.TOKEN1?.wrapped,
        protocolVersion,
      })

      return {
        currencies: {
          display: sortedCurrencies,
          sdk: {
            [PositionField.TOKEN0]: sortedCurrencies.TOKEN0?.wrapped,
            [PositionField.TOKEN1]: sortedCurrencies.TOKEN1?.wrapped,
          },
        },
        protocolVersion,
        pair,
        creatingPoolOrPair,
        poolOrPairLoading: poolIsLoading,
        refetchPoolData,
      } satisfies CreateV2PositionInfo
    }

    if (protocolVersion === ProtocolVersion.V3) {
      const v3Pool = getSDKPoolFromPoolInformation({
        poolOrPair,
        token0: sortedCurrencies.TOKEN0?.wrapped,
        token1: sortedCurrencies.TOKEN1?.wrapped,
        protocolVersion,
      })

      return {
        currencies: {
          display: sortedCurrencies,
          sdk: {
            [PositionField.TOKEN0]: sortedCurrencies.TOKEN0?.wrapped,
            [PositionField.TOKEN1]: sortedCurrencies.TOKEN1?.wrapped,
          },
        },
        protocolVersion,
        pool: v3Pool,
        creatingPoolOrPair,
        poolOrPairLoading: poolIsLoading,
        poolId: poolOrPair?.poolReferenceIdentifier,
        refetchPoolData,
      } satisfies CreateV3PositionInfo
    }

    const v4Pool = getSDKPoolFromPoolInformation({
      poolOrPair,
      token0: sortedCurrencies.TOKEN0,
      token1: sortedCurrencies.TOKEN1,
      protocolVersion,
      hooks: poolOrPair?.hookAddress || '',
    })

    return {
      currencies: {
        display: sortedCurrencies,
        sdk: sortedCurrencies,
      },
      protocolVersion, // V4
      pool: v4Pool,
      creatingPoolOrPair,
      poolOrPairLoading: poolIsLoading,
      poolId: poolOrPair?.poolReferenceIdentifier,
      refetchPoolData,
    } satisfies CreateV4PositionInfo
  }, [
    protocolVersion,
    poolOrPair,
    creatingPoolOrPair,
    poolIsLoading,
    refetchPoolData,
    sortedCurrencies,
    isPoolInfoEndpointEnabled,
    legacyPoolOrPair,
  ])
}
