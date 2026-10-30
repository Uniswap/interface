import type { PropsWithChildren } from 'react'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

// The shared boundary already reports the error; the section just disappears.
function AuctionSectionErrorFallback(): null {
  return null
}

/** Auction surfaces and launch info are optional context on the token page; one crashing must not take the page down. */
export function TokenDetailsAuctionErrorBoundary({
  children,
  fallback = AuctionSectionErrorFallback,
}: PropsWithChildren<{ fallback?: () => JSX.Element | null }>): JSX.Element {
  const tokenIdentity = useTDPStore((s) => `${s.currencyChainId}:${s.address}`)

  // Cached token navigation can keep this section mounted; a new token must not inherit its error.
  return (
    <ErrorBoundary key={tokenIdentity} fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}
