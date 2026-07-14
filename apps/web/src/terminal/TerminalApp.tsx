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
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router'
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
import { LimitScreen } from '~/terminal/screens/LimitScreen'
import { SendScreen } from '~/terminal/screens/SendScreen'
import { useCaptureRef } from '~/terminal/referral/useCaptureRef'
import { SwapScreen } from '~/terminal/screens/SwapScreen'

const TERMINAL_BASE = '/terminal'

/**
 * Map the current pathname to the active rail screen id (for the active pill).
 * Handles both the core mounts (`/`, `/swap`) and the `/terminal/*` namespace.
 */
function activeScreenIdFromPath(pathname: string): TerminalNavId | undefined {
  // `/` is the Landing page (not a rail item) → no active pill. `/swap` is Swap.
  if (pathname === '/swap' || pathname.startsWith('/swap/')) {
    return 'swap'
  }
  // Legacy (non-Terminal) routes surfaced in the rail — highlight their pill too.
  if (pathname === '/limit' || pathname === '/limits') {
    return 'limit'
  }
  if (pathname === '/positions' || pathname.startsWith('/positions/')) {
    return 'positions'
  }
  if (pathname === '/portfolio' || pathname.startsWith('/portfolio/')) {
    return 'portfolio'
  }
  if (pathname === '/markets' || pathname.startsWith('/markets/')) {
    return 'markets'
  }
  if (pathname === '/pools' || pathname === '/pools/new') {
    return 'create-position'
  }
  if (pathname === '/locker') {
    return 'locker'
  }
  if (pathname === '/multisender') {
    return 'multisender'
  }
  if (pathname === '/activity') {
    return 'notifications'
  }
  if (pathname === '/analytics') {
    return 'analytics'
  }
  if (pathname === '/leaderboard') {
    return 'leaderboard'
  }
  if (pathname === '/referrals') {
    return 'referrals'
  }
  if (pathname === '/settings') {
    return 'settings'
  }
  if (pathname === '/widget') {
    return 'widget-builder'
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
  if (rest.startsWith('/limit')) {
    return 'limit'
  }
  // Send is a sub-mode of the swap ticket (no dedicated rail item) — keep the Swap pill active.
  if (rest.startsWith('/send')) {
    return 'swap'
  }
  if (rest.startsWith('/markets')) {
    return 'markets'
  }
  if (rest.startsWith('/pools')) {
    return 'create-position'
  }
  if (rest.startsWith('/positions')) {
    return 'positions'
  }
  if (rest.startsWith('/locker')) {
    return 'locker'
  }
  if (rest.startsWith('/multisender')) {
    return 'multisender'
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
  if (rest.startsWith('/leaderboard')) {
    return 'leaderboard'
  }
  if (rest.startsWith('/referrals')) {
    return 'referrals'
  }
  if (rest.startsWith('/widget')) {
    return 'widget-builder'
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
 * Chains the HookSwap Terminal actually offers for trading right now. Every other
 * chain HookSwap has contracts deployed on (Sepolia, MegaETH, Ink, XLayer, HyperEVM,
 * Tempo) still renders in the switcher for visibility, but disabled with a
 * "Coming soon" badge — no liquidity/production traffic there yet. Update this set
 * as each chain gets seeded liquidity and goes live.
 */
const TERMINAL_LIVE_CHAIN_IDS: ReadonlySet<UniverseChainId> = new Set([UniverseChainId.Robinhood])

/**
 * Chain switcher dropdown, rendered in the top bar's `actions` slot. Lists the
 * app's real enabled chains (`useEnabledChains`); only `TERMINAL_LIVE_CHAIN_IDS`
 * are selectable — the rest render disabled with a "Coming soon" badge. Switches
 * the connected wallet via `useSelectChain` (wagmi) for the live chain(s).
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
  // Live chains first, so the one thing you can actually pick is right at the top.
  const orderedChains = [...chains].sort((a, b) => {
    const aLive = TERMINAL_LIVE_CHAIN_IDS.has(a) ? 0 : 1
    const bLive = TERMINAL_LIVE_CHAIN_IDS.has(b) ? 0 : 1
    return aLive - bLive
  })
  return (
    <>
      {/* Click-away backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      <div
        style={{
          position: 'absolute',
          top: 60,
          right: 24,
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
        {orderedChains.map((id) => {
          const active = id === activeChainId
          const isLive = TERMINAL_LIVE_CHAIN_IDS.has(id)
          return (
            <button
              key={id}
              type="button"
              disabled={!isLive}
              aria-disabled={!isLive}
              onClick={isLive ? () => onSelect(id) : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 10px',
                borderRadius: 9,
                border: 'none',
                cursor: isLive ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                background: active ? terminalColors.panel : 'transparent',
                opacity: isLive ? 1 : 0.5,
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
              ) : !isLive ? (
                <span
                  style={{
                    fontFamily: terminalFonts.mono,
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: terminalColors.ink3,
                    background: terminalColors.panel2,
                    border: `1px solid ${terminalColors.line}`,
                    borderRadius: 5,
                    padding: '2px 6px',
                  }}
                >
                  Soon
                </span>
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
  const { chains: enabledChains, defaultChainId } = useEnabledChains()

  // Capture `?ref=<code>` from the URL into localStorage for referral attribution.
  useCaptureRef()

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

  // Chain chip: show the connected chain when a wallet is connected, else the
  // default enabled HookSwap chain (so the chip shows a real network + logo and
  // the switcher is always meaningful — never a bare "—"). Prefer Robinhood — the
  // only chain the Terminal currently offers for trading (see TERMINAL_LIVE_CHAIN_IDS)
  // — over whatever `defaultChainId`/ordering would otherwise surface.
  const displayChainId =
    account.chainId ??
    (enabledChains.includes(UniverseChainId.Robinhood) ? UniverseChainId.Robinhood : undefined) ??
    defaultChainId ??
    enabledChains[0]
  const chain = displayChainId
    ? { name: getChainLabel(displayChainId), chainId: displayChainId }
    : undefined

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
          // Top-right wallet button (mirrors the left-rail chip). Reuses the real
          // AccountDrawer mounted below: disconnected → open to connect; connected
          // → toggle (the drawer's Power menu handles switch / disconnect).
          wallet,
          onConnectWallet: () => accountDrawer.open(),
          onWalletClick: () => accountDrawer.toggle(),
          actions: chainMenuOpen ? (
            <ChainSwitcherMenu
              chains={enabledChains}
              activeChainId={displayChainId}
              onSelect={async (id) => {
                setChainMenuOpen(false)
                if (!account.address) {
                  // No wallet yet — prompt connect; the wallet picks the chain on connect.
                  accountDrawer.open()
                  return
                }
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

/** Forwards `/terminal/markets/:poolId` to the canonical `/markets/:poolId`, keeping the param. */
function MarketDetailRedirect(): JSX.Element {
  const { poolId } = useParams<{ poolId: string }>()
  return <Navigate to={`/markets/${poolId ?? ''}`} replace />
}

export default function TerminalApp(): JSX.Element {
  return (
    <TerminalChrome>
      <Routes>
        <Route index element={<Navigate to="swap" replace />} />
        {/* Landing is self-contained (own nav) — serve it standalone at `/`, not
            inside the shell (which would double the nav). Redirect the legacy path. */}
        <Route path="landing" element={<Navigate to="/" replace />} />
        <Route path="swap" element={<SwapScreen />} />
        <Route path="limit" element={<LimitScreen />} />
        <Route path="send" element={<SendScreen />} />
        {/* Every other screen now has a canonical un-prefixed route — redirect old
            `/terminal/*` bookmarks/links there instead of rendering a second copy. */}
        <Route path="markets" element={<Navigate to="/markets" replace />} />
        <Route path="markets/:poolId" element={<MarketDetailRedirect />} />
        <Route path="pools/new" element={<Navigate to="/pools/new" replace />} />
        <Route path="pools" element={<Navigate to="/pools" replace />} />
        <Route path="positions" element={<Navigate to="/positions" replace />} />
        <Route path="locker" element={<Navigate to="/locker" replace />} />
        <Route path="multisender" element={<Navigate to="/multisender" replace />} />
        <Route path="portfolio" element={<Navigate to="/portfolio" replace />} />
        <Route path="activity" element={<Navigate to="/activity" replace />} />
        <Route path="notifications" element={<Navigate to="/activity" replace />} />
        <Route path="analytics" element={<Navigate to="/analytics" replace />} />
        <Route path="leaderboard" element={<Navigate to="/leaderboard" replace />} />
        <Route path="referrals" element={<Navigate to="/referrals" replace />} />
        <Route path="settings" element={<Navigate to="/settings" replace />} />
        <Route path="widget" element={<Navigate to="/widget" replace />} />
        <Route path="*" element={<Navigate to="swap" replace />} />
      </Routes>
    </TerminalChrome>
  )
}
