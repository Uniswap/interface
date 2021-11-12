import { useEffect, useState } from 'react'

const useMachineTimeMs = (updateInterval: number): number => {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, updateInterval)
    return () => {
      clearInterval(timer)
    }
  }, [updateInterval])
  return now
}

export default useMachineTimeMs
