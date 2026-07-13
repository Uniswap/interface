import { useCallback, useEffect, useRef } from 'react'
import { useInterval } from '~/lib/hooks/useInterval'
import { usePageVisibility } from '~/lib/hooks/usePageVisibility'

interface UseHeartbeatCoordinatorParams {
  refresh: () => Promise<unknown>
  intervalMs: number
  enabled: boolean
}

/**
 * Schedules `refresh` on a fixed interval, pausing when the page is hidden
 * and firing immediately on visibility restore. `refresh` is captured in a
 * ref each render so callers do not need to stabilize it — the interval never
 * restarts due to a changing callback.
 */
export function useHeartbeatCoordinator({ refresh, intervalMs, enabled }: UseHeartbeatCoordinatorParams): void {
  const isVisible = usePageVisibility()

  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  })

  const stableRefresh = useCallback(async () => {
    await refreshRef.current()
  }, [])

  const delay = enabled && isVisible ? intervalMs : null
  useInterval(stableRefresh, delay, false)

  const prevVisibleRef = useRef(isVisible)
  useEffect(() => {
    if (isVisible && !prevVisibleRef.current && enabled) {
      stableRefresh().catch(() => {})
    }
    prevVisibleRef.current = isVisible
  }, [isVisible, enabled, stableRefresh])
}
