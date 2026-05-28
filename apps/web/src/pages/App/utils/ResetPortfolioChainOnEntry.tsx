import { memo, useLayoutEffect, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { PageType } from '~/hooks/useIsPage'
import { CHAIN_SEARCH_PARAM } from '~/utils/params/chainQueryParam'

/**
 * Resets Portfolio's `?chain=` filter when entering Portfolio from elsewhere (shared query key with TDP).
 *
 * Runs once at the app root with a single pathname ref so behavior stays correct; `usePortfolioRoutes` runs in
 * many components whose per-hook refs reset on remount.
 *
 * Skips when `previousPathname` is unknown (`null` on first paint) so direct loads and refresh keep `?chain=`.
 */
export const ResetPortfolioChainOnEntryEffect = memo(function ResetPortfolioChainOnEntryEffect() {
  const { pathname, search } = useLocation()
  const [, setSearchParams] = useSearchParams()
  const previousPathnameRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    const previousPathname = previousPathnameRef.current
    const enteredPortfolio = pathname.startsWith(PageType.PORTFOLIO)
    const cameFromNonPortfolio = previousPathname !== null && !previousPathname.startsWith(PageType.PORTFOLIO)

    if (enteredPortfolio && cameFromNonPortfolio && new URLSearchParams(search).has(CHAIN_SEARCH_PARAM)) {
      const next = new URLSearchParams(search)
      next.delete(CHAIN_SEARCH_PARAM)
      setSearchParams(next, { replace: true })
    }

    previousPathnameRef.current = pathname
  }, [pathname, search, setSearchParams])

  return null
})
