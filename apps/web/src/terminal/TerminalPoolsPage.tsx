import { PoolsScreen } from '~/terminal/screens/PoolsScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalPoolsPage(): JSX.Element {
  return (
    <TerminalChrome activeId="create-position">
      <PoolsScreen />
    </TerminalChrome>
  )
}
