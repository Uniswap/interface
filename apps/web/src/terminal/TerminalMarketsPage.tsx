import { MarketsScreen } from '~/terminal/screens/MarketsScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalMarketsPage(): JSX.Element {
  return (
    <TerminalChrome activeId="markets">
      <MarketsScreen />
    </TerminalChrome>
  )
}
