import { sendEvent } from 'components/analytics'
import { SupportedLocale } from 'constants/locales'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { stringify } from 'qs'
import { useMemo } from 'react'
import type { To } from 'react-router-dom'
import { useLocation } from 'react-router-dom'

import { useActiveLocale } from './useActiveLocale'

export function useLocationLinkProps(locale: SupportedLocale | null): {
  to?: To
  onClick?: () => void
} {
  const location = useLocation()
  const qs = useParsedQueryString()
  const activeLocale = useActiveLocale()

  return useMemo(
    () =>
      !locale
        ? {}
        : {
            to: {
              ...location,
              search: stringify({ ...qs, lng: locale }),
            },
            onClick: () => {
              sendEvent({
                category: 'Localization',
                action: 'Switch Locale',
                label: `${activeLocale} -> ${locale}`,
              })
            },
          },
    [location, qs, activeLocale, locale]
  )
}
