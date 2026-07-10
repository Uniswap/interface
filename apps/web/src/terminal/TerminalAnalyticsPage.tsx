import { AnalyticsScreen } from '~/terminal/screens/AnalyticsScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalAnalyticsPage(): JSX.Element {
  return (
    <TerminalChrome activeId="analytics">
      <AnalyticsScreen />
    </TerminalChrome>
  )
}
