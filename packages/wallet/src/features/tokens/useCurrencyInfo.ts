import { useMemo } from 'react'
import { useTokenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import {
  currencyIdToContractInput,
  gqlTokenToCurrencyInfo,
} from 'wallet/src/features/dataApi/utils'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyId } from 'wallet/src/utils/currencyId'

export function useCurrencyInfo(_currencyId?: string): Maybe<CurrencyInfo> {
  const { data } = useTokenQuery({
    variables: currencyIdToContractInput(_currencyId ?? ''),
    skip: !_currencyId,
    fetchPolicy: 'cache-first',
  })

  return useMemo(() => {
    if (!data?.token || !_currencyId) {
      return
    }

    return gqlTokenToCurrencyInfo(data.token)
  }, [data, _currencyId])
}

export function useNativeCurrencyInfo(chainId: ChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: ChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(chainId)
  return useCurrencyInfo(wrappedCurrencyId)
}
