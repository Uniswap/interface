import { ReactNode, useCallback, useState } from 'react'
import { LeftRail, LeftRailProps } from '~/terminal/components/LeftRail'
import { TopBar, TopBarProps } from '~/terminal/components/TopBar'
import { terminalColors } from '~/terminal/theme/tokens'
import '~/terminal/theme/terminal.css'

const RAIL_COLLAPSE_KEY = 'hookswap.terminal.railCollapsed'

/** Read the persisted rail state. Default: expanded (open by default). */
function readRailCollapsed(): boolean {
  try {
    return globalThis.localStorage?.getItem(RAIL_COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

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
  // Rail collapse is a pure layout concern owned here; open by default, persisted.
  const [collapsed, setCollapsed] = useState<boolean>(readRailCollapsed)
  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        globalThis.localStorage?.setItem(RAIL_COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        // ignore storage failures (private mode etc.)
      }
      return next
    })
  }, [])

  return (
    <div
      className="tm-root"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: terminalColors.bgApp,
      }}
    >
      <LeftRail {...rail} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: terminalColors.bgApp }}>
        <TopBar {...topBar} />
        {subBar}
        <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}
