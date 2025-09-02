import { OutageBanner, getOutageBannerSessionStorageKey } from 'components/Banner/Outage/OutageBanner'
import { SOLANA_PROMO_BANNER_STORAGE_KEY, SolanaPromoBanner } from 'components/Banner/SolanaPromo/SolanaPromoBanner'
import { LPIncentiveAnnouncementBanner } from 'components/Liquidity/LPIncentives/LPIncentiveAnnouncementBanner'
import { manualChainOutageAtom } from 'featureFlags/flags/outageBanner'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { getChainIdFromChainUrlParam, isChainUrlParam } from 'utils/chainParams'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

export function Banners() {
  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const isSolanaPromoEnabled = useFeatureFlag(FeatureFlags.SolanaPromo)

  const manualOutage = useAtomValue(manualChainOutageAtom)

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
      (
        [
          InterfacePageName.ExplorePage,
          InterfacePageName.TokenDetailsPage,
          InterfacePageName.PoolDetailsPage,
          InterfacePageName.TokensPage,
        ] as string[]
      ).includes(currentPage)
    )
  }, [currentPage, currentPageHasManualOutage, pageChainId])

  // Outage Banners should take precedence over other promotional banners
  if (pageChainId && showOutageBanner) {
    return (
      <OutageBanner chainId={pageChainId} version={currentPageHasManualOutage ? manualOutage?.version : undefined} />
    )
  }

  const userAlreadySeenSolanaPromo = localStorage.getItem(SOLANA_PROMO_BANNER_STORAGE_KEY) === 'true'
  if (isSolanaPromoEnabled && !userAlreadySeenSolanaPromo) {
    return <SolanaPromoBanner />
  }

  if (isLPIncentivesEnabled) {
    return <LPIncentiveAnnouncementBanner />
  }

  return null
}
