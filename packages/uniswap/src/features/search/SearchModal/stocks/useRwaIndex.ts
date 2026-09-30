import { useMemo } from 'react'
import { useListRwasQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRwas'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  buildRwaSearchIndex,
  type RwaSearchIndex,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

const EMPTY_INDEX: RwaSearchIndex = { rwas: [], byChainAddress: new Map() }

/** Builds the all-chains RWA grouping index from the `ListRwas` response. Search and the token selector
 *  always build it; RWA tags are not region-gated (only the Stocks shelf is).
 *  Requests `includeCommodities: true` so commodities are tagged — this gives the index its own `ListRwas`
 *  cache entry (it sends `true`; `useRWAWhitelist` / `useIsRWAToken` omit it, proto-default `false`). */
export function useRwaIndex(): RwaSearchIndex {
  const { chains: chainIds } = useEnabledChains({ includeTestnets: true })
  const { data } = useListRwasQuery({ chainIds, includeCommodities: true })
  return useMemo(() => (data?.rwas ? buildRwaSearchIndex(data.rwas) : EMPTY_INDEX), [data?.rwas])
}
