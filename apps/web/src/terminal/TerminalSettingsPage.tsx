import { SettingsScreen } from '~/terminal/screens/SettingsScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalSettingsPage(): JSX.Element {
  return (
    <TerminalChrome activeId="settings">
      <SettingsScreen />
    </TerminalChrome>
  )
}
