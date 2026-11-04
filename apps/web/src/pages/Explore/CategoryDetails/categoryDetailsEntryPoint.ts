import type { CategoryKind } from 'uniswap/src/features/tokenCategories/types'

export interface CategoryDetailsNavState {
  from: string
  fromLabel: string
}

/** The detail pages a category page can be entered from, per kind; the breadcrumb only links back inside these. */
const DETAILS_PATH_PREFIX: Record<CategoryKind, string> = {
  token: '/explore/tokens/',
  pool: '/explore/pools/',
}

// Reads window.location, not the router: the TDP chain switch rewrites the URL with replaceState, which the
// router never sees, so a router location snapshot would send the breadcrumb back to the pre-switch chain.
export function createCategoryDetailsNavState({
  label,
}: {
  /** Breadcrumb label for the page being left (ticker, pair); undefined while it is still unknown. */
  label: string | undefined
}): CategoryDetailsNavState | undefined {
  if (!label) {
    return undefined
  }
  const { pathname, search } = window.location
  return { from: `${pathname}${search}`, fromLabel: label }
}

function isDetailsPath(from: string, kind: CategoryKind): boolean {
  const prefix = DETAILS_PATH_PREFIX[kind]
  const pathname = from.split('?')[0]
  return pathname.startsWith(prefix) && pathname.length > prefix.length && !pathname.split('/').includes('..')
}

export function parseCategoryDetailsNavState(state: unknown, kind: CategoryKind): CategoryDetailsNavState | undefined {
  if (!state || typeof state !== 'object') {
    return undefined
  }
  const { from, fromLabel } = state as { from?: unknown; fromLabel?: unknown }
  if (
    typeof from !== 'string' ||
    typeof fromLabel !== 'string' ||
    fromLabel.length === 0 ||
    !isDetailsPath(from, kind)
  ) {
    return undefined
  }
  return { from, fromLabel }
}
