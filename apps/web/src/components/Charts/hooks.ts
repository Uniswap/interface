import { useActiveLocale } from 'hooks/useActiveLocale'
import { UTCTimestamp } from 'lightweight-charts'
import { useCallback } from 'react'

export function useHeaderDateFormatter() {
  const locale = useActiveLocale()
  return useCallback(
    (time?: UTCTimestamp) => {
      if (!time) return '-'
      const headerTimeFormatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }
      return new Date(time * 1000).toLocaleString(locale, headerTimeFormatOptions)
    },
    [locale]
  )
}
