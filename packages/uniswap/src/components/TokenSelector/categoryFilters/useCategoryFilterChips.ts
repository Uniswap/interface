import { DynamicConfigs, useIsTokenCategoriesEnabled } from '@universe/gating'
import { useEffect, useMemo, useState } from 'react'
import type { TokenOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import {
  type CategoryFilterChip,
  deriveCategoryFilterChips,
  filterSectionsByChips,
  isFilteredEmpty,
  MY_TOKENS_CHIP_ID,
  resolveActiveChipIds,
} from 'uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import { useCategoryOrder } from 'uniswap/src/features/tokenCategories/useCategoryOrder'
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

/** Client-side, multi-select category chips over in-memory token rows: search results, or Send's balances list. */
export function useCategoryFilterChips({
  sections,
  isLoading,
  isBalancesOnlySearch,
}: {
  sections: OnchainItemSection<TokenOption>[] | undefined
  isLoading: boolean
  isBalancesOnlySearch: boolean
}): CategoryFilterChipsState {
  const enabled = useIsTokenCategoriesEnabled()
  const { categories, isLoading: isCategoriesLoading } = useAllTokenCategories()
  const orderedCategories = useCategoryOrder({ categories, config: DynamicConfigs.TokenCategoriesOrder })
  const [selectedIds, setSelectedIds] = useState<string[]>(NO_IDS)

  const chips = useMemo(() => {
    if (!enabled || !sections) {
      return NO_CHIPS
    }
    // Hidden (spam) balances would otherwise add a chip on expand that vanishes on collapse.
    const options = sections.flatMap((section) =>
      section.sectionKey === OnchainItemSectionName.HiddenTokens ? [] : section.data,
    )
    const derived = deriveCategoryFilterChips({ options, categories: orderedCategories })
    // Every balances-only row is already the user's token, so "My tokens" would filter nothing.
    return isBalancesOnlySearch ? derived.filter((chip) => chip.id !== MY_TOKENS_CHIP_ID) : derived
  }, [enabled, sections, orderedCategories, isBalancesOnlySearch])

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

  // Balances-only rows filter local portfolio data, which may carry no categories at all, so a placeholder could sit
  // over a chip row that never fills.
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
