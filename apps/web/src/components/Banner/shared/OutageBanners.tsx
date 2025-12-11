import { getOutageBannerSessionStorageKey, OutageBanner } from 'components/Banner/Outage/OutageBanner'
import { useChainOutageConfig } from 'hooks/useChainOutageConfig'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { manualChainOutageAtom } from 'state/outage/atoms'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { getChainIdFromChainUrlParam, isChainUrlParam } from 'utils/chainParams'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

/**
 * OutageBanners component handles displaying outage banners in the bottom-right corner.
 *
 * Note: This component only handles OutageBanner. SolanaPromoBanner and BridgingPopularTokensBanner
 * have been migrated to the notification system (see createBannersNotificationDataSource).
 */
export function OutageBanners() {
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)

  // Read from both sources: error-detected (from GraphQL failures) and Statsig (manual config)
  const statsigOutage = useChainOutageConfig()
  const errorDetectedOutage = useAtomValue(manualChainOutageAtom)
  const outage = errorDetectedOutage || statsigOutage

  // Calculate the chainId for the current page's contextual chain (e.g. /tokens/ethereum or /tokens/arbitrum), if it exists.
  const pageChainId = useMemo(() => {
    const chainUrlParam = pathname.split('/').find(isChainUrlParam)
    return chainUrlParam ? getChainIdFromChainUrlParam(chainUrlParam) : UniverseChainId.Mainnet
  }, [pathname])
  const currentPageHasOutage = outage?.chainId === pageChainId

  const showOutageBanner = useMemo(() => {
    return (
      currentPage &&
      pageChainId &&
      currentPageHasOutage &&
      !sessionStorage.getItem(getOutageBannerSessionStorageKey(pageChainId)) &&
      (
        [
          InterfacePageName.ExplorePage,
          InterfacePageName.TokenDetailsPage,
          InterfacePageName.PoolDetailsPage,
          InterfacePageName.TokensPage,
        ] as string[]
      ).includes(currentPage)
    )
  }, [currentPage, currentPageHasOutage, pageChainId])

  if (pageChainId && showOutageBanner) {
    return <OutageBanner chainId={pageChainId} version={currentPageHasOutage ? outage?.version : undefined} />
  }

  return null
}
