import { type QueryClient, useQuery } from '@tanstack/react-query'
import type { GatedFeature } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
import { type ComplianceV2Client, fetchGatedFeatures } from '@universe/compliance/src/client'
import {
  getComplianceOverrideState,
  resolveGatedFeaturesOverride,
  useGatedFeaturesOverride,
} from '@universe/compliance/src/devComplianceOverride'
import { useComplianceClient } from '@universe/compliance/src/useComplianceClient'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const FIVE_MINUTES_MS = ONE_MINUTE_MS * 5

const GATED_FEATURES_QUERY_KEY = [ReactQueryCacheKey.Compliance, 'gatedFeatures'] as const

export function gatedFeaturesQueryOptions(
  client: ComplianceV2Client,
): QueryOptionsResult<GatedFeature[], Error, GatedFeature[], typeof GATED_FEATURES_QUERY_KEY> {
  // Persisted so a returning session has its region answer on first render; a stale restore refetches.
  return persistableQueryOptions({
    queryKey: GATED_FEATURES_QUERY_KEY,
    queryFn: () => fetchGatedFeatures(client),
    staleTime: FIVE_MINUTES_MS,
  })
}

/** Refetches gated features only when at least one mounted reader is active. */
export function refetchGatedFeatures(queryClient: QueryClient): Promise<void> {
  return queryClient.refetchQueries({ queryKey: GATED_FEATURES_QUERY_KEY, type: 'active' })
}

/**
 * Non-React counterpart of `useIsFeatureGated` for imperative callers (e.g. sagas). Answers from the
 * shared cache entry like the hook (a stale entry refetches in the background) and only waits on the
 * network for a cache miss. Fails open on error.
 */
export async function fetchIsFeatureGated(
  feature: GatedFeature,
  ctx: { queryClient: QueryClient; client: ComplianceV2Client },
): Promise<boolean> {
  const override = resolveGatedFeaturesOverride(getComplianceOverrideState())
  if (override !== undefined) {
    return override.includes(feature)
  }
  try {
    const features = await ctx.queryClient.ensureQueryData({
      ...gatedFeaturesQueryOptions(ctx.client),
      revalidateIfStale: true,
    })
    return features.includes(feature)
  } catch (error) {
    logger.warn('gatedFeaturesQuery', 'fetchIsFeatureGated', 'Gated features request failed; failing open', {
      error,
      feature,
    })
    return false
  }
}

/**
 * Returns the product features geo-blocked for the caller's region. The region
 * is resolved server-side, so the result is the same for every feature: one
 * no-arg query under a single cache key backs every reader. Empty while the
 * call is loading and for unauthenticated callers — treat empty as fail-open
 * (nothing gated), never as a verified-clean signal.
 *
 * `isPending`, not `isLoading`, is the "no answer yet" signal: `isLoading` is
 * `isPending && isFetching`, so an offline mount (`fetchStatus: 'paused'`) reports
 * `isLoading: false` while `features` is still empty.
 */
export function useGatedFeatures(): {
  features: GatedFeature[]
  isLoading: boolean
  isPending: boolean
} {
  const client = useComplianceClient()
  // Dev-only override (see devComplianceOverride); no-op in prod.
  const override = useGatedFeaturesOverride()
  const { data, isLoading, isPending } = useQuery({
    ...gatedFeaturesQueryOptions(client),
    enabled: override === undefined,
  })
  // An override is already an answer. The query underneath is disabled, so it would otherwise
  // report `isPending: true` forever.
  if (override !== undefined) {
    return { features: override, isLoading: false, isPending: false }
  }
  return {
    features: data ?? [],
    isLoading,
    isPending,
  }
}

/**
 * Whether a single product feature is geo-blocked for the caller's region. Reads
 * from the shared `useGatedFeatures` cache entry, so checking several features
 * costs one request.
 *
 * While the check is pending this returns `options.pendingValue`, default `false`
 * (fail open). Pass `{ pendingValue: true }` to keep a surface hidden until the
 * region is known instead of rendering it and pulling it away once the answer
 * lands. A rejected request still fails open either way.
 */
export function useIsFeatureGated(feature: GatedFeature, options?: { pendingValue?: boolean }): boolean {
  const { features, isPending } = useGatedFeatures()
  if (isPending) {
    return options?.pendingValue ?? false
  }
  return features.includes(feature)
}
