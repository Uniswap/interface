import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useListRwaTokensQuery } from 'uniswap/src/data/apiClients/dataApiService/rwa/listRwaTokens'
import { mapRwaTokenList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRwaToken'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'

/**
 * Flat Commodities rows from v1 ListRwaTokens, for the flag-off Explore table only. With token categories on,
 * Commodities is a BE-flat category and renders through the standard category-filtered token table instead.
 */
export function useExploreRwaTokens({
  category,
  chainIds = [],
  enabled = true,
}: {
  category: RwaCategory.COMMODITIES
  chainIds?: number[]
  enabled?: boolean
}): { rows: Rwa[]; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useListRwaTokensQuery({ category, chainIds, includeSparkline1d: true, enabled })
  const rows = useMemo(() => mapRwaTokenList(data), [data])
  return { rows, isLoading, isError }
}
