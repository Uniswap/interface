import { useEffect, useState } from 'react'
import { isEquityMarketOffHours } from 'uniswap/src/features/rwa/equityMarketHours'

const POLL_INTERVAL_MS = 60_000

// Re-evaluates each minute so the value flips when the off-hours window opens/closes while open.
export function useIsEquityOffHours(): boolean {
  const [isOffHours, setIsOffHours] = useState(() => isEquityMarketOffHours(new Date()))

  useEffect(() => {
    const update = (): void => setIsOffHours(isEquityMarketOffHours(new Date()))
    update()
    const interval = setInterval(update, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return isOffHours
}
