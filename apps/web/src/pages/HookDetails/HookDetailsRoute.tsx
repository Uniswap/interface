import { FeatureFlags, useFeatureFlag, useStatsigClientStatus } from '@universe/gating'
import { SpinningLoader } from '@universe/mycelium'
import { Suspense } from 'react'
import { Navigate } from 'react-router'
import { createLazy } from '~/utils/lazyWithRetry'

const HookDetailsPage = createLazy(() => import('~/pages/HookDetails'))

// Not a route-level `enabled`: flags read false until Statsig loads, which sent cold direct URLs through `*` to /not-found.
export function HookDetailsRoute(): JSX.Element {
  const isHooksExploreEnabled = useFeatureFlag(FeatureFlags.HooksExplore)
  const { isStatsigReady } = useStatsigClientStatus()

  if (isHooksExploreEnabled) {
    return (
      <Suspense fallback={null}>
        <HookDetailsPage />
      </Suspense>
    )
  }
  if (!isStatsigReady) {
    return <SpinningLoader color="$accent1" />
  }
  return <Navigate to="/not-found" replace />
}
