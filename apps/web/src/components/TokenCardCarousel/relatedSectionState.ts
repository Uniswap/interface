import type { CategoryBase } from 'uniswap/src/features/tokenCategories/types'

export interface RelatedSectionState<C extends CategoryBase> {
  selectedCategory: C
  showChips: boolean
  isListEmpty: boolean
  title: string
}

/** Falls back to the first category whenever the pick is stale (subject changed, categories reordered). */
export function selectRelatedCategory<C extends CategoryBase>({
  categories,
  pickedCategoryId,
}: {
  categories: C[]
  pickedCategoryId: string | undefined
}): C | undefined {
  return categories.find((category) => category.id === pickedCategoryId) ?? categories.at(0)
}

/**
 * Keeps a chipped related section mounted on an empty or failed category so the user can switch
 * away, and hides a chipless section with nothing to show.
 */
export function deriveRelatedSectionState<C extends CategoryBase>({
  categories,
  pickedCategoryId,
  isLoading,
  isError,
  itemCount,
  headerTitle,
  singleTitle,
}: {
  categories: C[]
  pickedCategoryId: string | undefined
  isLoading: boolean
  isError: boolean
  itemCount: number
  /** Title when several categories share the section (chips shown). */
  headerTitle: string
  /** Title for a one-category section, e.g. "More stock tokens". */
  singleTitle: (category: C) => string
}): RelatedSectionState<C> | undefined {
  const selectedCategory = selectRelatedCategory({ categories, pickedCategoryId })
  if (!selectedCategory) {
    return undefined
  }

  const showChips = categories.length > 1
  const isListEmpty = !isLoading && (isError || itemCount === 0)
  if (isListEmpty && !showChips) {
    return undefined
  }

  const title = showChips ? headerTitle : singleTitle(selectedCategory)
  return { selectedCategory, showChips, isListEmpty, title }
}
