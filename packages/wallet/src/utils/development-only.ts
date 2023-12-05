import { useState } from 'react'
import { useInterval } from 'utilities/src/time/timing'

export const useLoadingTrigger = (ms = 2000): boolean => {
  const [isLoading, setIsLoading] = useState(false)
  const frequency = ms

  useInterval(() => setIsLoading((prev) => !prev), frequency)

  return isLoading
}
