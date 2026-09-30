import { useSearchParams } from 'react-router'
import { useEvent } from 'utilities/src/react/hooks'

export enum ExploreCategory {
  /** Frontend-owned paramless default (the unfiltered table); useExploreTokenCategories drops any backend category reusing this id. */
  All = 'all',
  Trending = 'trending',
  Stocks = 'stocks',
  Commodities = 'commodities',
  Etfs = 'etfs',
}

/** Sticky Explore nav offset when scrolling to the token section. */
export const EXPLORE_STICKY_SCROLL_OFFSET_PX = 90

/** URL query param backing the Explore category tabs so the selection is shareable. */
const CATEGORY_PARAM = 'category'

/** BE category ids are lowercase-kebab slugs; bounds what an unverified `?category=` may send to ListTokens. */
const CATEGORY_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/
const CATEGORY_SLUG_MAX_LENGTH = 64

function isWellFormedCategorySlug(value: string): boolean {
  return value.length <= CATEGORY_SLUG_MAX_LENGTH && CATEGORY_SLUG_PATTERN.test(value)
}

/**
 * Resolves the `?category=` value: valid ids pass through, anything else reads as All. With
 * `trustUnverifiedIds` (ListCategories still loading), a well-formed slug is trusted optimistically so
 * a deep link fetches its filtered table immediately instead of All first; it is re-validated,
 * and falls back to All, once the list resolves.
 */
export function categoryFromParam({
  value,
  validCategoryIds,
  trustUnverifiedIds = false,
}: {
  value: string | null
  validCategoryIds: ReadonlySet<string>
  trustUnverifiedIds?: boolean
}): string {
  if (value === null) {
    return ExploreCategory.All
  }
  if (validCategoryIds.has(value) || (trustUnverifiedIds && isWellFormedCategorySlug(value))) {
    return value
  }
  return ExploreCategory.All
}

/** Explore Tokens tab with the default (All) category (all networks). */
export function getExploreTokensURL(): string {
  return '/explore/tokens'
}

/** Explore Tokens tab with the Stocks category chip selected (all networks). */
export function getExploreStocksTableURL(): string {
  return `${getExploreTokensURL()}?${CATEGORY_PARAM}=${ExploreCategory.Stocks}`
}

/** Explore Tokens tab with the Trending category chip selected (all networks). */
export function getExploreTrendingTableURL(): string {
  return `${getExploreTokensURL()}?${CATEGORY_PARAM}=${ExploreCategory.Trending}`
}

/** DOM id of the Explore token section (tab nav), used as the "View all" scroll target. */
export const EXPLORE_TOKEN_SECTION_ID = 'explore-token-section'

/**
 * Reads/writes the Explore category from the `?category=` URL param.
 * `validCategoryIds` bounds the param values (chip ids minus All, which is the paramless default);
 * unknown params read as All without rewriting the URL, except that a well-formed slug is trusted
 * while `trustUnverifiedIds` is set (see categoryFromParam).
 */
export function useExploreCategory({
  validCategoryIds,
  trustUnverifiedIds,
}: {
  validCategoryIds: ReadonlySet<string>
  trustUnverifiedIds: boolean
}): [string, (category: string) => void] {
  const [params, setParams] = useSearchParams()
  const category = categoryFromParam({ value: params.get(CATEGORY_PARAM), validCategoryIds, trustUnverifiedIds })

  const setCategory = useEvent((next: string): void => {
    const updated = new URLSearchParams(params)
    if (validCategoryIds.has(next)) {
      updated.set(CATEGORY_PARAM, next)
    } else {
      updated.delete(CATEGORY_PARAM)
    }
    setParams(updated, { replace: true })
  })

  return [category, setCategory]
}

/** Smooth-scrolls to the Explore token section, accounting for the sticky nav offset. */
export function scrollToExploreTokenSection(): void {
  const el = document.getElementById(EXPLORE_TOKEN_SECTION_ID)
  if (!el) {
    return
  }
  const top = el.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top: top - EXPLORE_STICKY_SCROLL_OFFSET_PX, behavior: 'smooth' })
}
