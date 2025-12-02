import NetworkFilter from 'components/NetworkFilter/NetworkFilter'
import { TOTAL_INTERFACE_NAV_HEIGHT } from 'pages/Portfolio/constants'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioAddressDisplay } from 'pages/Portfolio/Header/PortfolioAddressDisplay/PortfolioAddressDisplay'
import { PortfolioTabs } from 'pages/Portfolio/Header/Tabs'
import { useShouldHeaderBeCompact } from 'pages/Portfolio/Header/useShouldHeaderBeCompact'
import { PortfolioTab } from 'pages/Portfolio/types'
import { buildPortfolioUrl } from 'pages/Portfolio/utils/portfolioUrls'
import { useNavigate } from 'react-router'
import { Flex, useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName, InterfacePageName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'

const HEADER_TRANSITION = 'all 0.2s ease'

function getPageNameFromTab(tab: PortfolioTab | undefined): InterfacePageName {
  switch (tab) {
    case PortfolioTab.Overview:
      return InterfacePageName.PortfolioPage
    case PortfolioTab.Tokens:
      return InterfacePageName.PortfolioTokensPage
    case PortfolioTab.Defi:
      return InterfacePageName.PortfolioDefiPage
    case PortfolioTab.Nfts:
      return InterfacePageName.PortfolioNftsPage
    case PortfolioTab.Activity:
      return InterfacePageName.PortfolioActivityPage
    default:
      return InterfacePageName.PortfolioPage
  }
}

interface PortfolioHeaderProps {
  scrollY?: number
}

export function PortfolioHeader({ scrollY }: PortfolioHeaderProps) {
  const navigate = useNavigate()
  const media = useMedia()
  const { tab, chainId: currentChainId } = usePortfolioRoutes()
  const isCompact = useShouldHeaderBeCompact(scrollY)
  const onNetworkPress = useEvent((chainId: UniverseChainId | undefined) => {
    const currentPageName = getPageNameFromTab(tab)
    const selectedChain = chainId ?? ('All' as const)

    sendAnalyticsEvent(UniswapEventName.NetworkFilterSelected, {
      element: ElementName.PortfolioNetworkFilter,
      page: currentPageName,
      chain: selectedChain,
    })

    navigate(buildPortfolioUrl(tab, chainId))
  })

  return (
    <Flex
      backgroundColor="$surface1"
      marginTop="$spacing24"
      paddingTop="$spacing16"
      zIndex="$header"
      $platform-web={{
        position: 'sticky',
        top: TOTAL_INTERFACE_NAV_HEIGHT,
      }}
      gap={isCompact ? '$gap12' : '$spacing40'}
      transition="gap 200ms ease"
    >
      <Flex gap="$spacing16">
        <Flex row gap="$spacing12" justifyContent="space-between" alignItems="center">
          <PortfolioAddressDisplay isCompact={isCompact} />

          <NetworkFilter
            showMultichainOption
            showDisplayName={!media.sm}
            position="right"
            onPress={onNetworkPress}
            currentChainId={currentChainId}
            size={media.md || isCompact ? 'small' : 'medium'}
            transition={HEADER_TRANSITION}
          />
        </Flex>
      </Flex>

      <PortfolioTabs />
    </Flex>
  )
}
