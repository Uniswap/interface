import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'

const EMPTY_CATEGORIES: PoolCategory[] = []

/** Every known pool category from the cached ListCategories(kind: POOL) response, in its (BE canonical) order. */
export function useAllPoolCategories(): { categories: PoolCategory[]; isLoading: boolean } {
  const { data, isLoading } = useListPoolCategoriesQuery()
  return { categories: data ?? EMPTY_CATEGORIES, isLoading }
}
