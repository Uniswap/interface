import { MultisenderScreen } from '~/terminal/screens/MultisenderScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalMultisenderPage(): JSX.Element {
  return (
    <TerminalChrome activeId="multisender">
      <MultisenderScreen />
    </TerminalChrome>
  )
}
