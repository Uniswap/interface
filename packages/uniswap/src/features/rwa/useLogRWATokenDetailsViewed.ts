import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Fires `RWA Token Details Viewed` once per RWA TDP view, after the match resolves.
 * No-op when `rwaMatch` is undefined (non-RWA token, or RWATdp flag off).
 *
 * `geogated` reads the synchronous RwaGeoblocked gate rather than a second listRwas query: an async
 * geoblock lookup could resolve after the fire and log a stale `geogated: false`.
 */
export function useLogRWATokenDetailsViewed({
  rwaMatch,
  tokenAddress,
  tokenSymbol,
  chainId,
}: {
  rwaMatch: RWAMatch | undefined
  tokenAddress?: string
  tokenSymbol?: string
  chainId?: UniverseChainId
}): void {
  const matchedAddress = rwaMatch?.token.address
  const isGeoblockEnabled = useFeatureFlag(FeatureFlags.RwaGeoblocked)

  // Stable callback so the effect keys on viewed-token identity, not on every input change.
  const logViewed = useEvent((): void => {
    if (!rwaMatch) {
      return
    }
    sendAnalyticsEvent(UniswapEventName.RWATokenDetailsViewed, {
      tokenAddress,
      tokenSymbol,
      chainId,
      stocks: rwaMatch.asset.category === RwaCategory.STOCKS,
      issuer: rwaMatch.token.issuer,
      geogated: isGeoblockEnabled,
    })
  })

  useEffect(() => {
    if (!matchedAddress) {
      return
    }
    logViewed()
  }, [matchedAddress, chainId, tokenAddress, logViewed])
}
