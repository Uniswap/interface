import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { findCategoryBySlug } from 'uniswap/src/features/tokenCategories/categorySlug'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/** Resolves a deep-linked category slug (e.g. 'top-gainers') via the cached ListCategories response. */
export function useTokenCategoryBySlug(slug: string | undefined): {
  category: TokenCategory | undefined
  isLoading: boolean
} {
  const { data: categories, isLoading } = useListCategoriesQuery()
  return { category: findCategoryBySlug({ categories, slug }), isLoading }
}
