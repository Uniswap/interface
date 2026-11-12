import { type Hook, HookRoutingStatus, HookSourceVerification } from '~/features/Hooks/types'
import type { PoolsFilterTvlBucketId } from '~/types/poolsFilter'

export interface HookFilterState {
  tvlBucketId?: PoolsFilterTvlBucketId
  routedOnly: boolean
  verifiedSourceOnly: boolean
  metadataOnly: boolean
}

export type HookFilterCriteria = Omit<HookFilterState, 'tvlBucketId'>

export interface HookTvlRange {
  min?: number
  max?: number
}

export const EMPTY_HOOK_FILTER_STATE: HookFilterState = {
  tvlBucketId: undefined,
  routedOnly: false,
  verifiedSourceOnly: false,
  metadataOnly: false,
}

export function getActiveHookFilters(filters: HookFilterState): string[] {
  return [
    ...(filters.tvlBucketId ? [`tvl:${filters.tvlBucketId}`] : []),
    ...(filters.routedOnly ? ['routed'] : []),
    ...(filters.verifiedSourceOnly ? ['verified_source'] : []),
    ...(filters.metadataOnly ? ['metadata'] : []),
  ]
}

export function countActiveHookFilters(filters: HookFilterState): number {
  return getActiveHookFilters(filters).length
}

export function matchesHookFilters(hook: Hook, filters: HookFilterCriteria & { tvlRange?: HookTvlRange }): boolean {
  const { tvlRange } = filters
  if (tvlRange) {
    const tvl = hook.metrics.tvlUsd
    // TODO(CONS-3940): Preserve inclusive minimum and exclusive maximum TVL bounds in the live query.
    if (
      tvl === null ||
      !Number.isFinite(tvl) ||
      (tvlRange.min !== undefined && tvl < tvlRange.min) ||
      (tvlRange.max !== undefined && tvl >= tvlRange.max)
    ) {
      return false
    }
  }

  return (
    (!filters.routedOnly ||
      hook.deployments.some((deployment) => deployment.routingStatus === HookRoutingStatus.Supported)) &&
    (!filters.verifiedSourceOnly ||
      hook.deployments.every((deployment) => deployment.sourceVerification === HookSourceVerification.Verified)) &&
    (!filters.metadataOnly || hook.hasMetadata === true)
  )
}
