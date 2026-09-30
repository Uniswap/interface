import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useListRankedRwasQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas'
import { mapRankedRwaList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import {
  buildRwaIssuerMetricsIndex,
  type RwaIssuerMetricsIndex,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaIssuerMetrics'

/** Issuer price / change / volume from the ranked list for one RWA category, for filling the metric-less
 *  `ListRwas` grouping index. For stocks, the params match the no-query Stocks shelf so it can reuse that cache. */
export function useRwaIssuerMetricsIndex({
  category,
  chainFilter,
  enabled,
}: {
  category: RwaCategory
  chainFilter: UniverseChainId | null
  enabled: boolean
}): RwaIssuerMetricsIndex | undefined {
  const { data } = useListRankedRwasQuery({
    category,
    chainIds: chainFilter != null ? [chainFilter] : [],
    includeSparkline1d: false,
    enabled,
  })
  return useMemo(
    () => (enabled && data ? buildRwaIssuerMetricsIndex(mapRankedRwaList({ response: data, category })) : undefined),
    [enabled, data, category],
  )
}
