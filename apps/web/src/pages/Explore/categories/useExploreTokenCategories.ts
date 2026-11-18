import { DynamicConfigs } from '@universe/gating'
import { useMemo } from 'react'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useCategoryOrder } from 'uniswap/src/features/tokenCategories/useCategoryOrder'
import { ExploreCategory } from '~/features/Explore/categories/useExploreCategory'
import { GROUPED_EXPLORE_CATEGORIES } from '~/pages/Explore/categories/exploreGroupedCategory'

const EMPTY_CATEGORIES: TokenCategory[] = []

/** Valid `?category=` values for the static chip set a failed fetch falls back to. */
const STATIC_CATEGORY_IDS: ReadonlySet<string> = new Set(GROUPED_EXPLORE_CATEGORIES)
const NO_CATEGORY_IDS: ReadonlySet<string> = new Set()

/**
 * The ordered category list backing the Explore chip row, plus the ids that are valid `?category=`
 * values (every fetched category — non-spotlit ones are reachable via deep link and the More dropdown;
 * All is the paramless default). `dynamicChipsEnabled` is false while ListCategories is
 * unresolved/empty, in which case the static chip set applies.
 */
export function useExploreTokenCategories(): {
  orderedCategories: TokenCategory[]
  validCategoryIds: ReadonlySet<string>
  dynamicChipsEnabled: boolean
  exploreCategoriesEnabled: boolean
  /** True while the first ListCategories attempt is in flight, so a `?category=` id can't be validated yet. */
  categoriesPending: boolean
  /**
   * True until the chip set is known, i.e. while the first ListCategories attempt is in flight. Render a
   * skeleton rather than the static set, which would pop to the fetched one.
   */
  categoriesLoading: boolean
} {
  const { isTestnetModeEnabled } = useEnabledChains()
  const { data: categories, isFetching, failureCount } = useListCategoriesQuery()
  // A backend category reusing the frontend default id would collide with the paramless default.
  const backendCategories = useMemo(
    () => categories?.filter((category) => category.id !== ExploreCategory.All) ?? EMPTY_CATEGORIES,
    [categories],
  )
  const orderedCategories = useCategoryOrder({
    categories: backendCategories,
    config: DynamicConfigs.TokenCategoriesOrder,
  })

  return useMemo(() => {
    const dynamicChipsEnabled = orderedCategories.length > 0
    // Only the first attempt counts: retries would otherwise hold an unverified deep link open for the whole backoff.
    const categoriesPending = categories === undefined && isFetching && failureCount === 0
    // Static ids stay valid even when dynamic — a response missing one (e.g. dropped by the
    // unmapped-class filter) must not degrade existing static deep links to All.
    const exploreCategoriesEnabled = !isTestnetModeEnabled
    const staticCategoryIds = exploreCategoriesEnabled ? STATIC_CATEGORY_IDS : NO_CATEGORY_IDS
    return {
      orderedCategories,
      validCategoryIds: dynamicChipsEnabled
        ? new Set([...staticCategoryIds, ...orderedCategories.map((category) => category.id)])
        : staticCategoryIds,
      dynamicChipsEnabled,
      exploreCategoriesEnabled,
      categoriesPending,
      categoriesLoading: categoriesPending,
    }
  }, [isTestnetModeEnabled, orderedCategories, categories, isFetching, failureCount])
}
