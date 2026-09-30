import { useIsTokenCategoriesEnabledWithLoading } from '@universe/gating'
import { useEffect, useMemo, useState } from 'react'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useTokenCategoryOrder } from 'uniswap/src/features/tokenCategories/useTokenCategoryOrder'
import { GROUPED_EXPLORE_CATEGORIES } from '~/pages/Explore/categories/exploreGroupedCategory'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

const EMPTY_CATEGORIES: TokenCategory[] = []

/** Valid `?category=` values for the flag-off (and failed-fetch) static chip set. */
const STATIC_CATEGORY_IDS: ReadonlySet<string> = new Set(GROUPED_EXPLORE_CATEGORIES)

/**
 * The ordered category list backing the Explore chip row, plus the ids that are valid `?category=`
 * values (every fetched category — non-spotlit ones are reachable via deep link and the More dropdown;
 * All is the paramless default). `dynamicChipsEnabled` is false while the flag is off or
 * ListCategories is unresolved/empty, in which case the static chip set applies.
 */
export function useExploreTokenCategories(): {
  orderedCategories: TokenCategory[]
  validCategoryIds: ReadonlySet<string>
  dynamicChipsEnabled: boolean
  /** True while the first ListCategories attempt is in flight, so a `?category=` id can't be validated yet. */
  categoriesPending: boolean
  /**
   * True until the chip set is known: Statsig hasn't reported the flag for the first time yet, or the first
   * ListCategories attempt is in flight. Render a skeleton rather than the static set, which would pop to
   * the fetched one.
   */
  categoriesLoading: boolean
} {
  const { value: tokenCategoriesEnabled, isLoading: flagLoading } = useIsTokenCategoriesEnabledWithLoading()
  // Statsig re-enters Loading on every updateUserAsync (wallet connect/switch), which must not collapse a
  // rendered chip row back to the skeleton: only the first report counts as "flag unknown".
  const [flagSettled, setFlagSettled] = useState(!flagLoading)
  useEffect(() => {
    if (!flagLoading) {
      setFlagSettled(true)
    }
  }, [flagLoading])
  const { data: categories, isFetching, failureCount } = useListCategoriesQuery()
  // A backend category reusing the frontend default id would collide with the paramless default.
  const backendCategories = useMemo(
    () => categories?.filter((category) => category.id !== ExploreCategory.All) ?? EMPTY_CATEGORIES,
    [categories],
  )
  const orderedCategories = useTokenCategoryOrder(backendCategories)

  return useMemo(() => {
    const dynamicChipsEnabled = tokenCategoriesEnabled && orderedCategories.length > 0
    // Only the first attempt counts: retries would otherwise hold an unverified deep link open for the whole backoff.
    const categoriesPending = tokenCategoriesEnabled && categories === undefined && isFetching && failureCount === 0
    // Static ids stay valid even when dynamic — a response missing one (e.g. dropped by the
    // unmapped-class filter) must not degrade existing static deep links to All.
    return {
      orderedCategories,
      validCategoryIds: dynamicChipsEnabled
        ? new Set([...STATIC_CATEGORY_IDS, ...orderedCategories.map((category) => category.id)])
        : STATIC_CATEGORY_IDS,
      dynamicChipsEnabled,
      categoriesPending,
      categoriesLoading: (flagLoading && !flagSettled) || categoriesPending,
    }
  }, [tokenCategoriesEnabled, flagLoading, flagSettled, orderedCategories, categories, isFetching, failureCount])
}
