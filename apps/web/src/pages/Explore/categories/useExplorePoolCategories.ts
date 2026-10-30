import { DynamicConfigs, useIsPoolCategoriesEnabled } from '@universe/gating'
import { useMemo } from 'react'
import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { useCategoryOrder } from 'uniswap/src/features/tokenCategories/useCategoryOrder'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

const EMPTY_CATEGORIES: PoolCategory[] = []
const EMPTY_IDS: ReadonlySet<string> = new Set()

/**
 * The ordered pool category list backing the Explore Pools chip row, plus the ids that are valid
 * `?category=` values. Unlike tokens there is no static chip set: with the flag off, or before
 * ListCategories resolves, the Pools tab renders exactly as it did without categories.
 */
export function useExplorePoolCategories(): {
  orderedCategories: PoolCategory[]
  validCategoryIds: ReadonlySet<string>
  chipsEnabled: boolean
  /** True while the first ListCategories attempt is in flight, so a `?category=` id can't be validated yet. */
  categoriesPending: boolean
  /** True while the flag is on and the chip set is still unknown; render a skeleton. */
  categoriesLoading: boolean
} {
  const poolCategoriesEnabled = useIsPoolCategoriesEnabled()
  const { data: categories, isFetching, failureCount } = useListPoolCategoriesQuery()
  // A backend category reusing the frontend default id would collide with the paramless default.
  const backendCategories = useMemo(
    () => categories?.filter((category) => category.id !== ExploreCategory.All) ?? EMPTY_CATEGORIES,
    [categories],
  )
  const orderedCategories = useCategoryOrder({
    categories: backendCategories,
    config: DynamicConfigs.PoolCategoriesOrder,
  })

  return useMemo(() => {
    const chipsEnabled = poolCategoriesEnabled && orderedCategories.length > 0
    // Only the first attempt counts: retries would otherwise hold an unverified deep link open for the whole backoff.
    const categoriesPending = poolCategoriesEnabled && categories === undefined && isFetching && failureCount === 0
    return {
      orderedCategories,
      validCategoryIds: chipsEnabled ? new Set(orderedCategories.map((category) => category.id)) : EMPTY_IDS,
      chipsEnabled,
      categoriesPending,
      categoriesLoading: categoriesPending,
    }
  }, [poolCategoriesEnabled, orderedCategories, categories, isFetching, failureCount])
}
