import { isNonRwaAssetCategory } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

/**
 * Display order of the class buckets on the mobile Collections page and web All dropdown.
 * Keyed on the full enum so adding a TokenCategoryClass member is a build error here rather
 * than a silently missing bucket.
 */
export const TOKEN_CATEGORY_CLASS_ORDER: Record<TokenCategoryClass, number> = {
  [TokenCategoryClass.Market]: 0,
  [TokenCategoryClass.Asset]: 1,
  [TokenCategoryClass.Sector]: 2,
}

export interface TokenCategoryBucket {
  categoryClass: TokenCategoryClass
  categories: TokenCategory[]
}

/**
 * Buckets categories by class in display order, preserving the given order within each bucket
 * (pass the useTokenCategoryOrder output), except that non-RWA assets lead the Asset bucket. The
 * same ordered list drives the Explore chip row, so this can't be expressed in the Statsig order
 * without changing which categories get chips. Empty buckets are omitted.
 */
export function bucketTokenCategories(categories: TokenCategory[]): TokenCategoryBucket[] {
  const buckets = new Map<TokenCategoryClass, TokenCategory[]>()
  for (const category of categories) {
    const bucket = buckets.get(category.categoryClass)
    if (bucket) {
      bucket.push(category)
    } else {
      buckets.set(category.categoryClass, [category])
    }
  }
  return [...buckets.entries()]
    .sort(([classA], [classB]) => TOKEN_CATEGORY_CLASS_ORDER[classA] - TOKEN_CATEGORY_CLASS_ORDER[classB])
    .map(([categoryClass, bucketCategories]) => ({
      categoryClass,
      categories: categoryClass === TokenCategoryClass.Asset ? nonRwaAssetsFirst(bucketCategories) : bucketCategories,
    }))
}

function nonRwaAssetsFirst(categories: TokenCategory[]): TokenCategory[] {
  return [
    ...categories.filter(isNonRwaAssetCategory),
    ...categories.filter((category) => !isNonRwaAssetCategory(category)),
  ]
}
