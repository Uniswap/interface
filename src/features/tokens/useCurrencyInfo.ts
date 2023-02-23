import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import { useTokenQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { currencyIdToContractInput, gqlTokenToCurrencyInfo } from 'src/features/dataApi/utils'
import { buildNativeCurrencyId, currencyId } from 'src/utils/currencyId'

export function useCurrencyInfo(_currencyId?: string): NullUndefined<CurrencyInfo> {
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

export function useNativeCurrencyInfo(chainId: ChainId): NullUndefined<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: ChainId): NullUndefined<CurrencyInfo> {
  const wrappedCurrencyId = currencyId(WRAPPED_NATIVE_CURRENCY[chainId])
  return useCurrencyInfo(wrappedCurrencyId)
}
