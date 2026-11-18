import { useQuery } from '@tanstack/react-query'
import { PoolsOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import {
  RELATED_POOLS_MAX_COUNT,
  type RelatedPoolCardItem,
  type RelatedPoolsSubject,
  toRelatedPools,
} from 'uniswap/src/data/apiClients/dataApiService/relatedPools/relatedPoolMappers'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/**
 * Pools in `categoryId` for the PDP related-pools section, excluding the page's own pool: ListPools
 * with the `category_ids` filter, ranked by 1D volume. The subject drop and 16 cap are FE-side.
 */
export function useRelatedPoolsQuery({
  categoryId,
  subject,
  enabled = true,
}: {
  categoryId: string | undefined
  subject: RelatedPoolsSubject
  enabled?: boolean
}): { pools: RelatedPoolCardItem[]; isLoading: boolean; isError: boolean } {
  const { chains: chainIds } = useEnabledChains()

  const { data, isLoading, isError } = useQuery({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listPools', 'relatedPools', categoryId, chainIds],
    queryFn: () =>
      dataApiServiceClientV2.listPools({
        chainIds,
        // +1 so dropping the subject pool can still fill the cap.
        page: { pageSize: RELATED_POOLS_MAX_COUNT + 1 },
        sort: { orderBy: PoolsOrderBy.VOLUME_1D, ascending: false },
        filter: { categoryIds: categoryId ? [categoryId] : [] },
      }),
    enabled: enabled && categoryId !== undefined,
    staleTime: ONE_MINUTE_MS,
    retry: 2,
  })

  const pools = useMemo(() => toRelatedPools({ pools: data?.pools ?? [], subject }), [data?.pools, subject])

  return { pools, isLoading, isError }
}
