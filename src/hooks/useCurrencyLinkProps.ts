import { sendAnalyticsEvent } from 'analytics'
import { SupportedCurrency } from 'constants/currencies'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useAtom } from 'jotai'
import { stringify } from 'qs'
import { useMemo } from 'react'
import type { To } from 'react-router-dom'
import { useLocation } from 'react-router-dom'

import { activeCurrencyAtom, useActiveCurrency } from './useActiveCurrency'

export function useCurrencyLinkProps(currency?: SupportedCurrency): {
  to?: To
  onClick?: () => void
} {
  const location = useLocation()
  const qs = useParsedQueryString()
  const activeCurrency = useActiveCurrency()
  const [, updateActiveCurrency] = useAtom(activeCurrencyAtom)

  return useMemo(
    () =>
      !currency
        ? {}
        : {
            to: {
              ...location,
              search: stringify({ ...qs, cur: currency }),
            },
            onClick: () => {
              updateActiveCurrency(currency)
              sendAnalyticsEvent('Currency Selected', {
                previous_currency: activeCurrency,
                new_currency: currency,
              })
            },
          },
    [currency, location, qs, updateActiveCurrency, activeCurrency]
  )
}
