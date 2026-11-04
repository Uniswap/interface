import { useQuery } from '@tanstack/react-query'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { getCategoryCardTokensQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/categoryCardTokens'
import type { RankedTokenCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TRENDING_CATEGORY_ID } from 'uniswap/src/features/tokenCategories/findTrendingCategory'
import type { KnownTokenCategoryId } from 'uniswap/src/features/tokenCategories/knownTokenCategoryIds'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

export const EXPLORE_TOKENS_MODULE_DEFAULT_CATEGORY_ID = TRENDING_CATEGORY_ID

const MODULE_CATEGORY_IDS: readonly KnownTokenCategoryId[] = ['trending', 'stocks', 'top-gainers']

export function useExploreTokensModule(selectedCategoryId: string): {
  categories: TokenCategory[]
  activeCategoryId: string
  tokens: RankedTokenCardItem[]
  isLoading: boolean
} {
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const { data: allCategories } = useListCategoriesQuery()
  const { chains: chainIds } = useEnabledChains()

  // With categories off there are no chips, and Trending is fetched by its known id.
  const categories = tokenCategoriesEnabled
    ? MODULE_CATEGORY_IDS.flatMap((id) => allCategories?.find((category) => category.id === id) ?? [])
    : []

  const activeCategory = categories.find((category) => category.id === selectedCategoryId)
  const activeCategoryId = activeCategory?.id ?? EXPLORE_TOKENS_MODULE_DEFAULT_CATEGORY_ID

  const {
    data: tokens,
    isLoading,
    isPlaceholderData,
  } = useQuery(
    getCategoryCardTokensQueryOptions({
      categoryId: activeCategoryId,
      chainIds,
      // Trending keeps the carousel's volume sort so both share one cache entry.
      sort: activeCategoryId === EXPLORE_TOKENS_MODULE_DEFAULT_CATEGORY_ID ? undefined : activeCategory?.defaultSort,
    }),
  )

  return {
    categories,
    activeCategoryId,
    tokens: tokens ?? [],
    // keepPreviousData serves the prior category's tokens as a success; treat them as loading so a chip
    // switch shows the skeleton instead of the old tokens under the new chip.
    isLoading: isLoading || isPlaceholderData,
  }
}
