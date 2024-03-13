import { t } from '@lingui/macro'

/**
 * Displays the time as a human-readable string.
 *
 * @param {number} timestamp - Transaction timestamp in milliseconds.
 * @param {number} locale - BCP 47 language tag (e.g. en-US).
 * @returns {string} Message to display.
 */
export function getAbbreviatedTimeString(timestamp: number) {
  const now = Date.now()
  const timeSince = now - timestamp
  const secondsPassed = Math.floor(timeSince / 1000)
  const minutesPassed = Math.floor(secondsPassed / 60)
  const hoursPassed = Math.floor(minutesPassed / 60)
  const daysPassed = Math.floor(hoursPassed / 24)
  const monthsPassed = Math.floor(daysPassed / 30)

  if (monthsPassed > 0) {
    return t`${monthsPassed}mo ago`
  } else if (daysPassed > 0) {
    return t`${daysPassed}d ago`
  } else if (hoursPassed > 0) {
    return t`${hoursPassed}h ago`
  } else if (minutesPassed > 0) {
    return t`${minutesPassed}m ago`
  } else {
    return t`${secondsPassed}s ago`
  }
}
