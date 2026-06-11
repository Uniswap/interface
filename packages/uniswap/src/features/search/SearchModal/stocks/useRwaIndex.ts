import { useMemo } from 'react'
import { useListRwasQuery } from 'uniswap/src/data/rest/listRwas'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  buildRwaSearchIndex,
  type RwaSearchIndex,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

const EMPTY_INDEX: RwaSearchIndex = { rwas: [], byChainAddress: new Map() }

/** Builds the all-chains RWA grouping index from the `ListRwas` response, gated by `enabled`.
 *  Shared by `useRwaSearchIndex` (RwaUxSearch) and the token selector (RwaUxTokenSelectorCategoryLabels).
 *  The `ListRwas` cache entry is shared with `useRWAWhitelist`, which fetches under a *different* flag
 *  (RWACoinGeckoData) — so the cache can be primed while this caller's flag is off. The `enabled` guard in the
 *  memo (not just on the query) keeps the returned index empty when the flag is off, so callers may gate on
 *  `rwas.length` / `byChainAddress.size` alone without leaking the feature. */
export function useRwaIndex(enabled: boolean): RwaSearchIndex {
  const { chains: chainIds } = useEnabledChains({ includeTestnets: true })
  const { data } = useListRwasQuery({ chainIds, enabled })
  return useMemo(() => (enabled && data?.rwas ? buildRwaSearchIndex(data.rwas) : EMPTY_INDEX), [enabled, data?.rwas])
}
