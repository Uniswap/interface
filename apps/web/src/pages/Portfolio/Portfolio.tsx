import { Layers, PortfolioDisconnectedDemoViewProperties, useExperimentValueFromLayer } from '@universe/gating'
import { useScroll } from 'hooks/useScroll'
import { CONNECT_WALLET_BANNER_HEIGHT, CONNECT_WALLET_FIXED_BOTTOM_SECTION_HEIGHT } from 'pages/Portfolio/constants'
import useIsConnected from 'pages/Portfolio/Header/hooks/useIsConnected'
import PortfolioDisconnectedView from 'pages/Portfolio/PortfolioDisconnectedView'
import { PortfolioPageInner } from 'pages/Portfolio/PortfolioPageInner'
import { useMemo } from 'react'
import { InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
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
      ) : showDemoDisconnectedView ? (
        <Trace logImpression section={SectionName.PortfolioDisconnectedDemoView}>
          <PortfolioPageInner scrollY={scrollY} isBannerVisible={isBannerVisible} mb={DEMO_BOTTOM_MARGIN} />
        </Trace>
      ) : (
        <PortfolioPageInner scrollY={scrollY} isBannerVisible={isBannerVisible} />
      )}
    </Trace>
  )
}
