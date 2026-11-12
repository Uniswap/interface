import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { noop } from 'utilities/src/react/noop'
import { usePrefetchTokenDetailsAuction } from '~/features/Toucan/hooks/usePrefetchTokenDetailsAuction'
import { type LaunchItem, UNISWAP_CCA_LAUNCHPAD_ID } from '~/features/Toucan/utils/launchesModel'
import { getInitialTokenPriceHistoryQueryOptions, getTokenMultiChainQueryOptions } from '~/utils/tokenQueryOptions'

// Only the token detail page shares these query keys — live CCA quick launches route to
// /explore/auctions and load different data, so warming the token queries there is wasted.
const TDP_TOKEN_PATH_PREFIX = '/explore/tokens/'
const AUCTION_PATH_PREFIX = '/explore/auctions/'
// Short hover-intent delay so a pointer sweeping across rows doesn't fire a prefetch per row; only a
// deliberate hover warms the cache. Mirrors Explore's hover-card open intent, which is what makes
// Explore→TDP navigations feel instant while cold Launches→TDP navigations don't.
const HOVER_PREFETCH_DELAY_MS = 120

// Same paths as RouteDefinitions, so this warms the route's own chunk. Failures are ignored; the route retries itself.
export function preloadTokenDetailsChunk(): void {
  void import('~/pages/TokenDetails/TokenDetailsPage').catch(noop)
}

function preloadAuctionChunk(): void {
  void import('~/pages/Explore/ToucanToken').catch(noop)
}

/**
 * Prefetches what a cold navigation to the detail page waits on: the route chunk, the token
 * metadata query that gates the TDP skeleton, and the default price chart.
 *
 * scheduleHoverPrefetch waits for hover intent (hover, focus); prefetchNow fires at once (pointerdown).
 * Cancelling only clears the timer; in-flight requests stay in the query cache. V2 TDP only.
 */
export function usePrefetchLaunchTokenDetails(): {
  scheduleHoverPrefetch: (launch: LaunchItem) => void
  cancelHoverPrefetch: () => void
  prefetchNow: (launch: LaunchItem) => void
} {
  const queryClient = useQueryClient()
  const prefetchAuction = usePrefetchTokenDetailsAuction()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const prefetch = useCallback(
    (launch: LaunchItem) => {
      const { detailPath, logoChainId, tokenAddress } = launch
      if (!detailPath) {
        return
      }
      if (detailPath.startsWith(AUCTION_PATH_PREFIX)) {
        preloadAuctionChunk()
        return
      }
      if (logoChainId === undefined || !detailPath.startsWith(TDP_TOKEN_PATH_PREFIX)) {
        return
      }
      preloadTokenDetailsChunk()

      // Launch tokens are never native, so isNative is always false here.
      queryClient
        .prefetchQuery(getTokenMultiChainQueryOptions({ chainId: logoChainId, address: tokenAddress, isNative: false }))
        .catch(() => {})
      queryClient
        .prefetchQuery(getInitialTokenPriceHistoryQueryOptions({ chainId: logoChainId, address: tokenAddress }))
        .catch(() => {})
      if (launch.launchpadId === UNISWAP_CCA_LAUNCHPAD_ID) {
        prefetchAuction({ chainId: logoChainId, tokenAddress })
      }
    },
    [prefetchAuction, queryClient],
  )

  const cancelHoverPrefetch = useCallback(() => {
    clearTimeout(timeoutRef.current)
  }, [])

  const scheduleHoverPrefetch = useCallback(
    (launch: LaunchItem) => {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => prefetch(launch), HOVER_PREFETCH_DELAY_MS)
    },
    [prefetch],
  )

  const prefetchNow = useCallback(
    (launch: LaunchItem) => {
      clearTimeout(timeoutRef.current)
      prefetch(launch)
    },
    [prefetch],
  )

  // Cancel queued work when a flag change replaces the captured prefetch callback.
  useEffect(() => cancelHoverPrefetch, [cancelHoverPrefetch, prefetch])

  return { scheduleHoverPrefetch, cancelHoverPrefetch, prefetchNow }
}
