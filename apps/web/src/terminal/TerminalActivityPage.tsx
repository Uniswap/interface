import { ActivityScreen } from '~/terminal/screens/ActivityScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalActivityPage(): JSX.Element {
  return (
    <TerminalChrome activeId="notifications">
      <ActivityScreen />
    </TerminalChrome>
  )
}
