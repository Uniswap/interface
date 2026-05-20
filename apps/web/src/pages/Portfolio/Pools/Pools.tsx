import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'

export function PortfolioPools() {
  const { isExternalWallet } = usePortfolioAddresses()

  return (
    <Trace logImpression page={InterfacePageName.PortfolioPoolsPage} properties={{ isExternal: isExternalWallet }}>
      <></>
    </Trace>
  )
}
