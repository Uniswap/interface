import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useIsPoolCategoriesEnabled } from '@universe/gating'
import { useCallback } from 'react'
import {
  localizeCategory,
  rankedPoolCategoryToPoolCategory,
  timeSeriesToChartPoints,
} from 'uniswap/src/data/apiClients/dataApiService/categories/categoryMappers'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useCurrentLanguage } from 'uniswap/src/features/language/hooks'
import type { PoolCategoryDetail } from 'uniswap/src/features/tokenCategories/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useGetPoolCategoryQuery(categoryId: string | undefined): UseQueryResult<PoolCategoryDetail | null> {
  const poolCategoriesEnabled = useIsPoolCategoriesEnabled()
  const { chains: chainIds } = useEnabledChains()
  const language = useCurrentLanguage()

  return useQuery({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getCategory', 'pool', categoryId, chainIds],
    queryFn: async (): Promise<PoolCategoryDetail | null> => {
      const response = await dataApiServiceClientV2.getCategory({
        categoryId: categoryId ?? '',
        chainIds,
        includeCharts: true,
      })
      // A pool id is served on pool_category; a token id lands on category and is not this hook's.
      const category = response.poolCategory && rankedPoolCategoryToPoolCategory(response.poolCategory)
      if (!category) {
        return null
      }
      return {
        category,
        volumeSeries: timeSeriesToChartPoints(response.volumeSeries),
        tvlSeries: timeSeriesToChartPoints(response.tvlSeries),
        feesSeries: timeSeriesToChartPoints(response.feesSeries),
      }
    },
    select: useCallback(
      (detail: PoolCategoryDetail | null) =>
        detail && { ...detail, category: localizeCategory(detail.category, language) },
      [language],
    ),
    enabled: poolCategoriesEnabled && !!categoryId,
    staleTime: 5 * ONE_MINUTE_MS,
    gcTime: 30 * ONE_MINUTE_MS,
  })
}
