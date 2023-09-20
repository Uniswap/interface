import { SwapAction } from './types'

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
    return '1 day ago'
  } else if (minutesPassed >= 60) {
    return `${hoursPassed} ${hoursPassed === 1 ? 'hour' : 'hours'} ago`
  } else if (secondsPassed >= 60) {
    return `${minutesPassed} ${minutesPassed === 1 ? 'minute' : 'minutes'} ago`
  } else {
    return `${secondsPassed} ${secondsPassed === 1 ? 'second' : 'seconds'} ago`
  }
}

/**
 * Determine the type of swap by comparing the address of the input token
 * to the address of the current token detail page. If they're the same,
 * then the TDP token is the input and is hence being sold. If they're not
 * the same, then the TDP token is the output and is hence being bought.
 *
 * @param {number} inputTokenAddress - Address of the token that was provided as input to the swap.
 * @param {number} referenceTokenAddress - Address of the token being displayed on TDP.
 * @returns {SwapAction} Swap action type indicating whether the swap was a Buy or Sell of the TDP token.
 */
export function getSwapType(inputTokenAddress: string, referenceTokenAddress: string) {
  return inputTokenAddress === referenceTokenAddress ? SwapAction.Sell : SwapAction.Buy
}
