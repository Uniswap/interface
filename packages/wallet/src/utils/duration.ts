import { getDurationRemaining } from 'utilities/src/time/duration'
import i18n from 'wallet/src/i18n/i18n'

export function getOtpDurationString(expirationTime: number): string {
  const timeLeft = expirationTime - Date.now()
  if (timeLeft <= 0) {
    return i18n.t('scantastic.code.expired')
  }

  const { seconds, minutes, hours } = getDurationRemaining(expirationTime)

  if (minutes) {
    if (hours) {
      return i18n.t('scantastic.code.timeRemaining.shorthand.hours', {
        seconds,
        minutes,
        hours,
      })
    }

    return i18n.t('scantastic.code.timeRemaining.shorthand.minutes', {
      seconds,
      minutes,
    })
  }
  return i18n.t('scantastic.code.timeRemaining.shorthand.seconds', {
    seconds,
  })
}
