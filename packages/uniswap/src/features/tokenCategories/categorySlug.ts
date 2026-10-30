import type { CategoryBase } from 'uniswap/src/features/tokenCategories/types'

/**
 * Backend category ids are URL-safe slugs ('top-gainers', 'stable-pools') and are the canonical
 * deep-link form. Ids are unique across kinds, so the caller picks the list for the route's kind.
 */
export function findCategoryBySlug<T extends CategoryBase>({
  categories,
  slug,
}: {
  categories: T[] | undefined
  slug: string | undefined
}): T | undefined {
  if (!slug) {
    return undefined
  }
  const normalizedSlug = slug.toLowerCase()
  return categories?.find((category) => category.id.toLowerCase() === normalizedSlug)
}
