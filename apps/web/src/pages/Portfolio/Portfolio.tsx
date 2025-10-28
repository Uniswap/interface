import { Layers, PortfolioDisconnectedDemoViewProperties, useExperimentValueFromLayer } from '@universe/gating'
import PortfolioConnectWalletBanner from 'pages/Portfolio/ConnectWalletBanner'
import { ConnectWalletBottomOverlay } from 'pages/Portfolio/ConnectWalletBottomOverlay'
import PortfolioHeader from 'pages/Portfolio/Header/Header'
import useIsConnected from 'pages/Portfolio/Header/hooks/useIsConnected'
import { PortfolioContent } from 'pages/Portfolio/PortfolioContent'
import PortfolioDisconnectedView from 'pages/Portfolio/PortfolioDisconnectedView'
import { Flex } from 'ui/src'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

// eslint-disable-next-line import/no-unused-modules -- used in RouteDefinitions.tsx via lazy import
export default function Portfolio() {
  const isConnected = useIsConnected()
  const showDemoView = useExperimentValueFromLayer({
    layerName: Layers.PortfolioPage,
    param: PortfolioDisconnectedDemoViewProperties.DemoViewEnabled,
    defaultValue: false,
  })

  return (
    <Trace logImpression page={InterfacePageName.PortfolioPage}>
      {!showDemoView && !isConnected ? (
        <PortfolioDisconnectedView />
      ) : (
        <Flex
          flexDirection="column"
          gap="$spacing40"
          maxWidth="$maxWidth1200"
          width="100%"
          p="$spacing24"
          pt="$none"
          position="relative"
        >
          {!isConnected && <PortfolioConnectWalletBanner />}
          {!isConnected && <ConnectWalletBottomOverlay />}

          {isConnected ? (
            <>
              <PortfolioHeader />

              {/* Animated Content Area - All routes show same content, filtered by chain */}
              <PortfolioContent />
            </>
          ) : (
            <>
              <PortfolioHeader />

              {/* Animated Content Area - All routes show same content, filtered by chain */}
              <Flex cursor="not-allowed">
                <PortfolioContent disabled />
              </Flex>
            </>
          )}
        </Flex>
      )}
    </Trace>
  )
}
