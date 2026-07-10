import { PositionsScreen } from '~/terminal/screens/PositionsScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalPositionsPage(): JSX.Element {
  return (
    <TerminalChrome activeId="positions">
      <PositionsScreen />
    </TerminalChrome>
  )
}
