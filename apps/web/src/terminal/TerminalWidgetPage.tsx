import { WidgetBuilderScreen } from '~/terminal/screens/WidgetBuilderScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalWidgetPage(): JSX.Element {
  return (
    <TerminalChrome activeId="widget-builder">
      <WidgetBuilderScreen />
    </TerminalChrome>
  )
}
