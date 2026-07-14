import { FarmsScreen } from '~/terminal/screens/FarmsScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalFarmsPage(): JSX.Element {
  return (
    <TerminalChrome activeId="farms">
      <FarmsScreen />
    </TerminalChrome>
  )
}
