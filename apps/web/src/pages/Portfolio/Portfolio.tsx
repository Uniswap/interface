import { Layers, PortfolioDisconnectedDemoViewProperties, useExperimentValueFromLayer } from '@universe/gating'
import { useScroll } from 'hooks/useScroll'
import { PortfolioConnectWalletBanner } from 'pages/Portfolio/ConnectWalletBanner/ConnectWalletBanner'
import { ConnectWalletFixedBottomButton } from 'pages/Portfolio/ConnectWalletFixedBottomButton'
import { CONNECT_WALLET_BANNER_HEIGHT, CONNECT_WALLET_FIXED_BOTTOM_SECTION_HEIGHT } from 'pages/Portfolio/constants'
import { PortfolioHeader } from 'pages/Portfolio/Header/Header'
import useIsConnected from 'pages/Portfolio/Header/hooks/useIsConnected'
import { PortfolioContent } from 'pages/Portfolio/PortfolioContent'
import PortfolioDisconnectedView from 'pages/Portfolio/PortfolioDisconnectedView'
import { useMemo } from 'react'
import { Flex } from 'ui/src'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

// Trigger slightly before banner fully scrolls out for more responsive animation
const SCROLL_BUFFER = 40
const BANNER_SCROLL_THRESHOLD = CONNECT_WALLET_BANNER_HEIGHT - SCROLL_BUFFER
const DEMO_BOTTOM_MARGIN = CONNECT_WALLET_FIXED_BOTTOM_SECTION_HEIGHT - 40

// eslint-disable-next-line import/no-unused-modules -- used in RouteDefinitions.tsx via lazy import
export default function Portfolio() {
  const isConnected = useIsConnected()
  const demoDisconnectedViewEnabled = useExperimentValueFromLayer({
    layerName: Layers.PortfolioPage,
    param: PortfolioDisconnectedDemoViewProperties.DemoViewEnabled,
    defaultValue: false,
  })

  const showDemoDisconnectedView = demoDisconnectedViewEnabled && !isConnected
  const { height: scrollY } = useScroll()
  const isBannerVisible = useMemo(() => scrollY < BANNER_SCROLL_THRESHOLD, [scrollY])

  return (
    <Trace logImpression page={InterfacePageName.PortfolioPage}>
      {!demoDisconnectedViewEnabled && !isConnected ? (
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
          mb={showDemoDisconnectedView ? DEMO_BOTTOM_MARGIN : '$none'}
          $sm={{ p: '$spacing8' }}
        >
          {!isConnected && <PortfolioConnectWalletBanner />}
          {!isConnected && <ConnectWalletFixedBottomButton shouldShow={!isBannerVisible} />}

          {isConnected ? (
            <>
              <PortfolioHeader scrollY={scrollY} />

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
