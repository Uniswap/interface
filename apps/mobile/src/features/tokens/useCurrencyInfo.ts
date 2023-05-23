import { useMemo } from 'react'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { currencyIdToContractInput, gqlTokenToCurrencyInfo } from 'src/features/dataApi/utils'
import { ChainId } from 'wallet/src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'wallet/src/constants/tokens'
import { useTokenQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { buildNativeCurrencyId, currencyId } from 'wallet/src/utils/currencyId'

export function useCurrencyInfo(_currencyId?: string): Maybe<CurrencyInfo> {
  const { data } = useTokenQuery({
    variables: currencyIdToContractInput(_currencyId ?? ''),
    skip: !_currencyId,
    fetchPolicy: 'cache-first',
  })

  return useMemo(() => {
    if (!data?.token || !_currencyId) return

    return gqlTokenToCurrencyInfo(data.token)
  }, [data, _currencyId])
}

export function useNativeCurrencyInfo(chainId: ChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: ChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = currencyId(WRAPPED_NATIVE_CURRENCY[chainId])
  return useCurrencyInfo(wrappedCurrencyId)
}
