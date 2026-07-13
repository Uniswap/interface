import { useMemo } from 'react'
import { useListRwasQuery } from 'uniswap/src/data/rest/listRwas'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  buildRwaSearchIndex,
  type RwaSearchIndex,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

const EMPTY_INDEX: RwaSearchIndex = { rwas: [], byChainAddress: new Map() }

/** Builds the all-chains RWA grouping index from the `ListRwas` response, gated by `enabled`.
 *  Shared by `useRwaSearchIndex` (RwaUxSearch) and the token selector (region-gated via ISSUER_SPECIFIC_RWA).
 *  Requests `includeCommodities: true` so commodities are tagged — this gives the index its own `ListRwas`
 *  cache entry (it sends `true`; `useRWAWhitelist` / `useIsRWAToken` omit it, proto-default `false`).
 *  The `enabled` guard in the memo (not just the query) keeps the index empty when the flag is off, so callers
 *  may gate on `rwas.length` / `byChainAddress.size` alone without leaking the feature. */
export function useRwaIndex(enabled: boolean): RwaSearchIndex {
  const { chains: chainIds } = useEnabledChains({ includeTestnets: true })
  const { data } = useListRwasQuery({ chainIds, includeCommodities: true, enabled })
  return useMemo(() => (enabled && data?.rwas ? buildRwaSearchIndex(data.rwas) : EMPTY_INDEX), [enabled, data?.rwas])
}
