import { useActiveLocale } from 'hooks/useActiveLocale'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useMemo } from 'react'
import { FiatCurrency, ORDERED_CURRENCIES } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { getFiatCurrencyComponents } from 'utils/formatNumbers'

function useUrlLocalCurrency() {
  const parsed = useParsedQueryString()
  const parsedLocalCurrency = parsed.cur

  if (typeof parsedLocalCurrency !== 'string') {
    return undefined
  }

  const lowerCaseSupportedLocalCurrency = parsedLocalCurrency.toLowerCase()
  return ORDERED_CURRENCIES.find((localCurrency) => localCurrency.toLowerCase() === lowerCaseSupportedLocalCurrency)
}

export function useActiveLocalCurrency(): FiatCurrency {
  const activeLocalCurrency = useAppFiatCurrency()
  const urlLocalCurrency = useUrlLocalCurrency()

  return useMemo(() => urlLocalCurrency ?? activeLocalCurrency, [activeLocalCurrency, urlLocalCurrency])
}

export function useActiveLocalCurrencyComponents() {
  const activeLocale = useActiveLocale()
  const activeLocalCurrency = useActiveLocalCurrency()

  return useMemo(
    () => getFiatCurrencyComponents(activeLocale, activeLocalCurrency),
    [activeLocalCurrency, activeLocale],
  )
}
