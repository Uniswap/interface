export interface CategoryDetailsNavState {
  from: string
  fromLabel: string
}

const TOKEN_DETAILS_PATH_PREFIX = '/explore/tokens/'

// Reads window.location, not the router: the TDP chain switch rewrites the URL with replaceState, which the
// router never sees, so a router location snapshot would send the breadcrumb back to the pre-switch chain.
export function createCategoryDetailsNavState({
  tokenSymbol,
}: {
  tokenSymbol: string | undefined
}): CategoryDetailsNavState | undefined {
  if (!tokenSymbol) {
    return undefined
  }
  const { pathname, search } = window.location
  return { from: `${pathname}${search}`, fromLabel: tokenSymbol }
}

function isTokenDetailsPath(from: string): boolean {
  const pathname = from.split('?')[0]
  return (
    pathname.startsWith(TOKEN_DETAILS_PATH_PREFIX) &&
    pathname.length > TOKEN_DETAILS_PATH_PREFIX.length &&
    !pathname.split('/').includes('..')
  )
}

export function parseCategoryDetailsNavState(state: unknown): CategoryDetailsNavState | undefined {
  if (!state || typeof state !== 'object') {
    return undefined
  }
  const { from, fromLabel } = state as { from?: unknown; fromLabel?: unknown }
  if (
    typeof from !== 'string' ||
    typeof fromLabel !== 'string' ||
    fromLabel.length === 0 ||
    !isTokenDetailsPath(from)
  ) {
    return undefined
  }
  return { from, fromLabel }
}
