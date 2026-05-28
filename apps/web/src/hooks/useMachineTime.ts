import { useCallback, useState } from 'react'
import { useInterval } from '~/lib/hooks/useInterval'

export const useMachineTimeMs = (updateInterval: number): number => {
  const [now, setNow] = useState(Date.now())

  useInterval(
    useCallback(() => {
      setNow(Date.now())
    }, []),
    updateInterval,
  )
  return now
}
