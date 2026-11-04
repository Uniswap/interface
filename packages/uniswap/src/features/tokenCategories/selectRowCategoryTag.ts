import type { CategoryBase } from 'uniswap/src/features/tokenCategories/types'

/**
 * Picks the row tag from `categoryIds` (BE order is the BE's ranking, so the first one wins), skipping
 * any id `categories` can't resolve. `skipCategoryId` is the category the surface is already scoped to
 * (a category page, a selected Explore chip): every row would repeat it, so the next tag shows instead.
 */
export function selectRowCategoryTag<C extends CategoryBase>({
  categoryIds,
  categories,
  skipCategoryId,
}: {
  categoryIds: string[] | undefined
  categories: C[]
  skipCategoryId?: string
}): C | undefined {
  for (const id of categoryIds ?? []) {
    if (id === skipCategoryId) {
      continue
    }
    const category = categories.find((candidate) => candidate.id === id)
    if (category) {
      return category
    }
  }
  return undefined
}
