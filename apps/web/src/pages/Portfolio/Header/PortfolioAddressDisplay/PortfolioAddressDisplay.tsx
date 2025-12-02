import useIsConnected from 'pages/Portfolio/Header/hooks/useIsConnected'
import { ConnectedAddressDisplay } from 'pages/Portfolio/Header/PortfolioAddressDisplay/ConnectedAddressDisplay'
import { DemoAddressDisplay } from 'pages/Portfolio/Header/PortfolioAddressDisplay/DemoAddressDisplay'

export function PortfolioAddressDisplay(): JSX.Element {
  const isConnected = useIsConnected()

  return isConnected ? <ConnectedAddressDisplay /> : <DemoAddressDisplay />
}
