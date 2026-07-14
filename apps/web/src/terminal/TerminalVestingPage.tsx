import { VestingScreen } from '~/terminal/screens/VestingScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalVestingPage(): JSX.Element {
  return (
    <TerminalChrome activeId="vesting">
      <VestingScreen />
    </TerminalChrome>
  )
}
