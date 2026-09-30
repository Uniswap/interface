import { useIsTokenCategoriesEnabled, useIsV2EndpointsSearchEnabled } from '@universe/gating'
import { useEffect, useMemo, useState } from 'react'
import type { TokenOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import {
  type CategoryFilterChip,
  deriveCategoryFilterChips,
  filterSectionsByChips,
  isFilteredEmpty,
  resolveActiveChipIds,
} from 'uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import { useTokenCategoryOrder } from 'uniswap/src/features/tokenCategories/useTokenCategoryOrder'
import { useEvent } from 'utilities/src/react/hooks'

const NO_CHIPS: CategoryFilterChip[] = []
const NO_IDS: string[] = []

export interface CategoryFilterChipsState {
  chips: CategoryFilterChip[]
  /** Placeholder row while results or the taxonomy load. */
  showSkeleton: boolean
  activeIds: string[]
  filteredSections: OnchainItemSection<TokenOption>[] | undefined
  isFilteredEmpty: boolean
  toggleChip: (id: string) => void
  clearFilters: () => void
}

/** Client-side, multi-select category chips over the in-memory search results. */
export function useCategoryFilterChips({
  sections,
  isLoading,
  isBalancesOnlySearch,
}: {
  sections: OnchainItemSection<TokenOption>[] | undefined
  isLoading: boolean
  isBalancesOnlySearch: boolean
}): CategoryFilterChipsState {
  const isTokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  // Only v2 search results carry categoryIds; on the v1 arm no chips can ever appear.
  const isSearchV2Enabled = useIsV2EndpointsSearchEnabled()
  const enabled = isTokenCategoriesEnabled && isSearchV2Enabled
  const { categories, isLoading: isCategoriesLoading } = useAllTokenCategories()
  const orderedCategories = useTokenCategoryOrder(categories)
  const [selectedIds, setSelectedIds] = useState<string[]>(NO_IDS)

  const chips = useMemo(() => {
    if (!enabled || !sections) {
      return NO_CHIPS
    }
    const options = sections.flatMap((section) => section.data)
    return deriveCategoryFilterChips({ options, categories: orderedCategories })
  }, [enabled, sections, orderedCategories])

  const activeIds = useMemo(() => resolveActiveChipIds({ selectedIds, chips }), [selectedIds, chips])
  // Prune state too so a departed chip comes back inactive; skip the empty loading frame every new query passes through.
  useEffect(() => {
    if (chips.length === 0) {
      return
    }
    setSelectedIds((previous) => {
      const pruned = resolveActiveChipIds({ selectedIds: previous, chips })
      return pruned.length === previous.length ? previous : pruned
    })
  }, [chips])

  const filteredSections = useMemo(
    () => (sections ? filterSectionsByChips({ sections, activeIds }) : sections),
    [sections, activeIds],
  )

  const toggleChip = useEvent((id: string) => {
    setSelectedIds((previous) => (previous.includes(id) ? previous.filter((other) => other !== id) : [...previous, id]))
  })

  const clearFilters = useEvent(() => setSelectedIds(NO_IDS))

  // Balances-only search runs against portfolio data, which carries no categories, so no chips can appear.
  const showSkeleton =
    enabled && !isBalancesOnlySearch && chips.length === 0 && ((isLoading && !sections?.length) || isCategoriesLoading)

  return {
    chips,
    showSkeleton,
    activeIds,
    filteredSections,
    isFilteredEmpty: isFilteredEmpty({ sections, filteredSections, activeIds }),
    toggleChip,
    clearFilters,
  }
}
