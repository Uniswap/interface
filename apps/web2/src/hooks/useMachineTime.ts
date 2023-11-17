import useInterval from 'lib/hooks/useInterval'
import { useCallback, useState } from 'react'

const useMachineTimeMs = (updateInterval: number): number => {
  const [now, setNow] = useState(Date.now())

  useInterval(
    useCallback(() => {
      setNow(Date.now())
    }, []),
    updateInterval
  )
  return now
}

export default useMachineTimeMs
