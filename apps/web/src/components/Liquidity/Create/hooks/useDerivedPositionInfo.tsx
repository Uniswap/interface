import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolInfoRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { PoolParameters } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import {
  CreatePositionInfo,
  CreateV2PositionInfo,
  CreateV3PositionInfo,
  CreateV4PositionInfo,
  DYNAMIC_FEE_DATA,
  PositionState,
} from '~/components/Liquidity/Create/types'
import {
  getCurrencyWithWrap,
  getTokenOrZeroAddress,
  validateCurrencyInput,
} from '~/components/Liquidity/utils/currency'
import { isDynamicFeeTier } from '~/components/Liquidity/utils/feeTiers'
import { isUnsupportedLPChain } from '~/components/Liquidity/utils/isUnsupportedLPChain'
import { getSDKPoolFromPoolInformation } from '~/components/Liquidity/utils/parseFromRest'
import { getProtocols } from '~/components/Liquidity/utils/protocolVersion'
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

  const sortedCurrencies = getSortedCurrenciesForProtocol({ a: tokenA, b: tokenB, protocolVersion })
  const validCurrencyInput = validateCurrencyInput(sortedCurrencies)

  const token0 = getCurrencyWithWrap(sortedCurrencies.TOKEN0, protocolVersion)
  const token1 = getCurrencyWithWrap(sortedCurrencies.TOKEN1, protocolVersion)
  const protocol = getProtocols(protocolVersion)

  const isFeeValid = protocolVersion === ProtocolVersion.V2 ? true : state.fee !== undefined
  const isChainUnsupported = isUnsupportedLPChain(token0?.chainId, protocolVersion)

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
          tokenAddressA: getTokenOrZeroAddress(token0),
          tokenAddressB: getTokenOrZeroAddress(token1),
          fee: isDynamicFeeTier(state.fee) ? DYNAMIC_FEE_DATA.feeAmount : state.fee?.feeAmount,
          hookAddress: state.hook,
          tickSpacing: state.fee?.tickSpacing,
        }),
      }),
      enabled: validCurrencyInput && protocol !== undefined && isFeeValid && !isChainUnsupported,
    }),
  )

  const poolOrPair = poolData?.pools && poolData.pools.length > 0 ? poolData.pools[0] : undefined
  const creatingPoolOrPair = poolDataIsFetched && !poolOrPair && !isChainUnsupported

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
  }, [protocolVersion, poolOrPair, creatingPoolOrPair, poolIsLoading, refetchPoolData, sortedCurrencies])
}
