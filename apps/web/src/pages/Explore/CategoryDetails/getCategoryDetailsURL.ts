import type { CategoryKind } from 'uniswap/src/features/tokenCategories/types'

/** Backend category ids are the URL slugs the Category Details routes resolve. */
export function getCategoryDetailsURL(categoryId: string, kind: CategoryKind = 'token'): string {
  const slug = encodeURIComponent(categoryId)
  return kind === 'pool' ? `/pools/category/${slug}` : `/explore/category/${slug}`
}
