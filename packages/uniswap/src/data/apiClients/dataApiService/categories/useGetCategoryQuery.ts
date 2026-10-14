import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useCallback } from 'react'
import {
  localizeTokenCategory,
  rankedCategoryToTokenCategory,
  timeSeriesToChartPoints,
} from 'uniswap/src/data/apiClients/dataApiService/categories/categoryMappers'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useCurrentLanguage } from 'uniswap/src/features/language/hooks'
import type { TokenCategoryDetail } from 'uniswap/src/features/tokenCategories/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useGetCategoryQuery(categoryId: string | undefined): UseQueryResult<TokenCategoryDetail | null> {
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const { chains: chainIds } = useEnabledChains()
  const language = useCurrentLanguage()

  return useQuery({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getCategory', categoryId, chainIds],
    queryFn: async (): Promise<TokenCategoryDetail | null> => {
      const response = await dataApiServiceClientV2.getCategory({
        categoryId: categoryId ?? '',
        chainIds,
        includeCharts: true,
      })
      const category = response.category && rankedCategoryToTokenCategory(response.category)
      if (!category) {
        return null
      }
      return {
        category,
        volumeSeries: timeSeriesToChartPoints(response.volumeSeries),
        fdvSeries: timeSeriesToChartPoints(response.fdvSeries),
      }
    },
    select: useCallback(
      (detail: TokenCategoryDetail | null) =>
        detail && { ...detail, category: localizeTokenCategory(detail.category, language) },
      [language],
    ),
    enabled: tokenCategoriesEnabled && !!categoryId,
    staleTime: 5 * ONE_MINUTE_MS,
    gcTime: 30 * ONE_MINUTE_MS,
  })
}
