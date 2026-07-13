import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useListRankedRwasQuery } from 'uniswap/src/data/rest/listRankedRwas'
import { mapRankedRwaList } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'

export function useExploreRwaRows({
  category,
  chainIds = [],
  enabled = true,
}: {
  category: RwaCategory
  chainIds?: number[]
  enabled?: boolean
}): { rows: Rwa[]; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useListRankedRwasQuery({
    category,
    chainIds,
    includeSparkline1d: true,
    enabled,
  })

  const rows = useMemo(() => mapRankedRwaList({ response: data, category }), [data, category])

  return {
    rows,
    isLoading,
    isError,
  }
}
