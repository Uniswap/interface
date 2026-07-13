import { useQuery } from '@tanstack/react-query'
import type { GatedFeature } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
import { fetchGatedFeatures } from '@universe/compliance/src/client'
import { useGatedFeaturesOverride } from '@universe/compliance/src/devComplianceOverride'
import { useComplianceClient } from '@universe/compliance/src/useComplianceClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const FIVE_MINUTES_MS = ONE_MINUTE_MS * 5

/**
 * Returns the product features geo-blocked for the caller's region. The region
 * is resolved server-side, so the result is the same for every feature: one
 * no-arg query under a single cache key backs every reader. Empty while the
 * call is loading and for unauthenticated callers — treat empty as fail-open
 * (nothing gated), never as a verified-clean signal.
 */
export function useGatedFeatures(): {
  features: GatedFeature[]
  isLoading: boolean
} {
  const client = useComplianceClient()
  // Dev-only override (see devComplianceOverride); no-op in prod.
  const override = useGatedFeaturesOverride()
  const { data, isLoading } = useQuery({
    queryKey: [ReactQueryCacheKey.Compliance, 'gatedFeatures'],
    queryFn: () => fetchGatedFeatures(client),
    staleTime: FIVE_MINUTES_MS,
    enabled: override === undefined,
  })
  if (override !== undefined) {
    return { features: override, isLoading: false }
  }
  return {
    features: data ?? [],
    isLoading,
  }
}

/**
 * Whether a single product feature is geo-blocked for the caller's region.
 * Fails open: `false` while loading and for unauthenticated callers. Reads from
 * the shared `useGatedFeatures` cache entry, so checking several features costs
 * one request.
 */
export function useIsFeatureGated(feature: GatedFeature): boolean {
  const { features } = useGatedFeatures()
  return features.includes(feature)
}
