import { isBetaEnv, isDevEnv } from '@universe/environment'
import { lazy, Suspense } from 'react'

const AnalyticsDebugOverlay = lazy(() =>
  import('uniswap/src/features/telemetry/debug/AnalyticsDebugOverlay').then((m) => ({
    default: m.AnalyticsDebugOverlay,
  })),
)

export function AnalyticsDebugOverlayLazy(): JSX.Element | null {
  return isDevEnv() || isBetaEnv() ? (
    <Suspense fallback={null}>
      <AnalyticsDebugOverlay />
    </Suspense>
  ) : null
}
