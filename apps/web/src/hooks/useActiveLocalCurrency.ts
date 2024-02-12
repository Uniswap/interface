import { DEFAULT_LOCAL_CURRENCY, SUPPORTED_LOCAL_CURRENCIES, SupportedLocalCurrency } from 'constants/localCurrencies'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

import useParsedQueryString from './useParsedQueryString'

export const activeLocalCurrencyAtom = atomWithStorage<SupportedLocalCurrency>(
  'activeLocalCurrency',
  DEFAULT_LOCAL_CURRENCY
)

function useUrlLocalCurrency() {
  const parsed = useParsedQueryString()
  const parsedLocalCurrency = parsed.cur

  if (typeof parsedLocalCurrency !== 'string') return undefined

  const lowerCaseSupportedLocalCurrency = parsedLocalCurrency.toLowerCase()
  return SUPPORTED_LOCAL_CURRENCIES.find(
    (localCurrency) => localCurrency.toLowerCase() === lowerCaseSupportedLocalCurrency
  )
}

export function useActiveLocalCurrency(): SupportedLocalCurrency {
  const activeLocalCurrency = useAtomValue(activeLocalCurrencyAtom)
  const urlLocalCurrency = useUrlLocalCurrency()

  return useMemo(() => urlLocalCurrency ?? activeLocalCurrency, [activeLocalCurrency, urlLocalCurrency])
}
