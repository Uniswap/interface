import { ConnectedAddressDisplay } from '~/pages/Portfolio/Header/PortfolioAddressDisplay/ConnectedAddressDisplay'
import { DemoAddressDisplay } from '~/pages/Portfolio/Header/PortfolioAddressDisplay/DemoAddressDisplay'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'

export function PortfolioAddressDisplay({ isCompact }: { isCompact: boolean }): JSX.Element {
  const showDemoView = useShowDemoView()

  if (showDemoView) {
    return <DemoAddressDisplay />
  }

  return <ConnectedAddressDisplay isCompact={isCompact} />
}
