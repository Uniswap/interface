/**
 * HookSwap Terminal — landing mount for the core route `/`.
 *
 * The B1 Landing is the DEFAULT home page: `/` renders the Terminal chrome + the
 * Landing screen. `/swap` keeps rendering the Swap screen (see `TerminalSwapPage`).
 */
import { LandingScreen } from '~/terminal/screens/LandingScreen'
import { TerminalChrome } from '~/terminal/TerminalApp'

export default function TerminalLandingPage(): JSX.Element {
  return (
    <TerminalChrome>
      <LandingScreen />
    </TerminalChrome>
  )
}
