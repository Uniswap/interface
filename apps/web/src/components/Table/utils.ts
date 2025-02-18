import { useTranslation } from 'react-i18next'

/**
 * Displays the time as a human-readable string.
 *
 * @param {number} timestamp - Transaction timestamp in milliseconds.
 * @param {number} locale - BCP 47 language tag (e.g. en-US).
 * @returns {string} Message to display.
 */
export function useAbbreviatedTimeString(timestamp: number) {
  const { t } = useTranslation()
  const now = Date.now()
  const timeSince = now - timestamp
  const secondsPassed = Math.floor(timeSince / 1000)
  const minutesPassed = Math.floor(secondsPassed / 60)
  const hoursPassed = Math.floor(minutesPassed / 60)
  const daysPassed = Math.floor(hoursPassed / 24)
  const monthsPassed = Math.floor(daysPassed / 30)

  if (monthsPassed > 0) {
    return t(`common.time.past.months`, { months: monthsPassed })
  } else if (daysPassed > 0) {
    return t(`common.time.past.days`, { days: daysPassed })
  } else if (hoursPassed > 0) {
    return t(`common.time.past.hours`, { hours: hoursPassed })
  } else if (minutesPassed > 0) {
    return t(`common.time.past.minutes`, { minutes: minutesPassed })
  } else {
    return t(`common.time.past.seconds`, { seconds: secondsPassed })
  }
}
