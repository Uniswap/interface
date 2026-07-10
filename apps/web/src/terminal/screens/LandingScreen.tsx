/**
 * HookSwap Terminal — B1 Landing (DARK terminal marketing page).
 *
 * Pixel-perfect recreation of the "HookSwap Terminal Landing" DARK reference
 * (vexor handoff: hookswap-terminal-landing.png / .html). This is a STANDALONE
 * marketing page — it renders its own header + footer (NOT the Terminal rail /
 * top-bar chrome), so both mounts (`/` via TerminalLandingPage and
 * `/terminal/landing` via TerminalApp) render it bare. It mounts the app's real
 * AccountDrawer (portal) + the ⌘K command palette itself so Connect / search
 * still work without the chrome, and captures `?ref=` for referral attribution.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HARD PRODUCT CONSTRAINTS (override the reference):
 *   • NO HOOKS. HookSwap ships v2 + v3 only. The reference's "Hook marketplace"
 *     section, the markets-table "Hook" column, and all "supercharged by hooks"
 *     copy are DROPPED. The marketplace band is replaced by a v2/v3 "Why HookSwap"
 *     value-prop band. No hook UI, chip, badge, or column appears anywhere.
 *   • NO FABRICATED DATA. Every rendered value is LIVE (real app hooks) or an
 *     honest loading/empty state. Nothing uses the mock's placeholder figures.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DATA BINDINGS (all live; honest "—"/empty when a feed hasn't resolved):
 *   • Ticker tape    — `useListTokens` (real token price + 24h %), color-coded.
 *   • Hero stat cards— TVL `useDailyTVLWithChange`, 24h vol `use24hProtocolVolume`
 *                      (+ real deltas); Pools = live `useTopPools` count. Stat
 *                      sparklines are the real protocol-stats daily series
 *                      (`useProtocolStats`) — omitted when no series exists.
 *   • Featured chart — top pool by 24h volume (`useTopPools`), real logos/price/
 *                      24h change (joined from `useListTokens`), and the base
 *                      token's real `priceHistory1d` close series drawn as a
 *                      line+area with a real last-price marker. The footer's
 *                      Liquidity / 24h vol / APR are the real pool stats. We only
 *                      have close series (no OHLC) → an honest line/area, never
 *                      fabricated candles.
 *   • Order book +   — NO live feed for the target chains (AMMs have no order
 *     Liquidity depth   book; no live depth feed) → honest framed empty states.
 *   • Top markets    — `useTopPools` (sorted by 24h vol): pair + real logos, TVL,
 *                      24h vol, real `pool.apr`, and a real 1d trend sparkline
 *                      (base token `priceHistory1d`) + real 1d change. NO Hook col.
 *   • Live activity  — `useActivityData` (the connected wallet's real tx history);
 *                      disconnected/empty → honest empty state.
 *   • Feature grid / Why-HookSwap / CTA / footer are static nav + marketing copy
 *     (no data), every link a real route or a HookSwap URL (docs.hookswap.org /
 *     HOOKSWAP_LINKS socials). NO uniswap.org URLs, NO help/support links.
 */
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import type { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { isLoadingItem, isSectionHeader } from 'uniswap/src/components/activity/utils'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  TransactionStatus,
  TransactionType,
  type TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { NumberType } from 'utilities/src/format/types'
import { supportedChainIdFromGQLChain } from '~/appGraphql/data/chainUtils'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'
import { gqlToCurrency, OrderDirection, unwrapToken } from '~/appGraphql/data/util'
import { AccountDrawer } from '~/components/AccountDrawer'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { Portal } from '~/components/Popups/Portal'
import { ExploreContextProvider, useProtocolStats } from '~/features/Explore/state'
import { use24hProtocolVolume, useDailyTVLWithChange } from '~/features/Explore/state/protocolStats'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { useTopPools } from '~/features/Explore/state/topPools/useTopPools'
import { serializeSwapAddressesToURLParameters } from '~/pages/Swap/Swap/state/tradeQueryParams'
import { useAccount } from '~/hooks/useAccount'
import { SparklineCell } from '~/terminal/components/SparklineCell'
import { TerminalCommandPalette } from '~/terminal/components/TerminalCommandPalette'
import { HOOKSWAP_LINKS } from '~/terminal/config/screens'
import { useCaptureRef } from '~/terminal/referral/useCaptureRef'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { formatRelativeTime } from '~/terminal/utils/time'
import type { PoolStat } from '~/types/explore'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

const CONTENT_WIDTH = 1200

/**
 * ONE uniform column track shared by EVERY feature card grid (TRADE / EARN / TRACK
 * groups + the "Why HookSwap" band). `auto-fill` (not `auto-fit`) keeps the column
 * width constant regardless of how many cards a section has, so a 2-card, 3-card and
 * 4-card row all align on the same grid — no stretched orphan cards. Collapses
 * 4→2→1 columns as the viewport narrows.
 */

/** Signed percent, 1 decimal: 2.4 → "+2.4%", -3.1 → "-3.1%". */
function formatSignedPct(value: number): string {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(1)}%`
}

/** Shorten an address to `0x1234…ABCD`. */
function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/* ------------------------------------------------------------ keyframes (once) */

/** Marquee + pulse keyframes + clickable-ticker hover, namespaced so they never collide with app CSS. */
const KEYFRAMES = `
@keyframes hs-tape { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes hs-blip { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
.hs-ticker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 3px 8px;
  cursor: pointer;
  transition: background 120ms ease;
}
.hs-ticker-item:hover { background: ${terminalColors.line3}; }
`

/**
 * Current viewport width (px) with a resize listener — inline styles can't do
 * media queries, so the landing switches layouts off this value. Self-contained
 * (window resize) so it works inside the inline-styled marketing subtree.
 */
function useViewportWidth(): number {
  const [width, setWidth] = useState<number>(() => (typeof window === 'undefined' ? 1200 : window.innerWidth))
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const onResize = (): void => setWidth(window.innerWidth)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

/* --------------------------------------------------- token-metric join (real) */

interface TokenMetric {
  price?: number
  change1d?: number
  sparkline?: number[]
}

interface TokenMetricMaps {
  byKey: Map<string, TokenMetric>
  bySymbol: Map<string, TokenMetric>
}

function buildTokenMetrics(tokens: readonly MultichainToken[]): TokenMetricMaps {
  const byKey = new Map<string, TokenMetric>()
  const bySymbol = new Map<string, TokenMetric>()
  for (const token of tokens) {
    const stats = token.stats
    if (!stats) {
      continue
    }
    const history = stats.priceHistory1d
    const metric: TokenMetric = {
      price: stats.price,
      change1d: stats.priceChange1d,
      sparkline: history && history.length > 0 ? history.map((point) => point.value) : undefined,
    }
    for (const chainToken of token.chainTokens) {
      if (chainToken.address) {
        byKey.set(`${chainToken.chainId}:${chainToken.address.toLowerCase()}`, metric)
      }
    }
    if (token.symbol) {
      bySymbol.set(token.symbol.toUpperCase(), metric)
    }
  }
  return { byKey, bySymbol }
}

function lookupMetric(token: TokenStats | undefined, maps: TokenMetricMaps): TokenMetric | undefined {
  if (!token) {
    return undefined
  }
  const chainId = supportedChainIdFromGQLChain(token.chain as GraphQLApi.Chain)
  if (chainId !== undefined && token.address) {
    const byKey = maps.byKey.get(`${chainId}:${token.address.toLowerCase()}`)
    if (byKey) {
      return byKey
    }
  }
  if (token.symbol) {
    return maps.bySymbol.get(token.symbol.toUpperCase())
  }
  return undefined
}

/* --------------------------------------------------- protocol-stats series */

interface TimestampedLike {
  timestamp: number | bigint | string
  value: number | bigint | string
}

/** Merge two timestamped protocol series (v2 + v3) into a single value series (oldest → newest). */
function mergeSeries(a?: readonly TimestampedLike[], b?: readonly TimestampedLike[]): number[] | undefined {
  const sum = new Map<number, number>()
  for (const point of a ?? []) {
    const ts = Number(point.timestamp)
    sum.set(ts, (sum.get(ts) ?? 0) + Number(point.value))
  }
  for (const point of b ?? []) {
    const ts = Number(point.timestamp)
    sum.set(ts, (sum.get(ts) ?? 0) + Number(point.value))
  }
  if (sum.size < 2) {
    return undefined
  }
  return [...sum.entries()].sort((x, y) => x[0] - y[0]).map((entry) => entry[1])
}

/* ------------------------------------------------------------- ticker strip */

interface Ticker {
  symbol: string
  price?: number
  change1d?: number
  /** Real token address + chain (from the token's first chainToken) → swap deep-link. */
  address?: string
  chainId?: number
}

const TICKER_COUNT = 10

function buildTickers(tokens: readonly MultichainToken[]): Ticker[] {
  return tokens
    .filter((token) => token.symbol !== '' && typeof token.stats?.price === 'number')
    .slice(0, TICKER_COUNT)
    .map((token) => {
      const chainToken = token.chainTokens[0]
      return {
        symbol: token.symbol,
        price: token.stats?.price,
        change1d: token.stats?.priceChange1d,
        address: chainToken?.address || undefined,
        chainId: chainToken?.chainId,
      }
    })
}

/* ----------------------------------------------- pool → presentation (real) */

interface MarketRowModel {
  key: string
  rank: number
  detailPath?: string
  currency0?: Currency
  currency1?: Currency
  symbol0: string
  symbol1: string
  tvl: number
  volume24h: number
  aprText: string
  change1d?: number
  sparkline?: number[]
}

/** Stablecoins whose price hovers at ~$1 (flat chart) — avoid featuring in the hero card. */
const STABLE_SYMBOLS = new Set([
  'USDC',
  'USDT',
  'USDT0',
  'DAI',
  'USDS',
  'USDG',
  'FRAX',
  'TUSD',
  'USDP',
  'GUSD',
  'LUSD',
  'PYUSD',
  'USDB',
  'USDE',
  'CRVUSD',
])

function isStableSymbol(symbol: string | undefined): boolean {
  return Boolean(symbol && STABLE_SYMBOLS.has(symbol.toUpperCase()))
}

function buildMarketRow(pool: PoolStat, index: number, maps: TokenMetricMaps): MarketRowModel {
  const chainId: UniverseChainId | undefined = supportedChainIdFromGQLChain(pool.token0?.chain as GraphQLApi.Chain)
  const displayToken0 = chainId !== undefined && pool.token0 ? unwrapToken(chainId, pool.token0) : pool.token0
  const displayToken1 = chainId !== undefined && pool.token1 ? unwrapToken(chainId, pool.token1) : pool.token1
  const currency0 = displayToken0 ? gqlToCurrency(displayToken0) : undefined
  const currency1 = displayToken1 ? gqlToCurrency(displayToken1) : undefined
  const metric = lookupMetric(pool.token0, maps)

  return {
    key: pool.id ? `${pool.id}-${index}` : `row-${index}`,
    rank: index + 1,
    detailPath: chainId !== undefined && pool.id ? `/markets/${chainId}-${pool.id}` : undefined,
    currency0,
    currency1,
    symbol0: currency0?.symbol ?? pool.token0?.symbol ?? '—',
    symbol1: currency1?.symbol ?? pool.token1?.symbol ?? '—',
    tvl: pool.totalLiquidity?.value ?? 0,
    volume24h: pool.volume1Day?.value ?? 0,
    aprText: pool.apr ? `${pool.apr.toFixed(1)}%` : '—',
    change1d: metric?.change1d,
    sparkline: metric?.sparkline,
  }
}

/* =========================================================================== */
/* Primitives                                                                  */
/* =========================================================================== */

/** HookSwap hexagon + open hook-ring logo (inline SVG, neon on dark). */
function Logo({ size = 28 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: 'visible', flexShrink: 0 }} aria-hidden="true">
      <path
        d="M24 3.5 L41.8 13.75 L41.8 34.25 L24 44.5 L6.2 34.25 L6.2 13.75 Z"
        fill="none"
        stroke={terminalColors.ink}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      <circle
        cx="24"
        cy="25"
        r="7.2"
        fill="none"
        stroke={terminalColors.brandGreen}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeDasharray="33 13"
        transform="rotate(118 24 25)"
        style={{ filter: `drop-shadow(0 0 3px ${terminalColors.brandGreen})` }}
      />
    </svg>
  )
}

function Wordmark({ size = 19 }: { size?: number }): JSX.Element {
  return (
    <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: size, letterSpacing: '-0.02em', color: terminalColors.ink }}>
      Hook<span style={{ color: terminalColors.brandGreen }}>Swap</span>
    </span>
  )
}

/* ------------------------------------------------------------------ header */

interface NavChildLink {
  label: string
  onClick: () => void
}

interface NavLink {
  label: string
  onClick: () => void
  active?: boolean
  /** Render a trailing ↗ arrow; onClick opens a new tab. */
  external?: boolean
  /** Dropdown items — presence shows a ▾ caret and a hover panel. */
  children?: NavChildLink[]
}

function Header({
  navLinks,
  chainId,
  walletLabel,
  onSearch,
  onConnect,
  onChainClick,
  onHome,
  compact,
  tight,
  padX,
}: {
  navLinks: NavLink[]
  chainId?: UniverseChainId
  walletLabel?: string
  onSearch: () => void
  onConnect: () => void
  onChainClick: () => void
  onHome: () => void
  /** Collapse the nav/search/chain into a hamburger menu (tablet + mobile). */
  compact: boolean
  /** Narrow desktop: keep the full nav but collapse the search field to an icon so it fits. */
  tight?: boolean
  padX: number
}): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  // Which desktop nav section's hover dropdown is open (keyed by label; null = none).
  const [openNav, setOpenNav] = useState<string | null>(null)

  const logoButton = (
    <button
      type="button"
      onClick={onHome}
      aria-label="HookSwap home"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <Logo />
      <Wordmark />
    </button>
  )

  if (compact) {
    return (
      <div style={{ position: 'relative', background: terminalColors.bgApp, borderBottom: `1px solid ${terminalColors.line2}`, zIndex: 20 }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: `0 ${padX}px` }}>
          {logoButton}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 36,
              background: terminalColors.bg,
              border: `1px solid ${terminalColors.line}`,
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={terminalColors.ink} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
        {menuOpen ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 64,
              background: terminalColors.bgApp,
              borderBottom: `1px solid ${terminalColors.line2}`,
              padding: `12px ${padX}px 18px`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: `0 24px 40px -24px rgba(0,0,0,0.6)`,
            }}
          >
            {navLinks.map((link) => (
              <div key={link.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  type="button"
                  onClick={() => {
                    link.onClick()
                    setMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '11px 4px',
                    fontFamily: SANS,
                    fontSize: 15,
                    fontWeight: link.active ? 600 : 400,
                    color: link.active ? terminalColors.ink : terminalColors.ink2,
                  }}
                >
                  {link.label}
                  {link.external ? (
                    <span aria-hidden style={{ fontSize: 12, color: terminalColors.ink3Alt, lineHeight: 1 }}>
                      ↗
                    </span>
                  ) : null}
                </button>
                {link.children?.map((child) => (
                  <button
                    key={child.label}
                    type="button"
                    onClick={() => {
                      child.onClick()
                      setMenuOpen(false)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '9px 4px 9px 18px',
                      fontFamily: SANS,
                      fontSize: 13.5,
                      fontWeight: 400,
                      color: terminalColors.ink3,
                    }}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  onSearch()
                  setMenuOpen(false)
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  height: 40,
                  background: terminalColors.bg,
                  border: `1px solid ${terminalColors.line}`,
                  borderRadius: 10,
                  padding: '0 13px',
                  cursor: 'pointer',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={terminalColors.faint} strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <span style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.faint }}>Search…</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChainClick()
                  setMenuOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  height: 40,
                  background: terminalColors.bg,
                  border: `1px solid ${terminalColors.line}`,
                  borderRadius: 10,
                  padding: '0 12px',
                  cursor: 'pointer',
                }}
              >
                {chainId !== undefined ? <ChainLogo chainId={chainId} size={16} /> : null}
                <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: terminalColors.ink }}>
                  {chainId !== undefined ? getChainLabel(chainId) : 'Network'}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                onConnect()
                setMenuOpen(false)
              }}
              style={{
                marginTop: 6,
                height: 42,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: terminalColors.brandGreen,
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                boxShadow: `0 0 18px -6px ${terminalColors.brandGreen}`,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: terminalColors.btnInk }}>
                {walletLabel ?? 'Connect'}
              </span>
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      style={{
        height: 64,
        background: terminalColors.bgApp,
        borderBottom: `1px solid ${terminalColors.line2}`,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: `0 ${padX}px`,
        // Never wrap: a wrapped header row overflows its fixed 64px height and
        // overlaps the banner below. The `compact` hamburger (isCompactHeader)
        // kicks in before the full nav would overflow, so nowrap alone is enough —
        // do NOT add overflow:hidden here, it clips the nav dropdown panels (which
        // are position:absolute and intentionally extend below this row).
        flexWrap: 'nowrap',
      }}
    >
      {logoButton}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 14 }}>
        {navLinks.map((link) => {
          const hasDropdown = Boolean(link.children && link.children.length > 0)
          const isOpen = openNav === link.label
          return (
            <div
              key={link.label}
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => hasDropdown && setOpenNav(link.label)}
              onMouseLeave={() => hasDropdown && setOpenNav((prev) => (prev === link.label ? null : prev))}
            >
              <button
                type="button"
                onClick={link.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: SANS,
                  fontSize: 13.5,
                  fontWeight: link.active ? 600 : 400,
                  color: link.active ? terminalColors.ink : terminalColors.ink2,
                }}
              >
                {link.label}
                {link.external ? (
                  <span aria-hidden style={{ fontSize: 11, color: terminalColors.ink3Alt, lineHeight: 1 }}>
                    ↗
                  </span>
                ) : hasDropdown ? (
                  <svg
                    width={9}
                    height={9}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={terminalColors.ink3Alt}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                ) : null}
              </button>

              {hasDropdown && isOpen ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 26,
                    left: -10,
                    minWidth: 180,
                    background: terminalColors.bg,
                    border: `1px solid ${terminalColors.line}`,
                    borderRadius: 12,
                    boxShadow: '0 14px 34px -12px rgba(11,15,20,.45)',
                    padding: 6,
                    zIndex: 41,
                    fontFamily: SANS,
                  }}
                >
                  {link.children?.map((child) => (
                    <button
                      key={child.label}
                      type="button"
                      onClick={() => {
                        setOpenNav(null)
                        child.onClick()
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '9px 10px',
                        borderRadius: 9,
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: 'transparent',
                        fontFamily: SANS,
                        fontSize: 13,
                        fontWeight: 500,
                        color: terminalColors.ink2,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = terminalColors.panel
                        e.currentTarget.style.color = terminalColors.ink
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = terminalColors.ink2
                      }}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={onSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            height: 36,
            justifyContent: 'center',
            background: terminalColors.bg,
            border: `1px solid ${terminalColors.line}`,
            borderRadius: 10,
            padding: tight ? 0 : '0 13px',
            width: tight ? 36 : 190,
            cursor: 'pointer',
          }}
          aria-label="Search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={terminalColors.faint} strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          {!tight && (
            <>
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.faint }}>Search…</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: MONO,
                  fontSize: 10.5,
                  color: terminalColors.faint,
                  background: terminalColors.bgApp,
                  border: `1px solid ${terminalColors.line}`,
                  padding: '2px 6px',
                  borderRadius: 5,
                }}
              >
                ⌘K
              </span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onChainClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            height: 36,
            background: terminalColors.bg,
            border: `1px solid ${terminalColors.line}`,
            borderRadius: 10,
            padding: '0 12px',
            cursor: 'pointer',
          }}
        >
          {chainId !== undefined ? <ChainLogo chainId={chainId} size={16} /> : null}
          <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: terminalColors.ink }}>
            {chainId !== undefined ? getChainLabel(chainId) : 'Network'}
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={terminalColors.faint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 1 }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onConnect}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 36,
            background: terminalColors.brandGreen,
            border: 'none',
            borderRadius: 10,
            padding: '0 15px',
            cursor: 'pointer',
            boxShadow: `0 0 18px -6px ${terminalColors.brandGreen}`,
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: terminalColors.btnInk }}>
            {walletLabel ?? 'Connect'}
          </span>
        </button>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- ticker */

function TickerTape({
  tickers,
  loading,
  error,
  fiatPrice,
  onSelect,
}: {
  tickers: Ticker[]
  loading: boolean
  error: boolean
  fiatPrice: (value: number | undefined) => string
  onSelect: (ticker: Ticker) => void
}): JSX.Element {
  const hasData = tickers.length > 0
  const loop = hasData ? [...tickers, ...tickers] : []
  return (
    <div
      style={{
        height: 40,
        background: terminalColors.bgApp,
        borderBottom: `1px solid ${terminalColors.line2}`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {loading && !hasData ? (
        <div style={{ display: 'flex', gap: 26, paddingLeft: 40 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ height: 11, width: 34, borderRadius: 4, background: terminalColors.line2 }} />
              <div style={{ height: 11, width: 52, borderRadius: 4, background: terminalColors.line3 }} />
            </div>
          ))}
        </div>
      ) : !hasData ? (
        <span style={{ fontFamily: MONO, fontSize: 12, color: terminalColors.faint, paddingLeft: 40 }}>
          {error
            ? 'Live token feed arrives with the HookSwap indexer.'
            : 'Live token feed goes live with the HookSwap indexer.'}
        </span>
      ) : (
        <div style={{ display: 'flex', gap: 26, whiteSpace: 'nowrap', animation: 'hs-tape 38s linear infinite', paddingLeft: 32 }}>
          {loop.map((ticker, i) => {
            const up = (ticker.change1d ?? 0) >= 0
            return (
              <button
                key={`${ticker.symbol}-${i}`}
                type="button"
                className="hs-ticker-item"
                onClick={() => onSelect(ticker)}
                aria-label={`Swap ${ticker.symbol}`}
                style={{ fontFamily: MONO, fontSize: 13 }}
              >
                <span style={{ color: terminalColors.faint }}>{ticker.symbol}</span>
                <span style={{ color: terminalColors.ink2 }}>{fiatPrice(ticker.price)}</span>
                <span
                  style={{
                    color:
                      ticker.change1d === undefined
                        ? terminalColors.faint
                        : up
                          ? terminalColors.greenUp
                          : terminalColors.redDown,
                  }}
                >
                  {ticker.change1d !== undefined ? formatSignedPct(ticker.change1d) : '—'}
                </span>
              </button>
            )
          })}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 90,
          background: `linear-gradient(90deg, transparent, ${terminalColors.bgApp})`,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

/* --------------------------------------------------------------- stat card */

function StatCard({
  label,
  value,
  delta,
  series,
  loading,
}: {
  label: string
  value?: string
  delta?: { text: string; up: boolean }
  series?: number[]
  loading: boolean
}): JSX.Element {
  return (
    <div
      style={{
        background: terminalColors.bg,
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 13,
        padding: '13px 15px',
        minWidth: 0,
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.faint }}>{label}</div>
      {loading || value === undefined ? (
        <div style={{ height: 22, width: 72, borderRadius: 4, background: terminalColors.line2, marginTop: 6 }} />
      ) : (
        <>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 20,
              fontWeight: 600,
              color: terminalColors.ink,
              marginTop: 3,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 }}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: delta ? (delta.up ? terminalColors.greenUp : terminalColors.redDown) : terminalColors.faint,
              }}
            >
              {delta ? delta.text : ''}
            </span>
            {series && series.length >= 2 ? (
              <SparklineCell data={series} direction="up" width={70} height={24} strokeWidth={2.4} />
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

/* --------------------------------------------------- featured price chart */

/** Real close-series line+area with a live last-price marker (no fabricated candles). */
function PriceChart({ closes, fiatPrice }: { closes?: number[]; fiatPrice: (v: number | undefined) => string }): JSX.Element {
  const VB_W = 640
  const VB_H = 240
  const geometry = useMemo(() => {
    if (!closes || closes.length < 2) {
      return undefined
    }
    const min = Math.min(...closes)
    const max = Math.max(...closes)
    const span = max - min || 1
    const coords = closes.map((value, i) => {
      const x = (i / (closes.length - 1)) * VB_W
      const y = VB_H - 8 - ((value - min) / span) * (VB_H - 16)
      return { x, y }
    })
    const last = coords[coords.length - 1]
    return {
      line: coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' '),
      area: `0,${VB_H} ${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')} ${VB_W},${VB_H}`,
      lastY: last.y,
      lastValue: closes[closes.length - 1],
      min,
      max,
    }
  }, [closes])

  if (!geometry) {
    return (
      <div
        style={{
          height: 250,
          background: terminalColors.panel,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 24px',
          fontFamily: MONO,
          fontSize: 12,
          color: terminalColors.faint,
        }}
      >
        Live chart — price history arrives with the HookSwap indexer.
      </div>
    )
  }

  const lastPct = (geometry.lastY / VB_H) * 100
  return (
    <div style={{ position: 'relative', height: 250, background: terminalColors.panel }}>
      <svg width="100%" height={250} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" fill="none" aria-hidden="true" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="hs-hero-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={terminalColors.greenUp} stopOpacity="0.24" />
            <stop offset="100%" stopColor={terminalColors.greenUp} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={geometry.area} fill="url(#hs-hero-area)" />
        <polyline points={geometry.line} fill="none" stroke={terminalColors.greenUp} strokeWidth={2.4} />
      </svg>
      {/* Live last-price line + tag */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: `${lastPct}%`, height: 1, background: terminalColors.brandGreen, opacity: 0.4 }} />
      <div
        style={{
          position: 'absolute',
          right: 8,
          top: `calc(${lastPct}% - 9px)`,
          fontFamily: MONO,
          fontSize: 10,
          color: terminalColors.btnInk,
          background: terminalColors.brandGreen,
          padding: '1px 5px',
          borderRadius: 3,
        }}
      >
        {fiatPrice(geometry.lastValue)}
      </div>
    </div>
  )
}

/* =========================================================================== */
/* Body                                                                        */
/* =========================================================================== */

function LandingScreenBody(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { chains, defaultChainId } = useEnabledChains()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()

  // Responsive breakpoints (inline styles can't do media queries).
  const viewportWidth = useViewportWidth()
  const isMobile = viewportWidth <= 640
  const isCompactNav = viewportWidth <= 1024
  // Header responsive (kept separate from isCompactNav, which drives feature-grid columns):
  //  - > 1280px: full nav + full search field.
  //  - 940–1280px: full nav stays (desktop!), but the 190px search field collapses to a
  //    36px icon so the row fits without overflowing/overlapping the banner (isTightHeader).
  //  - <= 940px: collapse to the hamburger menu (tablet/mobile).
  const isCompactHeader = viewportWidth <= 940
  const isTightHeader = viewportWidth <= 1280
  const padX = isMobile ? 20 : 40
  // Feature grids: each section is ONE full, even row on desktop (columns = its
  // own card count), collapsing to 2 cols on tablet and 1 on mobile — so no
  // section ever leaves a ragged trailing gap or an orphaned card.
  const featureCols = (count: number): string =>
    isMobile ? '1fr' : isCompactNav ? 'repeat(2, minmax(0, 1fr))' : `repeat(${count}, minmax(0, 1fr))`

  // Capture ?ref=<code> for referral attribution (chrome normally does this).
  useCaptureRef()

  // ⌘K command palette (chrome normally owns this) — self-hosted here.
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

  /* -------- live data -------- */
  const { topTokens, isLoading: tokensLoading, isError: tokensError } = useListTokens(undefined)
  const {
    topPools,
    isLoading: poolsLoading,
    isError: poolsError,
  } = useTopPools({ sortState: { sortBy: PoolSortFields.Volume24h, sortDirection: OrderDirection.Desc } })
  const tvlStats = useDailyTVLWithChange()
  const volumeStats = use24hProtocolVolume()
  const protocolStats = useProtocolStats()

  const metricMaps = useMemo(() => buildTokenMetrics(topTokens), [topTokens])
  const tickers = useMemo(() => buildTickers(topTokens), [topTokens])

  const marketRows = useMemo(
    () => (topPools ? topPools.slice(0, 6).map((pool, i) => buildMarketRow(pool, i, metricMaps)) : undefined),
    [topPools, metricMaps],
  )

  // Real protocol-stats series for the hero stat sparklines (undefined → no spark).
  const tvlSeries = useMemo(
    () => mergeSeries(protocolStats.data?.dailyProtocolTvl?.v2, protocolStats.data?.dailyProtocolTvl?.v3),
    [protocolStats.data],
  )
  const volumeSeries = useMemo(
    () =>
      mergeSeries(
        protocolStats.data?.historicalProtocolVolume?.Month?.v2,
        protocolStats.data?.historicalProtocolVolume?.Month?.v3,
      ),
    [protocolStats.data],
  )

  // Featured pool for the hero chart = highest-volume pool with a non-stable base
  // (so the real price series shows movement, not a flat $1 line).
  const featured = useMemo(() => {
    if (!topPools || topPools.length === 0) {
      return undefined
    }
    return topPools.find((pool) => !isStableSymbol(pool.token0?.symbol)) ?? topPools[0]
  }, [topPools])
  const featuredRow = useMemo(() => (featured ? buildMarketRow(featured, 0, metricMaps) : undefined), [featured, metricMaps])
  const featuredMetric = useMemo(() => (featured ? lookupMetric(featured.token0, metricMaps) : undefined), [featured, metricMaps])

  // Live wallet activity (connected wallet only) → real rows or honest empty.
  const address = account.address
  const activity = useActivityData({
    evmOwner: address,
    ownerAddresses: address ? [address] : [],
    fiatOnRampParams: undefined,
    skip: !address,
  })
  const activityRows = useMemo(() => {
    if (!activity.sectionData) {
      return undefined
    }
    const out: { id: string; badge: string; badgeColor: string; title: string; time: string }[] = []
    for (const entry of activity.sectionData) {
      if (isSectionHeader(entry) || isLoadingItem(entry)) {
        continue
      }
      const tx = entry as TransactionDetails
      const type = tx.typeInfo.type
      let badge = 'TXN'
      let badgeColor: string = terminalColors.greenUp
      if (type === TransactionType.Swap || type === TransactionType.Bridge || type === TransactionType.Wrap) {
        badge = 'SWAP'
        badgeColor = terminalColors.greenUp
      } else if (
        type === TransactionType.LiquidityIncrease ||
        type === TransactionType.CreatePool ||
        type === TransactionType.CreatePair ||
        type === TransactionType.Deposit
      ) {
        badge = 'ADD'
        badgeColor = terminalColors.brandGreen
      } else if (type === TransactionType.LiquidityDecrease || type === TransactionType.Withdraw) {
        badge = 'RMV'
        badgeColor = terminalColors.redDown
      } else if (type === TransactionType.Approve) {
        badge = 'APPR'
        badgeColor = terminalColors.ink2
      }
      out.push({
        id: tx.id,
        badge,
        badgeColor,
        title: getTransactionSummaryTitle(tx, t) ?? 'Transaction',
        time: formatRelativeTime(tx.addedTime),
      })
      if (out.length >= 6) {
        break
      }
    }
    return out
  }, [activity.sectionData, t])

  const fiatPrice = (value: number | undefined): string =>
    value !== undefined && value > 0 ? convertFiatAmountFormatted(value, NumberType.FiatTokenPrice) : '—'
  const fiatStats = (value: number | undefined): string =>
    value !== undefined && value > 0 ? convertFiatAmountFormatted(value, NumberType.FiatTokenStats) : '—'

  // Prefer Robinhood — the only chain the Terminal currently offers for trading
  // (see TERMINAL_LIVE_CHAIN_IDS in TerminalApp.tsx) — over whatever `defaultChainId`
  // ordering would otherwise surface, matching the in-app chain chip's default.
  const displayChainId =
    account.chainId ??
    (chains.includes(UniverseChainId.Robinhood) ? UniverseChainId.Robinhood : undefined) ??
    defaultChainId ??
    chains[0]

  // Clickable ticker → open the swap screen with this token pre-selected as output
  // (same deep-link pattern as the ⌘K command palette's goToSwap).
  const goToTickerSwap = (ticker: Ticker): void => {
    let path = '/swap'
    if (ticker.address && ticker.chainId !== undefined) {
      try {
        path += serializeSwapAddressesToURLParameters({
          outputTokenAddress: ticker.address,
          chainId: ticker.chainId as UniverseChainId,
        })
      } catch {
        path = '/swap'
      }
    }
    navigate(path)
  }

  const navLinks: NavLink[] = [
    {
      label: 'Trade',
      onClick: () => navigate('/swap'),
      children: [
        { label: 'Swap', onClick: () => navigate('/swap') },
        { label: 'Limit', onClick: () => navigate('/terminal/limit') },
        { label: 'Widget builder', onClick: () => navigate('/widget') },
      ],
    },
    { label: 'Markets', onClick: () => navigate('/markets') },
    {
      label: 'Earn',
      onClick: () => navigate('/pools/new'),
      children: [
        { label: 'Pools', onClick: () => navigate('/pools/new') },
        { label: 'Positions', onClick: () => navigate('/positions') },
        { label: 'Locker', onClick: () => navigate('/locker') },
        { label: 'Referrals', onClick: () => navigate('/referrals') },
      ],
    },
    {
      label: 'Portfolio',
      onClick: () => navigate('/portfolio'),
      children: [
        { label: 'Overview', onClick: () => navigate('/portfolio') },
        { label: 'Activity', onClick: () => navigate('/activity') },
        { label: 'Analytics', onClick: () => navigate('/analytics') },
      ],
    },
    { label: 'Docs', external: true, onClick: () => window.open(HOOKSWAP_LINKS.docs, '_blank', 'noreferrer') },
    { label: 'Launchpad', external: true, onClick: () => window.open(HOOKSWAP_LINKS.launchpad, '_blank', 'noreferrer') },
  ]

  return (
    <div style={{ background: terminalColors.bgApp, minHeight: '100vh' }}>
      <style>{KEYFRAMES}</style>
      <div style={{ width: '100%', maxWidth: CONTENT_WIDTH, margin: '0 auto', background: terminalColors.bgApp, overflow: 'hidden' }}>
        <Header
          navLinks={navLinks}
          chainId={displayChainId}
          walletLabel={address ? shortenAddress(address) : undefined}
          onSearch={() => setPaletteOpen(true)}
          onConnect={() => accountDrawer.open()}
          onChainClick={() => accountDrawer.open()}
          onHome={() => {
            navigate('/')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          compact={isCompactHeader}
          tight={isTightHeader}
          padX={padX}
        />

        <TickerTape
          tickers={tickers}
          loading={tokensLoading}
          error={tokensError}
          fiatPrice={fiatPrice}
          onSelect={goToTickerSwap}
        />

        {/* ---------------------------------------------------------- HERO */}
        <div style={{ padding: `44px ${padX}px 30px`, display: 'flex', gap: 28, position: 'relative', flexWrap: 'wrap' }}>
          <div
            style={{
              position: 'absolute',
              right: 20,
              top: -10,
              width: 560,
              height: 360,
              background: `radial-gradient(circle at 70% 30%, ${terminalColors.brandGreen}26 0%, transparent 60%)`,
              pointerEvents: 'none',
            }}
          />
          {/* Hero copy + stats */}
          <div style={{ flex: '1 1 440px', minWidth: 0, position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: terminalColors.greenBg,
                border: `1px solid ${terminalColors.greenBorder}`,
                borderRadius: 999,
                padding: '6px 13px',
                fontFamily: MONO,
                fontSize: 11.5,
                fontWeight: 600,
                color: terminalColors.brandGreen,
                letterSpacing: '0.03em',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: terminalColors.brandGreen,
                  boxShadow: `0 0 6px ${terminalColors.brandGreen}`,
                  animation: 'hs-blip 2s ease-in-out infinite',
                }}
              />
              V2 · V3 · MULTI-CHAIN DEX
            </div>
            <h1
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: isMobile ? 34 : 52,
                lineHeight: 1.03,
                letterSpacing: '-0.03em',
                color: terminalColors.ink,
                margin: '18px 0 0',
              }}
            >
              HookSwap.
              <br />A DEX in <span style={{ color: terminalColors.brandGreen }}>terminal</span> form.
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 15.5, color: terminalColors.ink2, lineHeight: 1.55, margin: '16px 0 0', maxWidth: 440 }}>
              Depth charts, live routing, and concentrated liquidity across every HookSwap chain — pro tooling wired into
              HookSwap&apos;s own v2 + v3 deployments.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/swap')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 9,
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 600,
                  color: terminalColors.btnInk,
                  background: terminalColors.brandGreen,
                  padding: '13px 24px',
                  borderRadius: 11,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 0 24px -4px ${terminalColors.brandGreen}`,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={terminalColors.btnInk} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 4v14M7 18l-3-3M7 18l3-3M17 20V6M17 6l-3 3M17 6l3 3" />
                </svg>
                Open terminal
              </button>
              <button
                type="button"
                onClick={() => navigate('/markets')}
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 600,
                  color: terminalColors.ink,
                  background: terminalColors.bg,
                  border: `1px solid ${terminalColors.line}`,
                  padding: '13px 22px',
                  borderRadius: 11,
                  cursor: 'pointer',
                }}
              >
                Explore markets
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 28, maxWidth: 470 }}>
              <StatCard
                label="TVL"
                value={tvlStats.totalTVL !== undefined && tvlStats.totalTVL > 0 ? fiatStats(tvlStats.totalTVL) : undefined}
                delta={
                  tvlStats.totalChangePercent !== undefined && !Number.isNaN(tvlStats.totalChangePercent) && tvlStats.totalChangePercent !== 0
                    ? { text: formatSignedPct(tvlStats.totalChangePercent), up: tvlStats.totalChangePercent >= 0 }
                    : undefined
                }
                series={tvlSeries}
                loading={tvlStats.isLoading}
              />
              <StatCard
                label="24h vol"
                value={volumeStats.totalVolume !== undefined && volumeStats.totalVolume > 0 ? fiatStats(volumeStats.totalVolume) : undefined}
                delta={
                  volumeStats.totalChangePercent !== undefined && !Number.isNaN(volumeStats.totalChangePercent) && volumeStats.totalChangePercent !== 0
                    ? { text: formatSignedPct(volumeStats.totalChangePercent), up: volumeStats.totalChangePercent >= 0 }
                    : undefined
                }
                series={volumeSeries}
                loading={volumeStats.isLoading}
              />
              <StatCard
                label="Pools"
                value={topPools ? topPools.length.toLocaleString('en-US') : undefined}
                loading={poolsLoading && !topPools}
              />
            </div>
          </div>

          {/* Featured price card */}
          <div
            style={{
              width: 468,
              flexShrink: 0,
              background: terminalColors.bg,
              border: `1px solid ${terminalColors.line}`,
              borderRadius: 16,
              overflow: 'hidden',
              position: 'relative',
              maxWidth: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                <DoubleCurrencyLogo currencies={[featuredRow?.currency0, featuredRow?.currency1]} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: DISPLAY,
                      fontWeight: 600,
                      fontSize: 16,
                      color: terminalColors.ink,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {featuredRow ? `${featuredRow.symbol0} / ${featuredRow.symbol1}` : '—'}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.faint }}>
                    {featuredRow ? getChainLabel(account.chainId ?? displayChainId) : 'Live market'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: MONO, fontSize: 19, fontWeight: 600, color: terminalColors.ink }}>{fiatPrice(featuredMetric?.price)}</div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    color:
                      featuredMetric?.change1d === undefined
                        ? terminalColors.faint
                        : featuredMetric.change1d >= 0
                          ? terminalColors.greenUp
                          : terminalColors.redDown,
                  }}
                >
                  {featuredMetric?.change1d !== undefined ? formatSignedPct(featuredMetric.change1d) : '—'}
                </div>
              </div>
            </div>
            {/* Timeframe tabs — the featured series is 1d closes, so "1D" is the truthful active view. */}
            <div style={{ display: 'flex', gap: 5, padding: '0 18px 12px', alignItems: 'center' }}>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: terminalColors.ink, background: terminalColors.panel2, padding: '4px 9px', borderRadius: 6 }}>
                1D
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: terminalColors.faint }}>Live price</span>
            </div>
            {poolsLoading && !featured ? (
              <div style={{ height: 250, background: terminalColors.panel }} aria-busy="true" />
            ) : (
              <PriceChart closes={featuredMetric?.sparkline} fiatPrice={fiatPrice} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${terminalColors.line}` }}>
              <div style={{ padding: '11px 14px', borderRight: `1px solid ${terminalColors.line}` }}>
                <div style={{ fontFamily: SANS, fontSize: 10.5, color: terminalColors.faint }}>Liquidity</div>
                <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: terminalColors.ink, marginTop: 2 }}>
                  {featuredRow ? fiatStats(featuredRow.tvl) : '—'}
                </div>
              </div>
              <div style={{ padding: '11px 14px', borderRight: `1px solid ${terminalColors.line}` }}>
                <div style={{ fontFamily: SANS, fontSize: 10.5, color: terminalColors.faint }}>24h vol</div>
                <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: terminalColors.ink, marginTop: 2 }}>
                  {featuredRow ? fiatStats(featuredRow.volume24h) : '—'}
                </div>
              </div>
              <div style={{ padding: '11px 14px' }}>
                <div style={{ fontFamily: SANS, fontSize: 10.5, color: terminalColors.faint }}>APR</div>
                <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: terminalColors.brandGreen, marginTop: 2 }}>
                  {featuredRow ? featuredRow.aprText : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------- ORDER BOOK + DEPTH */}
        <div style={{ padding: `6px ${padX}px 34px`, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: 0, background: terminalColors.bg, border: `1px solid ${terminalColors.line}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 14, color: terminalColors.ink }}>Order book</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint }}>AMM</span>
            </div>
            <div
              style={{
                minHeight: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontFamily: SANS,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: terminalColors.ink3Alt,
              }}
            >
              HookSwap pools are AMMs — a live order book streams with the HookSwap indexer.
            </div>
          </div>
          <div style={{ flex: '1.6 1 380px', minWidth: 0, background: terminalColors.bg, border: `1px solid ${terminalColors.line}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 14, color: terminalColors.ink }}>Liquidity depth</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint }}>concentrated ±2%</span>
            </div>
            <div
              style={{
                minHeight: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontFamily: SANS,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: terminalColors.ink3Alt,
              }}
            >
              Live liquidity-depth curves arrive with the HookSwap indexer feed.
            </div>
          </div>
        </div>

        {/* --------------------------------------------------- TOP MARKETS */}
        <div style={{ padding: `0 ${padX}px 40px` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: terminalColors.ink }}>Top markets</span>
            <button
              type="button"
              onClick={() => navigate('/markets')}
              style={{
                fontFamily: MONO,
                fontSize: 11.5,
                fontWeight: 600,
                color: terminalColors.ink,
                background: terminalColors.panel2,
                border: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              All markets →
            </button>
          </div>
          <div style={{ overflowX: 'auto', minWidth: 0 }}>
            <div style={{ minWidth: 680, background: terminalColors.bg, border: `1px solid ${terminalColors.line}`, borderRadius: 14, overflow: 'hidden' }}>
              {/* Header — NO Hook column (hooks removed) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 2.4fr 1fr 1fr 0.8fr 150px',
                  gap: 12,
                  padding: '11px 20px',
                  borderBottom: `1px solid ${terminalColors.line}`,
                  fontFamily: MONO,
                  fontSize: 10.5,
                  color: terminalColors.faint,
                  letterSpacing: '0.04em',
                }}
              >
                <span>#</span>
                <span>POOL</span>
                <span style={{ textAlign: 'right' }}>TVL</span>
                <span style={{ textAlign: 'right' }}>24H VOL</span>
                <span style={{ textAlign: 'right' }}>APR</span>
                <span style={{ textAlign: 'right' }}>TREND</span>
              </div>
              {poolsError ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: SANS, fontSize: 13, color: terminalColors.ink3Alt }}>
                  Live markets arrive with the HookSwap indexer.
                </div>
              ) : marketRows && marketRows.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: SANS, fontSize: 13, color: terminalColors.ink3Alt }}>
                  No pools indexed yet — markets appear once the HookSwap indexer is live.
                </div>
              ) : marketRows ? (
                marketRows.map((row) => {
                  const up = (row.change1d ?? 0) >= 0
                  return (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => (row.detailPath ? navigate(row.detailPath) : navigate('/markets'))}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 2.4fr 1fr 1fr 0.8fr 150px',
                        gap: 12,
                        alignItems: 'center',
                        padding: '13px 20px',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `1px solid ${terminalColors.line3}`,
                        cursor: row.detailPath ? 'pointer' : 'default',
                      }}
                    >
                      <span style={{ fontFamily: MONO, fontSize: 12, color: terminalColors.faint }}>{row.rank}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <DoubleCurrencyLogo currencies={[row.currency0, row.currency1]} size={26} />
                        <span
                          style={{
                            fontFamily: SANS,
                            fontWeight: 600,
                            fontSize: 13.5,
                            color: terminalColors.ink,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {row.symbol0} / {row.symbol1}
                        </span>
                      </span>
                      <span style={{ textAlign: 'right', fontFamily: MONO, fontSize: 13, color: terminalColors.ink }}>{fiatStats(row.tvl)}</span>
                      <span style={{ textAlign: 'right', fontFamily: MONO, fontSize: 13, color: terminalColors.ink2 }}>{fiatStats(row.volume24h)}</span>
                      <span style={{ textAlign: 'right', fontFamily: MONO, fontSize: 13, color: terminalColors.brandGreen }}>{row.aprText}</span>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 11,
                            color: row.change1d === undefined ? terminalColors.faint : up ? terminalColors.greenUp : terminalColors.redDown,
                          }}
                        >
                          {row.change1d !== undefined ? formatSignedPct(row.change1d) : '—'}
                        </span>
                        {row.sparkline && row.sparkline.length >= 2 ? (
                          <SparklineCell data={row.sparkline} width={64} height={22} strokeWidth={2.2} />
                        ) : (
                          <span style={{ width: 64 }} />
                        )}
                      </span>
                    </button>
                  )
                })
              ) : (
                Array.from({ length: 5 }, (_, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 2.4fr 1fr 1fr 0.8fr 150px', gap: 12, alignItems: 'center', padding: '13px 20px', borderBottom: `1px solid ${terminalColors.line3}` }}>
                    <div style={{ height: 12, width: 12, borderRadius: 4, background: terminalColors.line2 }} />
                    <div style={{ height: 14, width: '55%', borderRadius: 4, background: terminalColors.line2 }} />
                    <div style={{ height: 12, borderRadius: 4, background: terminalColors.line3, justifySelf: 'end', width: 50 }} />
                    <div style={{ height: 12, borderRadius: 4, background: terminalColors.line3, justifySelf: 'end', width: 50 }} />
                    <div style={{ height: 12, borderRadius: 4, background: terminalColors.line3, justifySelf: 'end', width: 40 }} />
                    <div style={{ height: 22, borderRadius: 4, background: terminalColors.line3, justifySelf: 'end', width: 64 }} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- FEATURE GRID */}
        <div style={{ padding: `14px ${padX}px 20px`, borderTop: `1px solid ${terminalColors.line2}` }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', color: terminalColors.ink, marginTop: 26 }}>
            Everything in one terminal
          </div>
          <div style={{ fontFamily: SANS, fontSize: 14.5, color: terminalColors.ink2, marginTop: 6 }}>
            Trade, earn, and track across HookSwap&apos;s own v2 + v3 deployments on every chain.
          </div>

          {FEATURE_GROUPS.map((group) => (
            <div key={group.label}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint, letterSpacing: '0.08em', margin: '26px 0 12px' }}>
                {group.label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: featureCols(group.features.length), gap: 14 }}>
                {group.features.map((feature) => (
                  <button
                    key={feature.title}
                    type="button"
                    onClick={() => navigate(feature.path)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      background: terminalColors.bg,
                      border: `1px solid ${terminalColors.line}`,
                      borderRadius: 14,
                      padding: 20,
                      cursor: 'pointer',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: terminalColors.greenBg,
                        border: `1px solid ${terminalColors.greenBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FeatureIcon name={feature.icon} />
                    </span>
                    <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: terminalColors.ink, marginTop: 14 }}>
                      {feature.title}
                    </span>
                    <span style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, lineHeight: 1.5, marginTop: 6, flex: 1 }}>
                      {feature.desc}
                    </span>
                    <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: terminalColors.brandGreen, marginTop: 14 }}>
                      {feature.cta} →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ---------------------------------------------- WHY HOOKSWAP (replaces hook marketplace) */}
        <div style={{ padding: `20px ${padX}px 20px` }}>
          <div style={{ marginTop: 20, marginBottom: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: MONO, fontSize: 11, color: terminalColors.brandGreen, letterSpacing: '0.06em' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: terminalColors.brandGreen, boxShadow: `0 0 6px ${terminalColors.brandGreen}` }} />
              WHY HOOKSWAP
            </div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', color: terminalColors.ink, marginTop: 8 }}>
              Every swap, best execution.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: featureCols(WHY_CARDS.length), gap: 14 }}>
            {WHY_CARDS.map((card) => (
              <div key={card.title} style={{ background: terminalColors.bg, border: `1px solid ${terminalColors.line}`, borderRadius: 14, padding: 18 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: terminalColors.greenBg,
                    border: `1px solid ${terminalColors.greenBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FeatureIcon name={card.icon} />
                </span>
                <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, color: terminalColors.ink, marginTop: 14 }}>{card.title}</div>
                <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2, lineHeight: 1.5, marginTop: 6 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* --------------------------------------------------- LIVE ACTIVITY */}
        <div style={{ padding: `24px ${padX}px 20px` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: terminalColors.ink }}>Live activity</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: MONO,
                fontSize: 11,
                color: terminalColors.brandGreen,
                background: terminalColors.greenBg,
                border: `1px solid ${terminalColors.greenBorder}`,
                padding: '3px 9px',
                borderRadius: 6,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: terminalColors.brandGreen, boxShadow: `0 0 6px ${terminalColors.brandGreen}`, animation: 'hs-blip 1.6s ease-in-out infinite' }} />
              {address ? 'streaming' : 'connect'}
            </span>
          </div>
          <div style={{ background: terminalColors.bg, border: `1px solid ${terminalColors.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {!address ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: SANS, fontSize: 13, color: terminalColors.ink3Alt, lineHeight: 1.5 }}>
                Connect a wallet to stream your live on-chain activity — swaps, liquidity, and transfers.
              </div>
            ) : activityRows && activityRows.length > 0 ? (
              activityRows.map((row) => (
                <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${terminalColors.line3}` }}>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: 600,
                      color: row.badgeColor,
                      background: terminalColors.panel,
                      border: `1px solid ${terminalColors.line}`,
                      padding: '4px 0',
                      borderRadius: 6,
                      textAlign: 'center',
                    }}
                  >
                    {row.badge}
                  </span>
                  <span style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.title}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.faint, textAlign: 'right' }}>{row.time}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: SANS, fontSize: 13, color: terminalColors.ink3Alt }}>
                No recent activity on this wallet yet.
              </div>
            )}
          </div>
        </div>

        {/* --------------------------------------------------------- CTA BAND */}
        <div style={{ padding: `30px ${padX}px 44px` }}>
          <div
            style={{
              position: 'relative',
              background: `linear-gradient(120deg, ${terminalColors.greenBg} 0%, ${terminalColors.bgApp} 60%)`,
              border: `1px solid ${terminalColors.greenBorder}`,
              borderRadius: 20,
              padding: isMobile ? '32px 22px' : '48px 44px',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', right: -60, top: -80, width: 420, height: 420, background: `radial-gradient(circle, ${terminalColors.brandGreen}2E 0%, transparent 62%)`, pointerEvents: 'none' }} />
            <svg width="300" height="300" viewBox="0 0 48 48" fill="none" style={{ position: 'absolute', right: 30, top: -40, overflow: 'visible', opacity: 0.5 }} aria-hidden="true">
              <path d="M24 3.5 L41.8 13.75 L41.8 34.25 L24 44.5 L6.2 34.25 L6.2 13.75 Z" fill="none" stroke={terminalColors.greenBorder} strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="24" cy="25" r="7.2" fill="none" stroke={terminalColors.brandGreen} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="33 13" transform="rotate(118 24 25)" />
            </svg>
            <div style={{ position: 'relative' }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: isMobile ? 27 : 38, letterSpacing: '-0.03em', color: terminalColors.ink, lineHeight: 1.05, maxWidth: 560 }}>
                Open the terminal.
                <br />
                Trade like a pro.
              </div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: terminalColors.ink2, marginTop: 12, maxWidth: 460 }}>
                MEV protection, limit orders, and concentrated liquidity on every HookSwap pool — self-custodied, on-chain, on
                every supported chain.
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate('/swap')}
                  style={{
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 600,
                    color: terminalColors.btnInk,
                    background: terminalColors.brandGreen,
                    border: 'none',
                    padding: '13px 26px',
                    borderRadius: 11,
                    cursor: 'pointer',
                    boxShadow: `0 0 26px -4px ${terminalColors.brandGreen}`,
                  }}
                >
                  Launch app
                </button>
                <a
                  href={HOOKSWAP_LINKS.docs}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 600,
                    color: terminalColors.ink,
                    background: terminalColors.bg,
                    border: `1px solid ${terminalColors.line}`,
                    padding: '13px 22px',
                    borderRadius: 11,
                    textDecoration: 'none',
                  }}
                >
                  Read the docs
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ FOOTER */}
        <div style={{ borderTop: `1px solid ${terminalColors.line2}`, padding: `36px ${padX}px 40px`, display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: '1.4 1 260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Logo size={26} />
              <Wordmark size={18} />
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.faint, lineHeight: 1.6, marginTop: 14, maxWidth: 280 }}>
              The multi-chain DEX terminal. Programmable liquidity, best execution, fully self-custodied.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <SocialChip href={HOOKSWAP_LINKS.x} label="X">
                <svg width="14" height="14" viewBox="0 0 24 24" fill={terminalColors.ink2} aria-hidden="true">
                  <path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5-6.5L5.4 22H2.2l8.1-9.3L1.6 2h6.9l4.5 6 5.9-6zm-1.2 18h1.7L7 3.9H5.2L17.7 20z" />
                </svg>
              </SocialChip>
              <SocialChip href={HOOKSWAP_LINKS.telegram} label="Telegram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill={terminalColors.ink2} aria-hidden="true">
                  <path d="M21.9 4.3l-3.3 15.6c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.1 13.6l-4.8-1.5c-1-.3-1-1 .2-1.5l18.8-7.2c.9-.3 1.6.2 1.4 1.9z" />
                </svg>
              </SocialChip>
              <SocialChip href={HOOKSWAP_LINKS.github} label="GitHub">
                <svg width="15" height="15" viewBox="0 0 24 24" fill={terminalColors.ink2} aria-hidden="true">
                  <path d="M12 2A10 10 0 002 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 015 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.4 4.7-4.6 4.9.3.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0022 12 10 10 0 0012 2z" />
                </svg>
              </SocialChip>
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.label} style={{ flex: '1 1 150px' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint, letterSpacing: '0.06em', marginBottom: 14 }}>{col.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {col.links.map((link) =>
                  link.external ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, textDecoration: 'none' }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => navigate(link.href)}
                      style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                    >
                      {link.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${terminalColors.line2}`, padding: `18px ${padX}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.faint }}>© 2026 HookSwap Labs · All rights reserved</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.faint }}>Terms</span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.faint }}>Privacy</span>
          </div>
        </div>

        {/* Honest provenance note (no fabricated values). */}
        <div style={{ padding: `0 ${padX}px 28px`, fontFamily: SANS, fontSize: 11, color: terminalColors.faint, lineHeight: 1.5 }}>
          Tickers &amp; the featured chart join the live token feed; TVL &amp; 24h volume are the live protocol-stats feed; top
          markets (including the seeded X&nbsp;Layer pool) come from the live pools feed; activity is your connected wallet&apos;s
          real history. Values with no live source render an honest &ldquo;—&rdquo;; the order book &amp; depth cards stay empty
          until the HookSwap indexer is live.
        </div>
      </div>

      {/* Self-hosted chrome bits (normally provided by TerminalChrome) */}
      <Portal>
        <AccountDrawer />
      </Portal>
      <TerminalCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}

/* =========================================================================== */
/* Static config (nav + copy — no data)                                        */
/* =========================================================================== */

type FeatureIconName = 'swap' | 'markets' | 'buy' | 'liquidity' | 'positions' | 'locker' | 'referral' | 'portfolio' | 'analytics' | 'activity' | 'shield' | 'route' | 'chain'

function FeatureIcon({ name }: { name: FeatureIconName }): JSX.Element {
  const common = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: terminalColors.brandGreen,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'swap':
      return (
        <svg {...common}>
          <path d="M7 4v14M7 18l-3-3M7 18l3-3M17 20V6M17 6l-3 3M17 6l3 3" />
        </svg>
      )
    case 'markets':
      return (
        <svg {...common}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      )
    case 'buy':
      return (
        <svg {...common}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      )
    case 'liquidity':
      return (
        <svg {...common}>
          <path d="M12 3c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z" />
        </svg>
      )
    case 'positions':
      return (
        <svg {...common}>
          <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />
        </svg>
      )
    case 'locker':
      return (
        <svg {...common}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      )
    case 'referral':
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
      )
    case 'portfolio':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 4v5" />
        </svg>
      )
    case 'analytics':
      return (
        <svg {...common}>
          <path d="M4 19l5-6 4 3 6-8" />
          <path d="M3 21h18" />
        </svg>
      )
    case 'activity':
      return (
        <svg {...common}>
          <path d="M3 12h4l3 8 4-16 3 8h4" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3z" />
        </svg>
      )
    case 'route':
      return (
        <svg {...common}>
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="5" r="2" />
          <path d="M8 19h6a4 4 0 004-4V9" />
        </svg>
      )
    case 'chain':
      return (
        <svg {...common}>
          <path d="M9 12a4 4 0 014-4h2a4 4 0 010 8h-1" />
          <path d="M15 12a4 4 0 01-4 4H9a4 4 0 010-8h1" />
        </svg>
      )
  }
}

interface FeatureModel {
  icon: FeatureIconName
  title: string
  desc: string
  cta: string
  path: string
}

const FEATURE_GROUPS: ReadonlyArray<{ label: string; features: readonly FeatureModel[] }> = [
  {
    label: 'TRADE',
    features: [
      { icon: 'swap', title: 'Swap', desc: 'Market & limit orders routed across v2 + v3 pools with MEV protection.', cta: 'Trade', path: '/swap' },
      { icon: 'markets', title: 'Markets', desc: 'Every pool ranked by TVL, volume, and APR with live price charts.', cta: 'Explore', path: '/markets' },
    ],
  },
  {
    label: 'EARN',
    features: [
      { icon: 'liquidity', title: 'Liquidity', desc: 'Provide concentrated (v3) or full-range (v2) liquidity and earn fees.', cta: 'Add', path: '/pools/new' },
      { icon: 'positions', title: 'Positions', desc: 'Manage open LP positions, collect fees, and adjust ranges.', cta: 'View', path: '/positions' },
      { icon: 'locker', title: 'Locker', desc: 'Lock LP tokens, ERC-20s, and v3 positions with a vesting schedule.', cta: 'Lock', path: '/locker' },
      { icon: 'referral', title: 'Referrals', desc: 'Share your code and earn a cut of every referred swap, on every chain.', cta: 'Get code', path: '/referrals' },
    ],
  },
  {
    label: 'TRACK',
    features: [
      { icon: 'portfolio', title: 'Portfolio', desc: 'Balances, open LP positions, PnL, and claimable fees in one view.', cta: 'View', path: '/portfolio' },
      { icon: 'analytics', title: 'Analytics', desc: 'Protocol-wide TVL, volume, and fee trends across every chain.', cta: 'Analyze', path: '/analytics' },
      { icon: 'activity', title: 'Activity', desc: 'Your full transaction history — swaps, liquidity, transfers.', cta: 'Open', path: '/activity' },
    ],
  },
]

/** v2/v3 value props (replaces the removed hook marketplace). Static copy, no data. */
const WHY_CARDS: ReadonlyArray<{ icon: FeatureIconName; title: string; desc: string }> = [
  { icon: 'route', title: 'Best execution', desc: 'Smart routing splits every trade across v2 + v3 pools for the best on-chain price.' },
  { icon: 'shield', title: 'MEV protection', desc: 'Private routing shields your swaps from front-running and sandwich attacks.' },
  { icon: 'liquidity', title: 'Concentrated liquidity', desc: 'Provide v3 range liquidity or full-range v2 and earn trading fees on every pool.' },
  { icon: 'chain', title: 'Multi-chain', desc: 'One terminal across every HookSwap deployment — self-custodied on each chain.' },
]

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

const FOOTER_COLUMNS: ReadonlyArray<{ label: string; links: readonly FooterLink[] }> = [
  {
    label: 'PROTOCOL',
    links: [
      { label: 'Swap', href: '/swap' },
      { label: 'Markets', href: '/markets' },
      { label: 'Liquidity', href: '/pools/new' },
      { label: 'Positions', href: '/positions' },
    ],
  },
  {
    label: 'DEVELOPERS',
    links: [
      { label: 'Documentation', href: HOOKSWAP_LINKS.docs, external: true },
      { label: 'GitHub', href: HOOKSWAP_LINKS.github, external: true },
      { label: 'Analytics', href: '/analytics' },
    ],
  },
  {
    label: 'COMMUNITY',
    links: [
      { label: 'X', href: HOOKSWAP_LINKS.x, external: true },
      { label: 'Telegram', href: HOOKSWAP_LINKS.telegram, external: true },
      { label: 'Trending', href: HOOKSWAP_LINKS.telegramTrending, external: true },
    ],
  },
]

function SocialChip({ href, label, children }: { href: string; label: string; children: ReactNode }): JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        background: terminalColors.bg,
        border: `1px solid ${terminalColors.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </a>
  )
}

/**
 * B1 Landing (standalone dark marketing page). Wraps the body in the same Explore
 * providers the legacy `/explore` page uses so the real token-list, pools, and
 * protocol-stats queries resolve.
 */
export function LandingScreen(): JSX.Element {
  return (
    <ExploreContextProvider>
      <ExploreTablesFilterStoreContextProvider>
        <LandingScreenBody />
      </ExploreTablesFilterStoreContextProvider>
    </ExploreContextProvider>
  )
}
