import { t } from '@lingui/macro'

/**
 * Displays the time as a human-readable string.
 *
 * @param {number} timestamp - Transaction timestamp in milliseconds.
 * @param {number} locale - BCP 47 language tag (e.g. en-US).
 * @returns {string} Message to display.
 */
export function getLocaleTimeString(timestamp: number, locale = 'en-US') {
  const now = Date.now()
  const timeSince = now - timestamp
  const secondsPassed = Math.floor(timeSince / 1000)
  const minutesPassed = Math.floor(secondsPassed / 60)
  const hoursPassed = Math.floor(minutesPassed / 60)

  if (hoursPassed > 24) {
    const options: Intl.DateTimeFormatOptions = {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
    const date = new Date(timestamp)
    return date
      .toLocaleString(locale, options)
      .toLocaleLowerCase(locale)
      .replace(/\s(am|pm)/, '$1')
  } else if (hoursPassed == 24) {
    return t`1 day ago`
  } else if (minutesPassed >= 60) {
    return `${hoursPassed} ${hoursPassed === 1 ? t`hour ago` : t`hours ago`}`
  } else if (secondsPassed >= 60) {
    return `${minutesPassed} ${minutesPassed === 1 ? t`minute ago` : t`minutes ago`}`
  } else {
    return `${secondsPassed} ${secondsPassed === 1 ? t`second ago` : t`seconds ago`}`
  }
}
