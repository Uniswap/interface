import { useMemo } from 'react'
import { getCommonBase } from 'uniswap/src/constants/routing'
import { useTokenQuery, useTokensQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput, gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'

export function useCurrencyInfo(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo> {
  const { data } = useTokenQuery({
    variables: currencyIdToContractInput(_currencyId ?? ''),
    skip: !_currencyId || options?.skip,
    fetchPolicy: options?.refetch ? 'cache-and-network' : 'cache-first',
  })

  return useMemo(() => {
    if (!_currencyId) {
      return undefined
    }

    const chainId = currencyIdToChain(_currencyId)
    let address: Address | undefined
    try {
      address = currencyIdToAddress(_currencyId)
    } catch (error) {
      return undefined
    }
    if (chainId && address) {
      const commonBase = getCommonBase(chainId, isNativeCurrencyAddress(chainId, address), address)
      if (commonBase) {
        // Creating new object to avoid error "Cannot assign to read only property"
        const copyCommonBase = { ...commonBase }
        // Related to TODO(WEB-5111)
        // Some common base images are broken so this'll ensure we read from uniswap images
        if (data?.token?.project?.logoUrl) {
          copyCommonBase.logoUrl = data.token.project.logoUrl
        }
        copyCommonBase.currencyId = _currencyId
        return copyCommonBase
      }
    }

    return data?.token && gqlTokenToCurrencyInfo(data.token)
  }, [_currencyId, data?.token])
}

export function useCurrencyInfos(
  _currencyIds: string[],
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo>[] {
  const { data } = useTokensQuery({
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
