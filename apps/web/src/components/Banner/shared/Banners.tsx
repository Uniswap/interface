import { InterfacePageName } from '@uniswap/analytics-events'
import { MonadOutageBanner } from 'components/Banner/Outage/MonadOutageBanner'
import { OutageBanner, getOutageBannerSessionStorageKey } from 'components/Banner/Outage/OutageBanner'
import { manualChainOutageAtom } from 'featureFlags/flags/outageBanner'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { getChainIdFromChainUrlParam, isChainUrlParam } from 'utils/chainParams'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

export function Banners() {
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)

  const manualOutage = useAtomValue(manualChainOutageAtom)

  const isMonadDownFlag = useFeatureFlag(FeatureFlags.MonadTestnetDown)
  const { isTestnetModeEnabled } = useEnabledChains()

  // Calculate the chainId for the current page's contextual chain (e.g. /tokens/ethereum or /tokens/arbitrum), if it exists.
  const pageChainId = useMemo(() => {
    const chainUrlParam = pathname.split('/').find(isChainUrlParam)
    return chainUrlParam ? getChainIdFromChainUrlParam(chainUrlParam) : UniverseChainId.Mainnet
  }, [pathname])
  const currentPageHasManualOutage = manualOutage?.chainId === pageChainId

  const showOutageBanner = useMemo(() => {
    return (
      currentPage &&
      pageChainId &&
      currentPageHasManualOutage &&
      !sessionStorage.getItem(getOutageBannerSessionStorageKey(pageChainId)) &&
      [
        InterfacePageName.EXPLORE_PAGE,
        InterfacePageName.TOKEN_DETAILS_PAGE,
        InterfacePageName.POOL_DETAILS_PAGE,
        InterfacePageName.TOKENS_PAGE,
      ].includes(currentPage)
    )
  }, [currentPage, currentPageHasManualOutage, pageChainId])

  // Monad Outage Banner takes precedence if in testnet mode
  if (isMonadDownFlag && isTestnetModeEnabled) {
    return <MonadOutageBanner />
  }

  // Outage Banners should take precedence over other promotional banners
  if (pageChainId && showOutageBanner) {
    return (
      <OutageBanner chainId={pageChainId} version={currentPageHasManualOutage ? manualOutage?.version : undefined} />
    )
  }

  return null
}
