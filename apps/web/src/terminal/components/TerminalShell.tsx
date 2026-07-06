import { ReactNode, useCallback, useState } from 'react'
import { BottomTabBar, BOTTOM_TAB_BAR_HEIGHT } from '~/terminal/components/BottomTabBar'
import { LeftRail, LeftRailProps } from '~/terminal/components/LeftRail'
import { TopBar, TopBarProps } from '~/terminal/components/TopBar'
import { useIsMobileViewport } from '~/terminal/hooks/useIsMobileViewport'
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
 * Terminal app shell.
 *
 * • Desktop (≥ 900px): 226px fixed LeftRail + TopBar over a scrollable content region.
 * • Mobile (< 900px): the rail is replaced by a fixed bottom tab bar (Swap · Markets ·
 *   Pools · Portfolio · More); "More" opens the full nav as a left slide-in drawer.
 *   Content goes full-width and is bottom-padded to clear the tab bar + iOS home
 *   indicator. Breakpoint via `useIsMobileViewport` so the desktop layout is untouched.
 *
 * Wrapped in `.tm-root` so Terminal CSS variables + fonts apply only inside this subtree.
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

  const isMobile = useIsMobileViewport()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (isMobile) {
    // In the mobile drawer, tapping a nav item navigates AND closes the drawer.
    const drawerRail: LeftRailProps = {
      ...rail,
      onNavigate: (path: string) => {
        setDrawerOpen(false)
        rail.onNavigate?.(path)
      },
    }

    return (
      <div
        className="tm-root"
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: terminalColors.bgApp }}
      >
        <TopBar {...topBar} isMobile onMenuClick={() => setDrawerOpen(true)} />
        {subBar}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'auto',
            // Clear the fixed bottom tab bar + the iPhone home indicator.
            paddingBottom: `calc(${BOTTOM_TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          {children}
        </div>

        <BottomTabBar
          activeId={rail.activeId}
          onNavigate={rail.onNavigate}
          onMore={() => setDrawerOpen(true)}
          moreActive={drawerOpen}
        />

        {drawerOpen ? (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(11,15,20,.4)', zIndex: 50 }}
            />
            <div
              style={{
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: 0,
                width: 262,
                maxWidth: '84vw',
                zIndex: 51,
                overflowY: 'auto',
                background: terminalColors.bg,
                boxShadow: '2px 0 28px -6px rgba(11,15,20,.28)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              <LeftRail {...drawerRail} collapsed={false} hideCollapseToggle />
            </div>
          </>
        ) : null}
      </div>
    )
  }

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
