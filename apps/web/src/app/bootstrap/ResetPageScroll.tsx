import { memo, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { getCurrentPageFromLocation } from '~/utils/urlRoutes'

export const ResetPageScrollEffect = memo(function ResetPageScrollEffect() {
  const location = useLocation()
  const { pathname } = location
  const currentPage = getCurrentPageFromLocation(pathname)
  const [hasChangedOnce, setHasChangedOnce] = useState(false)

  // For TDP pages, use the full pathname as the scroll key so navigating to a different
  // token resets scroll even though currentPage stays the same (e.g. via Related Tokens).
  // For all other pages, track currentPage to avoid resetting scroll on intra-page URL changes.
  const scrollKey = currentPage === InterfacePageName.TokenDetailsPage ? pathname : String(currentPage)

  useEffect(() => {
    if (!hasChangedOnce) {
      // avoid setting scroll to top on initial load
      setHasChangedOnce(true)
    } else {
      window.scrollTo(0, 0)
    }
    // we don't want this to re-run on change of hasChangedOnce! or else it defeats the point of the fix
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [scrollKey])

  return null
})
