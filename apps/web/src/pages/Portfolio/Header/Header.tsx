import { useNavigate } from 'react-router'
import { Flex, useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName, InterfacePageName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioAddressDisplay } from '~/pages/Portfolio/Header/PortfolioAddressDisplay/PortfolioAddressDisplay'
import { SharePortfolioButton } from '~/pages/Portfolio/Header/SharePortfolioButton'
import { PortfolioTabs } from '~/pages/Portfolio/Header/Tabs'
import { useShouldHeaderBeCompact } from '~/pages/Portfolio/Header/useShouldHeaderBeCompact'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'

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
  const { tab, chainId: currentChainId, externalAddress, isExternalWallet } = usePortfolioRoutes()
  const activeAddresses = useActiveAddresses()
  const showDemoView = useShowDemoView()
  const isCompact = useShouldHeaderBeCompact(scrollY)
  const headerHeight = useAppHeaderHeight()
  const buttonSize = media.md || isCompact ? 'small' : 'medium'

  const hasConnectedAddresses = Boolean(activeAddresses.evmAddress || activeAddresses.svmAddress)
  const showShareButton = !showDemoView && (isExternalWallet || hasConnectedAddresses)

  const onNetworkPress = useEvent((chainId: UniverseChainId | undefined) => {
    const currentPageName = getPageNameFromTab(tab)
    const selectedChain = chainId ?? ('All' as const)

    sendAnalyticsEvent(UniswapEventName.NetworkFilterSelected, {
      element: ElementName.PortfolioNetworkFilter,
      page: currentPageName,
      chain: selectedChain,
    })

    navigate(buildPortfolioUrl({ tab, chainId, externalAddress: externalAddress?.address }))
  })

  return (
    <Flex
      data-testid={TestID.PortfolioHeader}
      backgroundColor="$surface1"
      marginTop="$spacing8"
      paddingTop="$spacing16"
      zIndex="$header"
      $platform-web={{
        position: 'sticky',
        top: headerHeight,
      }}
      gap={isCompact ? '$gap12' : '$spacing40'}
      transition="gap 200ms ease"
    >
      <Flex gap="$spacing16">
        <Flex row gap="$spacing12" justifyContent="space-between" alignItems="center">
          <PortfolioAddressDisplay isCompact={isCompact} />

          <Flex row gap="$spacing8" alignItems="center">
            {showShareButton && (
              <SharePortfolioButton size={buttonSize} showLabel={!media.sm} transition={HEADER_TRANSITION} />
            )}
            <NetworkFilter
              showMultichainOption
              showDisplayName={!media.sm}
              position="right"
              onPress={onNetworkPress}
              currentChainId={currentChainId}
              size={buttonSize}
              transition={HEADER_TRANSITION}
            />
          </Flex>
        </Flex>
      </Flex>

      <PortfolioTabs />
    </Flex>
  )
}
