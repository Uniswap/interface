import { ReactNode } from 'react'
import { LeftRail, LeftRailProps } from '~/terminal/components/LeftRail'
import { TopBar, TopBarProps } from '~/terminal/components/TopBar'
import { terminalColors } from '~/terminal/theme/tokens'
import '~/terminal/theme/terminal.css'

export interface TerminalShellProps {
  /** Left-rail configuration (active screen, nav handler, live stats). */
  rail: LeftRailProps
  /** Top-bar configuration (search, gas, chain, per-screen actions). */
  topBar: TopBarProps
  /** Optional band directly under the top bar (e.g. B1 market ticker strip). */
  subBar?: ReactNode
  /** Screen body. */
  children: ReactNode
}

/**
 * Terminal app shell — 226px fixed LeftRail + 52px TopBar over a scrollable
 * content region (bg #FCFCFD). Wrapped in `.tm-root` so Terminal CSS variables
 * + fonts apply only inside this subtree. Fully additive: mounting this does not
 * touch the existing app shell.
 */
export function TerminalShell({ rail, topBar, subBar, children }: TerminalShellProps): JSX.Element {
  return (
    <div
      className="tm-root"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: terminalColors.bgApp,
      }}
    >
      <LeftRail {...rail} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: terminalColors.bgApp }}>
        <TopBar {...topBar} />
        {subBar}
        <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}
