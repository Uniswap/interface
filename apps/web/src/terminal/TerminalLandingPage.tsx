/**
 * HookSwap Terminal — landing mount for the core route `/`.
 *
 * The B1 Landing is the DEFAULT home page. `LandingScreen` is a fully self-contained
 * marketing page: it renders its OWN top nav header + footer + AccountDrawer + ⌘K
 * command palette, so it must NOT be wrapped in `TerminalChrome` (which would add the
 * app shell's TopNav on top → a duplicate second navigation bar). `/swap` etc. keep
 * rendering inside the shell (see `TerminalApp`).
 */
import { LandingScreen } from '~/terminal/screens/LandingScreen'

export default function TerminalLandingPage(): JSX.Element {
  return <LandingScreen />
}
