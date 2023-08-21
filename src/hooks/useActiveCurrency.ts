import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, SupportedCurrency } from 'constants/currencies'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

import useParsedQueryString from './useParsedQueryString'

export const activeCurrencyAtom = atomWithStorage<SupportedCurrency>('activeCurrency', DEFAULT_CURRENCY)

function useUrlCurrency() {
  const parsed = useParsedQueryString()
  const parsedCurrency = parsed.cur

  if (typeof parsedCurrency !== 'string') return undefined

  const lowerCaseSupportedCurrency = parsedCurrency.toLowerCase()
  return SUPPORTED_CURRENCIES.find((currency) => currency.toLowerCase() === lowerCaseSupportedCurrency)
}

export function useActiveCurrency(): SupportedCurrency {
  const activeCurrency = useAtomValue(activeCurrencyAtom)
  const urlCurrency = useUrlCurrency()

  return useMemo(() => urlCurrency ?? activeCurrency, [activeCurrency, urlCurrency])
}
