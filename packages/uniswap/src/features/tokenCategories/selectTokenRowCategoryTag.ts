import { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/**
 * Picks the row tag from `categoryIds` (BE order is the BE's ranking, so the first one wins), skipping
 * any id `categories` can't resolve.
 */
export function selectTokenRowCategoryTag({
  categoryIds,
  categories,
}: {
  categoryIds: string[] | undefined
  categories: TokenCategory[]
}): TokenCategory | undefined {
  for (const id of categoryIds ?? []) {
    const category = categories.find((candidate) => candidate.id === id)
    if (category) {
      return category
    }
  }
  return undefined
}
