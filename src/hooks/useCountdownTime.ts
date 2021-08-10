import { useEffect, useState } from 'react'

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

export default function useCountdownTime(startTime: Date, endTime: Date, includeSeconds = false): string {
  // get end/beginning times
  const begin = Math.floor(startTime.getTime() / 1000)
  const end = Math.floor(endTime.getTime() / 1000)

  // get current time
  const [time, setTime] = useState(() => Math.floor(Date.now() / 1000))
  useEffect((): (() => void) | void => {
    // we only need to tick if rewards haven't ended yet
    if (time <= end) {
      const timeout = setTimeout(() => setTime(Math.floor(Date.now() / 1000)), 1000)
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [time, end])

  const timeUntilGenesis = begin - time
  const timeUntilEnd = end - time

  let timeRemaining: number
  if (timeUntilGenesis >= 0) {
    timeRemaining = timeUntilGenesis
  } else {
    const ongoing = timeUntilEnd >= 0
    if (ongoing) {
      timeRemaining = timeUntilEnd
    } else {
      timeRemaining = Infinity
    }
  }

  const days = (timeRemaining - (timeRemaining % DAY)) / DAY
  timeRemaining -= days * DAY
  const hours = (timeRemaining - (timeRemaining % HOUR)) / HOUR
  timeRemaining -= hours * HOUR
  const minutes = (timeRemaining - (timeRemaining % MINUTE)) / MINUTE
  timeRemaining -= minutes * MINUTE
  const seconds = timeRemaining

  return `Starts in ${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${
    includeSeconds ? seconds.toString().padStart(2, '0') : ''
  }`
}
