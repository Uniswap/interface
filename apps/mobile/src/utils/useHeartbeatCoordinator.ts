import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useInterval } from 'utilities/src/time/timing'

interface UseHeartbeatCoordinatorParams {
  /** Full refresh, fired on the even tick and every `intervalMs` after. */
  refresh: () => Promise<unknown>
  /** Price-only refresh, fired at the midpoint between full refreshes (every `intervalMs / 2`). */
  priceRefresh: () => Promise<unknown>
  enabled: boolean
}

/**
 * Shared tick machinery for mobile's heartbeat coordinators (TDP, Home, PortfolioChartDetails):
 * alternates `refresh` (full, every 60s) and `priceRefresh` (price-only, every 30s) on a shared
 * 30-second tick — refresh, priceRefresh, refresh, priceRefresh, ... Pauses when the app is
 * backgrounded. On foreground return, fires `refresh` immediately and resets the phase so the
 * next scheduled tick is priceRefresh.
 *
 * Callers only need to supply what to fetch on each tick — this hook owns the AppState
 * subscription, the ref-mirroring that keeps the interval callback stable across renders, and
 * the tick alternation/foreground-return logic, so a fix to that machinery only needs to land
 * once instead of being kept in sync across every coordinator.
 */
export function useHeartbeatCoordinator({ refresh, priceRefresh, enabled }: UseHeartbeatCoordinatorParams): void {
  const [isActive, setIsActive] = useState(() => AppState.currentState === 'active')

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setIsActive(nextState === 'active')
    })
    return () => subscription.remove()
  }, [])

  // Keep latest callbacks in a ref so the interval callback never changes identity.
  // useInterval restarts its timer when callback changes; a stable ref avoids that churn.
  const latestRef = useRef({ refresh, priceRefresh })
  useEffect(() => {
    latestRef.current = { refresh, priceRefresh }
  })

  // Even tick counts fire the full refresh, odd tick counts fire the price-only refresh.
  const tickCountRef = useRef(0)
  const stableTick = useCallback(async () => {
    const isFullTick = tickCountRef.current % 2 === 0
    tickCountRef.current += 1
    await (isFullTick ? latestRef.current.refresh() : latestRef.current.priceRefresh())
  }, [])

  const delay = enabled && isActive ? PollingInterval.KindaFast : null

  // leading=false (no immediateStart): first tick deferred so initial page load can settle.
  useInterval(stableTick, delay)

  // Fire one immediate full refresh when app returns to foreground after being backgrounded.
  const prevActiveRef = useRef(isActive)
  useEffect(() => {
    if (isActive && !prevActiveRef.current && enabled) {
      // The next scheduled tick should be the price-only refresh, half an interval out.
      tickCountRef.current = 1
      latestRef.current.refresh().catch(() => {})
    }
    prevActiveRef.current = isActive
  }, [isActive, enabled])
}
