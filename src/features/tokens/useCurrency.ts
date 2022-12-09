import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTokenQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { currencyIdToContractInput, gqlTokenToCurrencyInfo } from 'src/features/dataApi/utils'

/**
 * @param currencyId currency address or identifier (ETH for native Ether)
 */
export function useCurrency(currencyId?: string): NullUndefined<Currency> {
  return useCurrencyInfo(currencyId)?.currency
}

export function useCurrencyInfo(currencyId?: string): NullUndefined<CurrencyInfo> {
  const { data } = useTokenQuery({
    variables: currencyIdToContractInput(currencyId ?? ''),
    skip: !currencyId,
  })

  return useMemo(() => {
    if (!data?.token) return

    return gqlTokenToCurrencyInfo(data.token)
  }, [data])
}
