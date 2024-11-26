import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { stringify } from 'qs'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import type { To } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { setCurrentFiatCurrency } from 'uniswap/src/features/settings/slice'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export function useLocalCurrencyLinkProps(localCurrency?: FiatCurrency): {
  to?: To
  onClick?: () => void
} {
  const dispatch = useDispatch()
  const location = useLocation()
  const qs = useParsedQueryString()
  const activeLocalCurrency = useActiveLocalCurrency()

  return useMemo(
    () =>
      !localCurrency
        ? {}
        : {
            to: {
              ...location,
              search: stringify({ ...qs, cur: localCurrency }),
            },
            onClick: () => {
              dispatch(setCurrentFiatCurrency(localCurrency))
              sendAnalyticsEvent(InterfaceEventNameLocal.LocalCurrencySelected, {
                previous_local_currency: activeLocalCurrency,
                new_local_currency: localCurrency,
              })
            },
          },
    [localCurrency, location, qs, dispatch, activeLocalCurrency],
  )
}
