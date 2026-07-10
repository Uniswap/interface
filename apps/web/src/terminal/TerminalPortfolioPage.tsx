import { PortfolioScreen } from '~/terminal/screens/PortfolioScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalPortfolioPage(): JSX.Element {
  return (
    <TerminalChrome activeId="portfolio">
      <PortfolioScreen />
    </TerminalChrome>
  )
}
