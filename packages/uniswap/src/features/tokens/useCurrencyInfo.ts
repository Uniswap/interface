import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { getCommonBase } from 'uniswap/src/constants/routing'
import { isBackendSupportedChainId } from 'uniswap/src/features/chains/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getCurrencyInfoFromCache } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/gqlTokenToCurrencyInfo'
import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'uniswap/src/utils/currencyId'

function useCurrencyInfoQuery(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): { currencyInfo: Maybe<CurrencyInfo>; loading: boolean; error?: Error } {
  const chainId = useMemo(() => (_currencyId ? currencyIdToChain(_currencyId) : undefined), [_currencyId])
  const isUnsupportedChain = chainId && !isBackendSupportedChainId(chainId)

  const queryResult = GraphQLApi.useTokenQuery({
    variables: currencyIdToContractInput(_currencyId ?? ''),
    skip: !_currencyId || options?.skip || isUnsupportedChain,
    fetchPolicy: options?.refetch ? 'cache-and-network' : 'cache-first',
  })

  const currencyInfo = useMemo(() => {
    if (!_currencyId) {
      return undefined
    }

    const chainIdFromId = currencyIdToChain(_currencyId)
    let address: Address | undefined
    try {
      address = currencyIdToAddress(_currencyId)
    } catch (_error) {
      return undefined
    }

    if (!chainIdFromId || !address) {
      return undefined
    }

    // For unsupported chains (like HashKey), try to get CurrencyInfo from cache first
    if (isUnsupportedChain) {
      // Try to get token info from common base first
      const commonBase = getCommonBase(chainIdFromId, address)
      if (commonBase) {
        const copyCommonBase = { ...commonBase }
        copyCommonBase.currencyId = _currencyId
        return copyCommonBase
      }

      // Try to get from cache (e.g., from pools data)
      const cachedCurrencyInfo = getCurrencyInfoFromCache(_currencyId)
      if (cachedCurrencyInfo) {
        return cachedCurrencyInfo
      }

      // If no cache, return undefined
      // The CurrencyInfo should be cached when token is selected from pools
      return undefined
    }

    // For supported chains, use GraphQL query result
    if (chainIdFromId && address) {
      const commonBase = getCommonBase(chainIdFromId, address)
      if (commonBase) {
        // Creating new object to avoid error "Cannot assign to read only property"
        const copyCommonBase = { ...commonBase }
        // Related to TODO(WEB-5111)
        // Some common base images are broken so this'll ensure we read from uniswap images
        if (queryResult.data?.token?.project?.logoUrl) {
          copyCommonBase.logoUrl = queryResult.data.token.project.logoUrl
        }
        copyCommonBase.currencyId = _currencyId
        return copyCommonBase
      }
    }

    return queryResult.data?.token && gqlTokenToCurrencyInfo(queryResult.data.token)
  }, [_currencyId, queryResult.data?.token, isUnsupportedChain])

  return {
    currencyInfo,
    loading: isUnsupportedChain ? false : queryResult.loading,
    error: queryResult.error,
  }
}

export function useCurrencyInfo(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo> {
  const { currencyInfo } = useCurrencyInfoQuery(_currencyId, options)
  return currencyInfo
}

export function useCurrencyInfoWithLoading(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): {
  currencyInfo: Maybe<CurrencyInfo>
  loading: boolean
  error?: Error
} {
  return useCurrencyInfoQuery(_currencyId, options)
}

export function useCurrencyInfos(
  _currencyIds: string[],
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo>[] {
  const { data } = GraphQLApi.useTokensQuery({
    variables: {
      contracts: _currencyIds.map(currencyIdToContractInput),
    },
    skip: !_currencyIds.length || options?.skip,
    fetchPolicy: options?.refetch ? 'cache-and-network' : 'cache-first',
  })

  return useMemo(() => {
    return data?.tokens?.map((token) => token && gqlTokenToCurrencyInfo(token)) ?? []
  }, [data])
}

export function useNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(chainId)
  return useCurrencyInfo(wrappedCurrencyId)
}
