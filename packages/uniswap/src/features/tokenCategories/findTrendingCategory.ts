import type { KnownTokenCategoryId } from 'uniswap/src/features/tokenCategories/knownTokenCategoryIds'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

// Matched by id rather than name: `name` is localized, and the backend also translates "Trending".
const TRENDING_CATEGORY_ID: KnownTokenCategoryId = 'trending'

export function findTrendingCategory(categories: TokenCategory[] | undefined): TokenCategory | undefined {
  return categories?.find((category) => category.id === TRENDING_CATEGORY_ID)
}
