import { useQuery } from '@tanstack/react-query'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import {
  CATEGORY_CARD_TOKEN_COUNT,
  getCategoryCardTokensQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/categoryCardTokens'
import type { RankedTokenCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { findTrendingCategory } from 'uniswap/src/features/tokenCategories/findTrendingCategory'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

export const TRENDING_CAROUSEL_TOKEN_COUNT = CATEGORY_CARD_TOKEN_COUNT

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
    getCategoryCardTokensQueryOptions({ categoryId: trendingCategoryId, chainIds }),
  )

  return { tokens: tokens ?? [], isLoading: categoriesPending || tokensLoading, trendingCategory }
}
