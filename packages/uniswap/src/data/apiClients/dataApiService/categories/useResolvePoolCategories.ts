import { DynamicConfigs } from '@universe/gating'
import { useMemo } from 'react'
import { useAllPoolCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllPoolCategories'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { useCategoryOrder } from 'uniswap/src/features/tokenCategories/useCategoryOrder'

const EMPTY_CATEGORIES: PoolCategory[] = []

/**
 * Hydrates a pool's category ids into PoolCategory objects (via the cached ListCategories(kind: POOL)
 * response) in canonical order: ListCategories order + Statsig pins. Read `categoryIds` directly when
 * the BE's per-pool ranking matters (see selectRowCategoryTag). Only loading for a pool with ids to resolve.
 */
export function useResolvePoolCategories({
  categoryIds,
  isLoading: isPoolLoading = false,
}: {
  categoryIds: string[] | undefined
  isLoading?: boolean
}): { categories: PoolCategory[]; isLoading: boolean } {
  const { categories: knownCategories, isLoading: isCategoriesLoading } = useAllPoolCategories()

  const categories = useMemo(() => {
    const ids = new Set(categoryIds)
    const resolved = knownCategories.filter((category) => ids.has(category.id))
    return resolved.length > 0 ? resolved : EMPTY_CATEGORIES
  }, [categoryIds, knownCategories])
  const orderedCategories = useCategoryOrder({ categories, config: DynamicConfigs.PoolCategoriesOrder })
  const hasCategoryIds = (categoryIds?.length ?? 0) > 0

  return { categories: orderedCategories, isLoading: isPoolLoading || (isCategoriesLoading && hasCategoryIds) }
}
