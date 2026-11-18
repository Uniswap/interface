import { type PropsWithChildren, Suspense } from 'react'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { isPrivyConfigured } from '~/features/wallet/hooks/useMaybePrivy'
import { createLazyNoReload } from '~/utils/lazyWithRetry'

const loadPrivyRuntime = () => import('~/features/wallet/privy/PrivyRuntime')

// Prefetched at module load so the chunk downloads alongside app startup; a failed prefetch is retried by the lazy.
if (isPrivyConfigured()) {
  loadPrivyRuntime().catch(() => undefined)
}
const PrivyRuntime = isPrivyConfigured() ? createLazyNoReload(loadPrivyRuntime) : null

/**
 * Mounts the lazy Privy runtime beside the app, never around it, so the app renders without
 * waiting for the chunk. Consumers see `ready: false` until the runtime publishes.
 */
export function MaybePrivyProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <>
      {children}
      {PrivyRuntime && (
        // A runtime crash leaves the store on its inactive defaults instead of crashing the app.
        <ErrorBoundary fallback={() => null}>
          <Suspense fallback={null}>
            <PrivyRuntime />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  )
}
