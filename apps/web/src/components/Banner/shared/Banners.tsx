import { InterfacePageName } from '@uniswap/analytics-events'
import { ChainId } from '@uniswap/sdk-core'
import WalletAppPromoBanner from 'components/Banner/MobileAppAnnouncementBanner'
import { OutageBanner, getOutageBannerSessionStorageKey } from 'components/Banner/Outage/OutageBanner'
import { useOutageBanners } from 'featureFlags/flags/outageBanner'
import { useUniTagsEnabled } from 'featureFlags/flags/uniTags'
import { getValidUrlChainId } from 'graphql/data/util'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'
import { SwapSmarterBanner } from '../SwapSmarterBanner/SwapSmarterBanner'
import { useSwapSmarterBanner } from '../SwapSmarterBanner/useSwapSmarterBanner'
import { LargeUniTagBanner } from '../UniTag/LargeUniTagBanner'

export function Banners() {
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const isUniTagsEnabled = useUniTagsEnabled()
  const { shouldShowBanner: shouldShowSwapSmarterBanner } = useSwapSmarterBanner()

  const outageBanners = useOutageBanners()

  // Calculate the chainId for the current page's contextual chain (e.g. /tokens/ethereum or /tokens/arbitrum), if it exists.
  const pageChainId = useMemo(() => {
    const chainName = pathname.split('/').find((maybeChainName) => {
      const validatedChainId = getValidUrlChainId(maybeChainName)
      return validatedChainId !== undefined
    })
    return chainName ? getValidUrlChainId(chainName) : undefined
  }, [pathname])

  const showOutageBanner = useMemo(() => {
    return (
      currentPage &&
      pageChainId &&
      outageBanners[pageChainId as ChainId] &&
      !sessionStorage.getItem(getOutageBannerSessionStorageKey(pageChainId)) &&
      [
        InterfacePageName.EXPLORE_PAGE,
        InterfacePageName.TOKEN_DETAILS_PAGE,
        InterfacePageName.POOL_DETAILS_PAGE,
        InterfacePageName.TOKENS_PAGE,
      ].includes(currentPage)
    )
  }, [currentPage, outageBanners, pageChainId])

  // Outage Banners should take precedence over the Wallet Download Banner
  if (pageChainId && showOutageBanner) {
    return <OutageBanner chainId={pageChainId} />
  }

  if (shouldShowSwapSmarterBanner) {
    return <SwapSmarterBanner />
  }

  if (isUniTagsEnabled) {
    return <LargeUniTagBanner />
  }

  return <WalletAppPromoBanner />
}
