import { LockerScreen } from '~/terminal/screens/LockerScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalLockerPage(): JSX.Element {
  return (
    <TerminalChrome activeId="locker">
      <LockerScreen />
    </TerminalChrome>
  )
}
