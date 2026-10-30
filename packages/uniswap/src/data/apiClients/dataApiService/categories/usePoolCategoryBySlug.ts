import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import { findCategoryBySlug } from 'uniswap/src/features/tokenCategories/categorySlug'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'

/** Resolves a deep-linked pool category slug (e.g. 'stable-pools') via the cached ListCategories(kind: POOL) response. */
export function usePoolCategoryBySlug(slug: string | undefined): {
  category: PoolCategory | undefined
  isLoading: boolean
} {
  const { data: categories, isLoading } = useListPoolCategoriesQuery()
  return { category: findCategoryBySlug({ categories, slug }), isLoading }
}
