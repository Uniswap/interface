import ms from 'ms'

import { roundAndPluralize } from './roundAndPluralize'

const MINUTE = ms(`1m`)
const HOUR = ms(`1h`)
const DAY = ms(`1d`)

export const timeLeft = (targetDate: Date): string => {
  const countDown = new Date(targetDate).getTime() - new Date().getTime()
  const days = Math.floor(countDown / DAY)
  const hours = Math.floor((countDown % DAY) / HOUR)
  const minutes = Math.floor((countDown % HOUR) / MINUTE)

  return `${days !== 0 ? roundAndPluralize(days, 'day') : ''} ${
    hours !== 0 ? roundAndPluralize(hours, 'hour') : ''
  } ${roundAndPluralize(minutes, 'minute')}`
}
