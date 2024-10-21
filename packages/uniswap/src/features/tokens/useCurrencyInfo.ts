import { useMemo } from 'react'
import { useTokenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput, gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyId } from 'uniswap/src/utils/currencyId'

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
    if (!data?.token || !_currencyId) {
      return undefined
    }

    return gqlTokenToCurrencyInfo(data.token)
  }, [data, _currencyId])
}

export function useNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(chainId)
  return useCurrencyInfo(wrappedCurrencyId)
}
