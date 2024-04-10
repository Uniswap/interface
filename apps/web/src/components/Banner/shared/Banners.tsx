import { InterfacePageName } from '@uniswap/analytics-events'
import { ChainId } from '@uniswap/sdk-core'
import { OutageBanner, getOutageBannerSessionStorageKey } from 'components/Banner/Outage/OutageBanner'
import { manualChainOutageAtom, useOutageBanners } from 'featureFlags/flags/outageBanner'
import { getValidUrlChainId } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

export function Banners() {
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)

  const outageBanners = useOutageBanners()
  const manualOutage = useAtomValue(manualChainOutageAtom)

  // Calculate the chainId for the current page's contextual chain (e.g. /tokens/ethereum or /tokens/arbitrum), if it exists.
  const pageChainId = useMemo(() => {
    const chainName = pathname.split('/').find((maybeChainName) => {
      const validatedChainId = getValidUrlChainId(maybeChainName)
      return validatedChainId !== undefined
    })
    return chainName ? getValidUrlChainId(chainName) : ChainId.MAINNET
  }, [pathname])
  const currentPageHasManualOutage = manualOutage?.chainId === pageChainId

  const showOutageBanner = useMemo(() => {
    return (
      currentPage &&
      pageChainId &&
      (outageBanners[pageChainId as ChainId] || currentPageHasManualOutage) &&
      !sessionStorage.getItem(getOutageBannerSessionStorageKey(pageChainId)) &&
      [
        InterfacePageName.EXPLORE_PAGE,
        InterfacePageName.TOKEN_DETAILS_PAGE,
        InterfacePageName.POOL_DETAILS_PAGE,
        InterfacePageName.TOKENS_PAGE,
      ].includes(currentPage)
    )
  }, [currentPage, currentPageHasManualOutage, outageBanners, pageChainId])

  // Outage Banners should take precedence over other promotional banners
  if (pageChainId && showOutageBanner) {
    return (
      <OutageBanner chainId={pageChainId} version={currentPageHasManualOutage ? manualOutage?.version : undefined} />
    )
  }

  return null
}
