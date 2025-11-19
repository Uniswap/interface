import useIsConnected from 'pages/Portfolio/Header/hooks/useIsConnected'
import { useEffect, useState } from 'react'

export function useShouldHeaderBeCompact(scrollY?: number): boolean {
  const isConnected = useIsConnected()
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    if (!isConnected || !scrollY) {
      setIsCompact(false)
      return
    }

    setIsCompact((prevIsCompact) => {
      if (!prevIsCompact && scrollY > 120) {
        return true
      }
      if (prevIsCompact && scrollY < 60) {
        return false
      }
      return prevIsCompact
    })
  }, [scrollY, isConnected])

  return isCompact
}
