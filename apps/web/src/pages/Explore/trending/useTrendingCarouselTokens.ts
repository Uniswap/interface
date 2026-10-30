import { useQuery } from '@tanstack/react-query'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { getListTokensQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import {
  rankedTokenToCardItem,
  type RankedTokenCardItem,
} from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { findTrendingCategory } from 'uniswap/src/features/tokenCategories/findTrendingCategory'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

export const TRENDING_CAROUSEL_TOKEN_COUNT = 12

export function useTrendingCarouselTokens(): {
  tokens: RankedTokenCardItem[]
  isLoading: boolean
  trendingCategory: TokenCategory | undefined
} {
  const { data: categories, isPending: categoriesPending } = useListCategoriesQuery()
  const trendingCategory = findTrendingCategory(categories)
  const trendingCategoryId = trendingCategory?.id
  const { chains: chainIds } = useEnabledChains()

  const { data: tokens, isLoading: tokensLoading } = useQuery(
    getListTokensQueryOptions({
      // Disable the query when there's no category id
      params:
        trendingCategoryId === undefined
          ? undefined
          : {
              chainIds,
              page: { pageSize: TRENDING_CAROUSEL_TOKEN_COUNT },
              sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
              sparklineDuration: HistoryDuration.DAY,
              filter: { categoryIds: [trendingCategoryId] },
            },
      select: (data) => (data?.multichainTokens ?? []).flatMap((token) => rankedTokenToCardItem(token) ?? []),
    }),
  )

  return { tokens: tokens ?? [], isLoading: categoriesPending || tokensLoading, trendingCategory }
}
