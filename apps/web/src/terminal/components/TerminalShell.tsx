import { ReactNode, useState } from 'react'
import { BottomTabBar, BOTTOM_TAB_BAR_HEIGHT } from '~/terminal/components/BottomTabBar'
import { LeftRail, LeftRailProps } from '~/terminal/components/LeftRail'
import { TopBar, TopBarProps } from '~/terminal/components/TopBar'
import { TopNav } from '~/terminal/components/TopNav'
import { useIsMobileViewport } from '~/terminal/hooks/useIsMobileViewport'
import { terminalColors } from '~/terminal/theme/tokens'
import '~/terminal/theme/terminal.css'

export interface TerminalShellProps {
  /** Navigation configuration (active screen, nav handler, live wallet stats). */
  rail: LeftRailProps
  /** Top-bar configuration (search, gas, chain, wallet, per-screen actions). */
  topBar: TopBarProps
  /** Optional band directly under the top nav (e.g. B1 market ticker strip). */
  subBar?: ReactNode
  /** Screen body. */
  children: ReactNode
}

/**
 * Terminal app shell.
 *
 * • Desktop (≥ 900px): a full-width 64px TOP navigation bar (TopNav) over a
 *   scrollable, full-width content region — matched to the marketing landing
 *   header (logo, Trade/Markets/Earn/Portfolio/Docs, ⌘K search, chain chip,
 *   green Connect).
 * • Mobile (< 900px): a compact TopBar (hamburger) + a fixed bottom tab bar
 *   (Swap · Markets · Pools · Portfolio · More); "More" opens the full nav as a
 *   left slide-in drawer (LeftRail reused). Content goes full-width and is
 *   bottom-padded to clear the tab bar + iOS home indicator. Breakpoint via
 *   `useIsMobileViewport` so the desktop layout is untouched.
 *
 * Wrapped in `.tm-root` so Terminal CSS variables + fonts apply only inside this subtree.
 */
export function TerminalShell({ rail, topBar, subBar, children }: TerminalShellProps): JSX.Element {
  const isMobile = useIsMobileViewport()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (isMobile) {
    // In the mobile drawer, tapping a nav item navigates AND closes the drawer.
    const drawerRail: LeftRailProps = {
      ...rail,
      onNavigate: (path, id) => {
        setDrawerOpen(false)
        rail.onNavigate?.(path, id)
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
        flexDirection: 'column',
        minHeight: '100vh',
        background: terminalColors.bgApp,
      }}
    >
      <TopNav
        activeId={rail.activeId}
        onNavigate={rail.onNavigate}
        searchPlaceholder={topBar.searchPlaceholder}
        onSearchClick={topBar.onSearchClick}
        chain={topBar.chain}
        onChainClick={topBar.onChainClick}
        wallet={topBar.wallet}
        onConnectWallet={topBar.onConnectWallet}
        onWalletClick={topBar.onWalletClick}
        actions={topBar.actions}
      />
      {subBar}
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>{children}</div>
    </div>
  )
}
