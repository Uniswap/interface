import { CreateTokenScreen } from '~/terminal/screens/CreateTokenScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalCreateTokenPage(): JSX.Element {
  return (
    <TerminalChrome activeId="create-token">
      <CreateTokenScreen />
    </TerminalChrome>
  )
}
