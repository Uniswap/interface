import { useMemo } from 'react'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useTokenCategoryOrder } from 'uniswap/src/features/tokenCategories/useTokenCategoryOrder'

const EMPTY_CATEGORIES: TokenCategory[] = []

/**
 * Hydrates a token's category ids into TokenCategory objects (via the cached ListCategories response)
 * in canonical order: ListCategories order + Statsig pins, as everywhere else categories are listed.
 * Read `categoryIds` directly when the BE's per-token ranking matters (see selectTokenRowCategoryTag).
 * The lookup only counts as loading for a token that has ids to resolve.
 */
export function useResolveTokenCategories({
  categoryIds,
  isLoading: isTokenLoading = false,
}: {
  categoryIds: string[] | undefined
  isLoading?: boolean
}): { categories: TokenCategory[]; isLoading: boolean } {
  const { categories: knownCategories, isLoading: isCategoriesLoading } = useAllTokenCategories()

  const categories = useMemo(() => {
    const ids = new Set(categoryIds)
    const resolved = knownCategories.filter((category) => ids.has(category.id))
    return resolved.length > 0 ? resolved : EMPTY_CATEGORIES
  }, [categoryIds, knownCategories])
  const orderedCategories = useTokenCategoryOrder(categories)
  const hasCategoryIds = (categoryIds?.length ?? 0) > 0

  return { categories: orderedCategories, isLoading: isTokenLoading || (isCategoriesLoading && hasCategoryIds) }
}
