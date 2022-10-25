import React, {
  ComponentProps,
  PropsWithChildren,
  // eslint-disable-next-line no-restricted-imports
  Suspense as ReactSuspense,
  SuspenseProps,
} from 'react'
import { NetworkErrorBoundary } from 'src/components/data/NetworkErrorBoundary'

type Props = {
  errorFallback?: ComponentProps<typeof NetworkErrorBoundary>['errorFallback']
  fallback: SuspenseProps['fallback']
}

export function Suspense({ fallback, children, errorFallback }: PropsWithChildren<Props>) {
  return (
    <NetworkErrorBoundary errorFallback={errorFallback}>
      <ReactSuspense fallback={fallback}>{children}</ReactSuspense>
    </NetworkErrorBoundary>
  )
}
