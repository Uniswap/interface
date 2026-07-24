import { useSearchParams } from 'react-router'
import { useEvent } from 'utilities/src/react/hooks'

export enum ExploreCategory {
  Popular = 'popular',
  Stocks = 'stocks',
  Commodities = 'commodities',
  Etfs = 'etfs',
}

/** Sticky Explore nav offset when scrolling to the token section. */
export const EXPLORE_STICKY_SCROLL_OFFSET_PX = 90

/** URL query param backing the Explore category tabs so the selection is shareable. */
const CATEGORY_PARAM = 'category'

const CATEGORY_PARAM_VALUES: ReadonlySet<ExploreCategory> = new Set([
  ExploreCategory.Stocks,
  ExploreCategory.Commodities,
  ExploreCategory.Etfs,
])

export function categoryFromParam(value: string | null): ExploreCategory {
  if (value === ExploreCategory.Stocks || value === ExploreCategory.Commodities || value === ExploreCategory.Etfs) {
    return value
  }
  return ExploreCategory.Popular
}

/** Explore Tokens tab with the default (Popular) category (all networks). */
export function getExploreTokensURL(): string {
  return '/explore/tokens'
}

/** Explore Tokens tab with the Stocks category chip selected (all networks). */
export function getExploreStocksTableURL(): string {
  return `${getExploreTokensURL()}?${CATEGORY_PARAM}=${ExploreCategory.Stocks}`
}

/** DOM id of the Explore token section (tab nav), used as the "View all" scroll target. */
export const EXPLORE_TOKEN_SECTION_ID = 'explore-token-section'

/** Reads/writes the Explore category from the `?category=` URL param. */
export function useExploreCategory(): [ExploreCategory, (category: ExploreCategory) => void] {
  const [params, setParams] = useSearchParams()
  const category = categoryFromParam(params.get(CATEGORY_PARAM))

  const setCategory = useEvent((next: ExploreCategory): void => {
    const updated = new URLSearchParams(params)
    if (CATEGORY_PARAM_VALUES.has(next)) {
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
