import { MarketDetailScreen } from '~/terminal/screens/MarketDetailScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalMarketDetailPage(): JSX.Element {
  return (
    <TerminalChrome activeId="markets">
      <MarketDetailScreen />
    </TerminalChrome>
  )
}
