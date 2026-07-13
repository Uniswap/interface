import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { type RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { buildRwaTokenOption, useListRankedRwasQuery } from 'uniswap/src/data/rest/listRankedRwas'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const MAX_RWA_TOKENS = 10

export function useRwaTokenOptions({
  chainFilter,
  enabled = true,
}: {
  chainFilter?: UniverseChainId | null
  enabled?: boolean
} = {}): RwaTokenOption[] {
  const { data } = useListRankedRwasQuery({
    category: RwaCategory.STOCKS,
    chainIds: chainFilter ? [chainFilter] : [],
    // The token-selector tile only needs token identity (logo/symbol), not price history.
    includeSparkline1d: false,
    enabled,
  })
  return useMemo(
    () =>
      (data?.rwas ?? [])
        .map(buildRwaTokenOption)
        .filter((option): option is RwaTokenOption => option !== null)
        .slice(0, MAX_RWA_TOKENS),
    [data],
  )
}
