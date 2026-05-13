import { InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CONNECT_WALLET_FIXED_BOTTOM_SECTION_HEIGHT } from '~/pages/Portfolio/constants'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { PortfolioPageInner } from '~/pages/Portfolio/PortfolioPageInner'

const DEMO_BOTTOM_MARGIN = CONNECT_WALLET_FIXED_BOTTOM_SECTION_HEIGHT - 40

export function Portfolio() {
  const showDemoView = useShowDemoView()
  const { isExternalWallet } = usePortfolioRoutes()

  return (
    <Trace logImpression page={InterfacePageName.PortfolioPage} properties={{ isExternal: isExternalWallet }}>
      {showDemoView ? (
        <Trace logImpression section={SectionName.PortfolioDisconnectedDemoView}>
          <PortfolioPageInner mb={DEMO_BOTTOM_MARGIN} />
        </Trace>
      ) : (
        <PortfolioPageInner />
      )}
    </Trace>
  )
}

export default Portfolio
