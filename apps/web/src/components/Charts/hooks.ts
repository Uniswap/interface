import { UTCTimestamp } from 'lightweight-charts'
import { useCallback } from 'react'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'

export function useHeaderDateFormatter() {
  const locale = useCurrentLocale()
  return useCallback(
    (time?: UTCTimestamp) => {
      if (!time) {
        return '-'
      }
      const headerTimeFormatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }
      return new Date(time * 1000).toLocaleString(locale, headerTimeFormatOptions)
    },
    [locale],
  )
}
