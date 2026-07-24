import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useListRwaTokensQuery } from 'uniswap/src/data/rest/listRwaTokens'
import { mapRwaTokenList } from 'uniswap/src/data/rest/rwa/mapRwaToken'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'

export function useExploreRwaTokens({
  category,
  chainIds = [],
  enabled = true,
}: {
  category: RwaCategory
  chainIds?: number[]
  enabled?: boolean
}): { rows: Rwa[]; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useListRwaTokensQuery({
    category,
    chainIds,
    includeSparkline1d: true,
    enabled,
  })

  const rows = useMemo(() => mapRwaTokenList(data), [data])

  return {
    rows,
    isLoading,
    isError,
  }
}
