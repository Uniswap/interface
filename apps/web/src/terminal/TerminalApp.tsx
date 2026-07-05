/**
 * HookSwap Terminal — chrome + router entry.
 *
 * `TerminalChrome` owns the Terminal shell (226px LeftRail + 52px TopBar) and is
 * reused by BOTH mount points:
 *   • the CORE routes `/` and `/swap` (see `TerminalSwapPage` — the Terminal is
 *     the primary app experience; the legacy swap page is no longer routed), and
 *   • the `/terminal/*` namespace (this file's default export), kept as an alias
 *     while the remaining B-screens are ported.
 *
 * The rail's active state + navigation are wired to react-router; the rail/top-bar
 * live stats (chain, wallet, portfolio) come from real app hooks with honest
 * loading states — no fabricated values. Because Terminal routes bypass the legacy
 * `AppLayout` (no legacy Header), the chrome mounts the app's real AccountDrawer
 * in a portal so connect-wallet still works.
 */
import { ReactNode, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { AccountDrawer } from '~/components/AccountDrawer'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import { Portal } from '~/components/Popups/Portal'
import { useAccount } from '~/hooks/useAccount'
import { useSelectChain } from '~/hooks/useSelectChain'
import { TerminalCommandPalette } from '~/terminal/components/TerminalCommandPalette'
import { TerminalShell } from '~/terminal/components/TerminalShell'
import { TerminalNavId } from '~/terminal/config/screens'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { ActivityScreen } from '~/terminal/screens/ActivityScreen'
import { AnalyticsScreen } from '~/terminal/screens/AnalyticsScreen'
import { LandingScreen } from '~/terminal/screens/LandingScreen'
import { LockerScreen } from '~/terminal/screens/LockerScreen'
import { MarketDetailScreen } from '~/terminal/screens/MarketDetailScreen'
import { MarketsScreen } from '~/terminal/screens/MarketsScreen'
import { PoolsScreen } from '~/terminal/screens/PoolsScreen'
import { PortfolioScreen } from '~/terminal/screens/PortfolioScreen'
import { SettingsScreen } from '~/terminal/screens/SettingsScreen'
import { SwapScreen } from '~/terminal/screens/SwapScreen'

const TERMINAL_BASE = '/terminal'

/**
 * Map the current pathname to the active rail screen id (for the active pill).
 * Handles both the core mounts (`/`, `/swap`) and the `/terminal/*` namespace.
 */
function activeScreenIdFromPath(pathname: string): TerminalNavId | undefined {
  if (pathname === '/' || pathname === '/swap' || pathname.startsWith('/swap/')) {
    return 'swap'
  }
  // Legacy (non-Terminal) routes surfaced in the rail — highlight their pill too.
  if (pathname === '/limit' || pathname === '/limits') {
    return 'limit'
  }
  if (pathname === '/buy') {
    return 'buy'
  }
  if (pathname === '/positions' || pathname.startsWith('/positions/')) {
    return 'positions'
  }
  if (pathname === '/portfolio' || pathname.startsWith('/portfolio/')) {
    return 'portfolio'
  }
  if (pathname.startsWith('/explore') || pathname.startsWith('/tokens')) {
    return 'markets'
  }
  if (!pathname.startsWith(TERMINAL_BASE)) {
    return undefined
  }
  const rest = pathname.slice(TERMINAL_BASE.length) // e.g. "/swap"
  if (rest === '' || rest === '/' || rest.startsWith('/swap')) {
    return 'swap'
  }
  if (rest.startsWith('/markets')) {
    return 'markets'
  }
  if (rest.startsWith('/pools')) {
    return 'create-position'
  }
  if (rest.startsWith('/locker')) {
    return 'locker'
  }
  if (rest.startsWith('/portfolio')) {
    return 'portfolio'
  }
  if (rest.startsWith('/notifications') || rest.startsWith('/activity')) {
    return 'notifications'
  }
  if (rest.startsWith('/analytics')) {
    return 'analytics'
  }
  if (rest.startsWith('/settings')) {
    return 'settings'
  }
  return undefined
}

/** Truncate an address to `0x1234…ABCD`. */
function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/**
 * Chain switcher dropdown, rendered in the top bar's `actions` slot. Lists the
 * app's real enabled chains (`useEnabledChains`) and switches the connected
 * wallet via `useSelectChain` (wagmi). No hardcoded chain list — all live.
 */
function ChainSwitcherMenu({
  chains,
  activeChainId,
  onSelect,
  onClose,
}: {
  chains: readonly UniverseChainId[]
  activeChainId?: number
  onSelect: (id: UniverseChainId) => void
  onClose: () => void
}): JSX.Element {
  return (
    <>
      {/* Click-away backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      <div
        style={{
          position: 'absolute',
          top: 46,
          right: 22,
          minWidth: 220,
          maxHeight: 360,
          overflowY: 'auto',
          background: terminalColors.bg,
          border: `1px solid ${terminalColors.line}`,
          borderRadius: 12,
          boxShadow: '0 14px 34px -12px rgba(11,15,20,.30)',
          padding: 6,
          zIndex: 41,
          fontFamily: terminalFonts.sans,
        }}
      >
        <div
          style={{
            fontFamily: terminalFonts.mono,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: terminalColors.ink3Alt,
            padding: '6px 10px 8px',
          }}
        >
          SWITCH NETWORK
        </div>
        {chains.map((id) => {
          const active = id === activeChainId
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 10px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                background: active ? terminalColors.panel : 'transparent',
              }}
            >
              <ChainLogo chainId={id} size={18} />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: terminalColors.ink,
                }}
              >
                {getChainLabel(id)}
              </span>
              {active ? (
                <span style={{ fontSize: 11, color: terminalColors.greenDeep, fontWeight: 600 }}>●</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </>
  )
}

/**
 * Terminal shell wired to live app data (chain, wallet, portfolio total) and
 * react-router navigation. Also mounts the app's real AccountDrawer (portal) so
 * connect-wallet works on Terminal routes, which bypass the legacy Header.
 */
export function TerminalChrome({
  activeId,
  children,
}: {
  /** Overrides the pathname-derived active rail item (e.g. 'swap' on `/`). */
  activeId?: TerminalNavId
  children: ReactNode
}): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const selectChain = useSelectChain()
  const { chains: enabledChains } = useEnabledChains()

  // Chain switcher — chrome owns the open/close of the top-bar chain menu.
  const [chainMenuOpen, setChainMenuOpen] = useState(false)

  // B11 command palette — chrome owns open/close (⌘K / Ctrl+K + top-bar search).
  const [paletteOpen, setPaletteOpen] = useState(false)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const resolvedActiveId = activeId ?? activeScreenIdFromPath(location.pathname)

  // Live chain readout (real) — from the connected/active chain.
  const chain = account.chainId ? { name: getChainLabel(account.chainId), chainId: account.chainId } : undefined

  // Live wallet + portfolio total (real) — honest skeletons while loading.
  const totalValue = usePortfolioTotalValue({ evmAddress: account.address })
  const wallet = account.address
    ? {
        addressShort: shortenAddress(account.address),
        portfolioUsdLabel:
          totalValue.data?.balanceUSD !== undefined
            ? `$${totalValue.data.balanceUSD.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : '$—',
      }
    : undefined

  return (
    <>
      <TerminalShell
        rail={{
          activeId: resolvedActiveId,
          onNavigate: (path) => navigate(path),
          wallet,
          onConnectWallet: () => accountDrawer.open(),
        }}
        topBar={{
          searchPlaceholder: 'Search markets, tokens…',
          onSearchClick: () => setPaletteOpen(true),
          // TODO(data): live gas oracle (gwei). Omitted renders the skeleton.
          gas: undefined,
          chain,
          onChainClick: () => setChainMenuOpen((prev) => !prev),
          actions: chainMenuOpen ? (
            <ChainSwitcherMenu
              chains={enabledChains}
              activeChainId={account.chainId}
              onSelect={async (id) => {
                setChainMenuOpen(false)
                await selectChain(id)
              }}
              onClose={() => setChainMenuOpen(false)}
            />
          ) : undefined,
        }}
      >
        {children}
      </TerminalShell>
      {/* Real wallet drawer — normally mounted by the legacy Header's Web3Status,
          which Terminal routes bypass. */}
      <Portal>
        <AccountDrawer />
      </Portal>
      <TerminalCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}

export default function TerminalApp(): JSX.Element {
  return (
    <TerminalChrome>
      <Routes>
        <Route index element={<Navigate to="swap" replace />} />
        <Route path="landing" element={<LandingScreen />} />
        <Route path="swap" element={<SwapScreen />} />
        <Route path="markets" element={<MarketsScreen />} />
        <Route path="pools/new" element={<PoolsScreen />} />
        <Route path="pools" element={<PoolsScreen />} />
        <Route path="locker" element={<LockerScreen />} />
        <Route path="portfolio" element={<PortfolioScreen />} />
        <Route path="activity" element={<ActivityScreen />} />
        <Route path="notifications" element={<ActivityScreen />} />
        <Route path="markets/:poolId" element={<MarketDetailScreen />} />
        <Route path="analytics" element={<AnalyticsScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="swap" replace />} />
      </Routes>
    </TerminalChrome>
  )
}
