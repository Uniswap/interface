import { useTranslation } from 'react-i18next'
import { getRelativeAge } from 'utilities/src/time/relativeAge'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useNowMs } from 'utilities/src/time/useNowMs'

/**
 * The age of `timestamp` (ms) as one abbreviated unit — "42s", "5m", "3h", "29d", "11mo", "2y" —
 * re-rendering every second so it stays current. A future timestamp reads "0s".
 */
export function useAbbreviatedTimeString(timestamp: number): string {
  const { t } = useTranslation()
  const age = getRelativeAge(timestamp, useNowMs(ONE_SECOND_MS))

  if (age === undefined) {
    return '-'
  }
  switch (age.unit) {
    case 'seconds':
      return t('common.time.past.seconds.short', { seconds: age.value })
    case 'minutes':
      return t('common.time.past.minutes.short', { minutes: age.value })
    case 'hours':
      return t('common.time.past.hours.short', { hours: age.value })
    case 'days':
      return t('common.time.past.days.short', { days: age.value })
    case 'months':
      return t('common.time.past.months.short', { months: age.value })
  }
  return t('common.time.past.years.short', { years: age.value })
}
