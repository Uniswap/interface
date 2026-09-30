import type { TokenOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/** Chip id for the balance filter; not a backend category id (those are taxonomy slugs). */
export const MY_TOKENS_CHIP_ID = 'my-tokens'

export type CategoryFilterChip =
  | { id: typeof MY_TOKENS_CHIP_ID; category?: undefined }
  | { id: string; category: TokenCategory }

export function hasTokenBalance(option: TokenOption): boolean {
  return Boolean(option.quantity && option.quantity !== 0)
}

/** One chip per category present in `options` (in `categories` order), plus "My tokens" when any result has a balance. */
export function deriveCategoryFilterChips({
  options,
  categories,
}: {
  options: TokenOption[]
  categories: TokenCategory[]
}): CategoryFilterChip[] {
  const presentIds = new Set<string>()
  let anyBalance = false
  for (const option of options) {
    anyBalance ||= hasTokenBalance(option)
    for (const id of option.currencyInfo.categoryIds ?? []) {
      presentIds.add(id)
    }
  }

  const categoryChips: CategoryFilterChip[] = categories
    .filter((category) => presentIds.has(category.id))
    .map((category) => ({ id: category.id, category }))

  if (categoryChips.length === 0) {
    return []
  }
  return anyBalance ? [{ id: MY_TOKENS_CHIP_ID }, ...categoryChips] : categoryChips
}

/** Drops selections whose chip left the current set, so a stale pick can't filter to nothing. */
export function resolveActiveChipIds({
  selectedIds,
  chips,
}: {
  selectedIds: string[]
  chips: CategoryFilterChip[]
}): string[] {
  const available = new Set(chips.map((chip) => chip.id))
  return selectedIds.filter((id) => available.has(id))
}

/** "My tokens" ANDs with the category chips; category chips OR together (Figma "Multiple" frame). */
export function filterTokenOptionsByChips({
  options,
  activeIds,
}: {
  options: TokenOption[]
  activeIds: string[]
}): TokenOption[] {
  if (activeIds.length === 0) {
    return options
  }
  const requireBalance = activeIds.includes(MY_TOKENS_CHIP_ID)
  const activeCategoryIds = activeIds.filter((id) => id !== MY_TOKENS_CHIP_ID)

  return options.filter((option) => {
    if (requireBalance && !hasTokenBalance(option)) {
      return false
    }
    if (activeCategoryIds.length === 0) {
      return true
    }
    return option.currencyInfo.categoryIds?.some((id) => activeCategoryIds.includes(id)) ?? false
  })
}

/** Same reference when nothing is active. */
export function filterSectionsByChips<T extends OnchainItemSection<TokenOption>>({
  sections,
  activeIds,
}: {
  sections: T[]
  activeIds: string[]
}): T[] {
  if (activeIds.length === 0) {
    return sections
  }
  return sections.flatMap((section) => {
    const data = filterTokenOptionsByChips({ options: section.data, activeIds })
    return data.length > 0 ? [{ ...section, data }] : []
  })
}

/** Results exist but the active chips removed every row, as opposed to a query with no results. */
export function isFilteredEmpty({
  sections,
  filteredSections,
  activeIds,
}: {
  sections: OnchainItemSection<TokenOption>[] | undefined
  filteredSections: OnchainItemSection<TokenOption>[] | undefined
  activeIds: string[]
}): boolean {
  if (activeIds.length === 0) {
    return false
  }
  const hasRows = sections?.some((section) => section.data.length > 0) ?? false
  const hasFilteredRows = filteredSections?.some((section) => section.data.length > 0) ?? false
  return hasRows && !hasFilteredRows
}
