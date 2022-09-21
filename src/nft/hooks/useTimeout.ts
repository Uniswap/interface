import { useEffect, useState } from 'react'

const MINUTE = 1000 * 60
const HOUR = MINUTE * 60
const DAY = 24 * HOUR

const getReturnValues = (countDown: number): [number, number, number, number] => {
  // calculate time left
  const days = Math.floor(countDown / DAY)
  const hours = Math.floor((countDown % DAY) / HOUR)
  const minutes = Math.floor((countDown % HOUR) / MINUTE)
  const seconds = Math.floor((countDown % MINUTE) / 1000)

  return [days, hours, minutes, seconds]
}

export const useTimeout = (targetDate: Date) => {
  const countDownDate = new Date(targetDate).getTime()

  const [countDown, setCountDown] = useState<number>(countDownDate - new Date().getTime())

  useEffect(() => {
    const interval = setInterval(() => {
      setCountDown(countDownDate - new Date().getTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [countDownDate])

  return getReturnValues(countDown)
}
