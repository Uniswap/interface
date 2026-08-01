import { useEffect } from 'react'
import { logEarnSurfaceViewed } from 'uniswap/src/features/earn/analytics'
import type { EarnAnalyticsEntryPoint, EarnAnalyticsSurface } from 'uniswap/src/features/telemetry/types'

export function useLogEarnSurfaceViewed({
  entryPoint,
  isVisible,
  surface,
}: {
  entryPoint: EarnAnalyticsEntryPoint
  isVisible: boolean
  surface: EarnAnalyticsSurface
}): void {
  useEffect(() => {
    if (!isVisible) {
      return
    }

    logEarnSurfaceViewed({ entry_point: entryPoint, surface })
  }, [entryPoint, isVisible, surface])
}
