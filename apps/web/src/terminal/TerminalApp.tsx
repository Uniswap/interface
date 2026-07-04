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
import { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { AccountDrawer } from '~/components/AccountDrawer'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { Portal } from '~/components/Popups/Portal'
import { useAccount } from '~/hooks/useAccount'
import { TerminalShell } from '~/terminal/components/TerminalShell'
import { terminalScreens, TerminalScreenId } from '~/terminal/config/screens'
import { SwapScreen } from '~/terminal/screens/SwapScreen'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const TERMINAL_BASE = '/terminal'

/**
 * Map the current pathname to the active rail screen id (for the active pill).
 * Handles both the core mounts (`/`, `/swap`) and the `/terminal/*` namespace.
 */
function activeScreenIdFromPath(pathname: string): TerminalScreenId | undefined {
  if (pathname === '/' || pathname === '/swap' || pathname.startsWith('/swap/')) {
    return 'swap'
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
  if (rest.startsWith('/hooks')) {
    return 'hook-detail'
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
 * Terminal shell wired to live app data (chain, wallet, portfolio total) and
 * react-router navigation. Also mounts the app's real AccountDrawer (portal) so
 * connect-wallet works on Terminal routes, which bypass the legacy Header.
 */
export function TerminalChrome({
  activeId,
  children,
}: {
  /** Overrides the pathname-derived active rail item (e.g. 'swap' on `/`). */
  activeId?: TerminalScreenId
  children: ReactNode
}): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()

  const resolvedActiveId = activeId ?? activeScreenIdFromPath(location.pathname)

  // Live chain readout (real) — from the connected/active chain.
  const chain = account.chainId ? { name: getChainLabel(account.chainId) } : undefined

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
          // TODO(data): live "hooks live" count from the hook registry (v4). Omitted
          // renders the loading skeleton — no fabricated count.
          hooksLive: undefined,
          wallet,
          onConnectWallet: () => accountDrawer.open(),
        }}
        topBar={{
          searchPlaceholder: 'Search markets, tokens, hooks…',
          // TODO(B11): open the command palette.
          onSearchClick: () => undefined,
          // TODO(data): live gas oracle (gwei). Omitted renders the skeleton.
          gas: undefined,
          chain,
          // TODO: chain switcher.
          onChainClick: () => undefined,
        }}
      >
        {children}
      </TerminalShell>
      {/* Real wallet drawer — normally mounted by the legacy Header's Web3Status,
          which Terminal routes bypass. */}
      <Portal>
        <AccountDrawer />
      </Portal>
    </>
  )
}

/**
 * Placeholder for Terminal screens that are being built in parallel. Keeps rail
 * navigation from 404-ing while other B-screens land. Real screens replace this
 * as they are added to the internal <Routes>.
 */
function ComingSoonScreen({ code, title }: { code: string; title: string }): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: '100%',
        minHeight: 480,
        fontFamily: terminalFonts.sans,
      }}
    >
      <div style={{ fontFamily: terminalFonts.mono, fontSize: 12, color: terminalColors.ink3Alt }}>{code}</div>
      <div style={{ fontFamily: terminalFonts.display, fontSize: 22, fontWeight: 600, color: terminalColors.ink }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: terminalColors.ink2 }}>This Terminal screen is under construction.</div>
    </div>
  )
}

export default function TerminalApp(): JSX.Element {
  return (
    <TerminalChrome>
      <Routes>
        <Route index element={<Navigate to="swap" replace />} />
        <Route path="swap" element={<SwapScreen />} />
        {/* Screens built in parallel — placeholders until their B-screen lands. */}
        <Route path="markets" element={<ComingSoonScreen code="B3" title={terminalScreens.markets.title} />} />
        <Route
          path="markets/:poolId"
          element={<ComingSoonScreen code="B6" title={terminalScreens['market-detail'].title} />}
        />
        <Route
          path="pools/new"
          element={<ComingSoonScreen code="B4" title={terminalScreens['create-position'].title} />}
        />
        <Route path="hooks" element={<ComingSoonScreen code="B7" title="Hooks" />} />
        <Route
          path="hooks/:hookId"
          element={<ComingSoonScreen code="B7" title={terminalScreens['hook-detail'].title} />}
        />
        <Route path="portfolio" element={<ComingSoonScreen code="B5" title={terminalScreens.portfolio.title} />} />
        <Route path="analytics" element={<ComingSoonScreen code="B10" title={terminalScreens.analytics.title} />} />
        <Route path="settings" element={<ComingSoonScreen code="B12" title={terminalScreens.settings.title} />} />
        <Route
          path="notifications"
          element={<ComingSoonScreen code="B13" title={terminalScreens.notifications.title} />}
        />
        <Route path="*" element={<Navigate to="swap" replace />} />
      </Routes>
    </TerminalChrome>
  )
}
