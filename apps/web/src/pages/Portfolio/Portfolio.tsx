import { useAccount } from 'hooks/useAccount'
import PortfolioActivity from 'pages/Portfolio/Activity/Activity'
import PortfolioConnectWalletView from 'pages/Portfolio/ConnectWalletView'
import PortfolioDefi from 'pages/Portfolio/Defi'
import PortfolioHeader from 'pages/Portfolio/Header/Header'
import { usePortfolioParams } from 'pages/Portfolio/Header/hooks/usePortfolioParams'
import { usePortfolioTabsAnimation } from 'pages/Portfolio/Header/hooks/usePortfolioTabsAnimation'
import PortfolioNfts from 'pages/Portfolio/Nfts'
import PortfolioOverview from 'pages/Portfolio/Overview'
import PortfolioTokens from 'pages/Portfolio/Tokens/Tokens'
import { PortfolioTab } from 'pages/Portfolio/types'
import { useLocation } from 'react-router'
import { Flex } from 'ui/src'
import { TransitionItem } from 'ui/src/animations/components/AnimatePresencePager'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

const renderPortfolioContent = (tab: PortfolioTab | undefined) => {
  switch (tab) {
    case PortfolioTab.Overview:
      return <PortfolioOverview />
    case PortfolioTab.Tokens:
      return <PortfolioTokens />
    case PortfolioTab.Defi:
      return <PortfolioDefi />
    case PortfolioTab.Nfts:
      return <PortfolioNfts />
    case PortfolioTab.Activity:
      return <PortfolioActivity />
    default:
      return <PortfolioOverview />
  }
}

// eslint-disable-next-line import/no-unused-modules -- used in RouteDefinitions.tsx via lazy import
export default function Portfolio() {
  const { pathname } = useLocation()
  const account = useAccount()
  const animationType = usePortfolioTabsAnimation(pathname)
  const { tab } = usePortfolioParams()

  return (
    <Trace logImpression page={InterfacePageName.PortfolioPage}>
      <Flex
        flexDirection="column"
        gap="$spacing40"
        maxWidth="$maxWidth1200"
        width="100%"
        p="$spacing24"
        pt="$none"
        position="relative"
      >
        {account.address ? (
          <>
            <PortfolioHeader />

            {/* Animated Content Area - All routes show same content, filtered by chain */}
            <Flex flex={1} position="relative">
              <TransitionItem childKey={pathname} animationType={animationType} animation="fast">
                {renderPortfolioContent(tab)}
              </TransitionItem>
            </Flex>
          </>
        ) : (
          <PortfolioConnectWalletView />
        )}
      </Flex>
    </Trace>
  )
}
