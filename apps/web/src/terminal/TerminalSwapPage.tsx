/**
 * HookSwap Terminal — core-route mount.
 *
 * The Terminal UI is the PRIMARY app experience: this page renders the Terminal
 * chrome + B2 Swap screen at `/` and `/swap` (see RouteDefinitions). The legacy
 * swap page component stays in the tree (`~/pages/Swap`) but is no longer routed
 * at these paths; remaining legacy surfaces (/explore, /positions, /portfolio)
 * are linked from the Terminal rail until they are ported screen by screen.
 */
import { SwapScreen } from '~/terminal/screens/SwapScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalSwapPage(): JSX.Element {
  return (
    <TerminalChrome activeId="swap">
      <SwapScreen />
    </TerminalChrome>
  )
}
