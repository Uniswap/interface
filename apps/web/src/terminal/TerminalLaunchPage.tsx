import { LaunchScreen } from '~/terminal/screens/LaunchScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalLaunchPage(): JSX.Element {
  return (
    <TerminalChrome activeId="launchpad">
      <LaunchScreen />
    </TerminalChrome>
  )
}
