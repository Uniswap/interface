import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { type RwaSearchIndex } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { useRwaIndex } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIndex'

/** Builds the all-chains RWA grouping index gated by RwaUxSearch. See `useRwaIndex` for cache/gating notes. */
export function useRwaSearchIndex(): RwaSearchIndex {
  return useRwaIndex(useFeatureFlag(FeatureFlags.RwaUxSearch))
}
