/**
 * HookSwap Terminal — B1 Landing.
 *
 * Pixel-perfect recreation of design handoff screen B1 (column 1b) — see
 * `design_handoff_hookswap_terminal/screenshots/B01-landing.png` and the B1 markup
 * in `design/HookSwap Redesign.dc.html`: a top market ticker strip; a hero (badge,
 * H1, subhead, primary + outline buttons, a 4-cell mono stat bar); a right
 * "terminal panel" card (pair header + area chart); and a marketplace grid (3×2).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ADAPTED FOR THE NO-HOOKS DECISION (locked 2026-07-04 — HookSwap ships v2 + v3
 * only). The original B1 is a hook-marketplace showcase; the LAYOUT / typography /
 * spacing / color are reproduced exactly but every hook-specific element is
 * replaced with a real, non-hook equivalent:
 *   • Hero badge  "UNISWAP V4 · HOOK ENGINE"          → "V2 · V3 · MULTI-CHAIN DEX".
 *   • Hero H1     "The hook-native DEX, in terminal…" → "HookSwap. A DEX in
 *                                                        terminal form."
 *   • Subhead     (hook/v4 prose)                     → depth-charts / routing /
 *                                                        concentrated-liquidity prose,
 *                                                        no hooks / no v4 mention.
 *   • Button 2    "Hook marketplace"                  → "Explore markets"
 *                                                        (→ /terminal/markets).
 *   • Stat cell   "Hooks 1,284"                       → "Pools" (real count) and the
 *                                                        "Pairs" cell → "Chains"
 *                                                        (real enabled-chain count),
 *                                                        so the 4-cell bar carries only
 *                                                        real, sourced values.
 *   • Section     "Hook marketplace" grid of hook     → "Top markets" grid of real
 *                 cards + category filter chips          pools (same card / chip /
 *                                                        footer style). The hook
 *                                                        category filter chip row is
 *                                                        OMITTED (no real market filter
 *                                                        to bind it to — an empty
 *                                                        control would be dead UI).
 * No hook nav, hook badge, hook chip, or "Hooks live" widget appears anywhere.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DATA POLICY (no mock data — handoff hard rule). Every rendered value is LIVE or
 * an honest empty/loading state; nothing is fabricated:
 *   • Ticker strip — LIVE token price + 24h % from the real token list
 *     (`useListTokens`, the same feed MarketsScreen uses). Top tokens that carry a
 *     price + 24h change, color-coded. While loading → skeleton pills.
 *   • Stat bar → TVL — LIVE `useDailyTVLWithChange().totalTVL` (+ 24h delta), the
 *     real protocol-stats layer the legacy `/explore` header uses.
 *   • Stat bar → 24h Volume — LIVE `use24hProtocolVolume().totalVolume` (+ delta).
 *   • Stat bar → Pools — LIVE count of the real top-pools feed (`useTopPools`).
 *   • Stat bar → Chains — LIVE `useEnabledChains().chains.length` (real enabled
 *     networks). Any cell whose source has not resolved renders an honest "—".
 *   • Right terminal card — LIVE: header = the top pool by 24h volume
 *     (`useTopPools`), its pair (real logos via DoubleCurrencyLogo), the base
 *     token's real current price + 24h change (joined from `useListTokens`); the
 *     area chart is the base token's real `priceHistory1d` close series (the same
 *     series that draws Markets sparklines). No series → honest empty state; NO
 *     synthesized chart.
 *   • Top-markets grid — LIVE from `useTopPools` (sorted by 24h volume): pair name +
 *     real logos, chain chip, 24h volume, TVL footer. Cards link to the real market
 *     detail route (`/terminal/markets/:chainId-:address`).
 *
 * LAYOUT: no horizontal overflow at any content width ≥768px — the ticker scrolls
 * inside its own `overflowX:auto` box; hero + right card are a wrapping flex row;
 * the stat bar and market grid are `auto-fit` grids that reflow/stack. Content area
 * = viewport − 226px rail; every container uses `minWidth:0` so it can shrink.
 */
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import type { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { ReactNode, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { supportedChainIdFromGQLChain } from '~/appGraphql/data/chainUtils'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'
import { gqlToCurrency, OrderDirection, unwrapToken } from '~/appGraphql/data/util'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { ExploreContextProvider } from '~/features/Explore/state'
import { use24hProtocolVolume, useDailyTVLWithChange } from '~/features/Explore/state/protocolStats'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { useTopPools } from '~/features/Explore/state/topPools/useTopPools'
import { NavIcon } from '~/terminal/components/NavIcon'
import type { TerminalNavIcon } from '~/terminal/config/screens'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import type { PoolStat } from '~/types/explore'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/** Signed percent, 1 decimal: 2.4 → "+2.4%", -3.1 → "-3.1%". */
function formatSignedPct(value: number): string {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(1)}%`
}

/* --------------------------------------------------- token-metric join (real) */

/** Per-token metrics joined onto tickers + the right-card header (from the token list). */
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

/* ------------------------------------------------------------- ticker strip */

interface Ticker {
  symbol: string
  price?: number
  change1d?: number
}

/** How many leading (volume-ranked) tokens to surface in the ticker strip. */
const TICKER_COUNT = 8

function buildTickers(tokens: readonly MultichainToken[]): Ticker[] {
  return tokens
    .filter((token) => token.symbol !== '' && typeof token.stats?.price === 'number')
    .slice(0, TICKER_COUNT)
    .map((token) => ({
      symbol: token.symbol,
      price: token.stats?.price,
      change1d: token.stats?.priceChange1d,
    }))
}

function TickerStrip({
  tickers,
  loading,
  fiatPrice,
}: {
  tickers: Ticker[]
  loading: boolean
  fiatPrice: (value: number | undefined) => string
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '10px 24px',
        borderBottom: `1px solid ${terminalColors.line2}`,
        background: terminalColors.bg,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      {loading && tickers.length === 0
        ? Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ height: 11, width: 34, borderRadius: 4, background: terminalColors.line2 }} />
              <div style={{ height: 11, width: 52, borderRadius: 4, background: terminalColors.line3 }} />
            </div>
          ))
        : tickers.map((ticker) => {
            const up = (ticker.change1d ?? 0) >= 0
            return (
              <div key={ticker.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: terminalColors.ink2 }}>
                  {ticker.symbol}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: terminalColors.ink }}>
                  {fiatPrice(ticker.price)}
                </span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11.5,
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
              </div>
            )
          })}
    </div>
  )
}

/* ----------------------------------------------------------------- stat bar */

function StatCell({
  label,
  value,
  delta,
  loading,
}: {
  label: string
  value?: string
  delta?: { text: string; up: boolean }
  loading: boolean
}): JSX.Element {
  return (
    <div style={{ padding: '4px 2px', minWidth: 0 }}>
      <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>{label}</div>
      {loading || value === undefined ? (
        <div style={{ height: 20, width: 66, borderRadius: 4, background: terminalColors.line2, marginTop: 6 }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: terminalColors.ink,
            }}
          >
            {value}
          </span>
          {delta ? (
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                color: delta.up ? terminalColors.greenUp : terminalColors.redDown,
              }}
            >
              {delta.text}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- area chart */

/** Real price-series area chart (line + gradient fill), drawn from a close series. */
function AreaChart({ closes, emptyMessage }: { closes?: number[]; emptyMessage: string }): JSX.Element {
  const VB_W = 1000
  const VB_H = 260
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
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return { line: coords.join(' '), area: `0,${VB_H} ${coords.join(' ')} ${VB_W},${VB_H}` }
  }, [closes])

  if (!geometry) {
    return (
      <div
        style={{
          height: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 20px',
          fontFamily: MONO,
          fontSize: 12,
          color: terminalColors.faint,
        }}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <svg
      width="100%"
      height={150}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="tm-landing-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={terminalColors.greenUp} stopOpacity="0.22" />
          <stop offset="100%" stopColor={terminalColors.greenUp} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={geometry.area} fill="url(#tm-landing-area)" />
      <polyline points={geometry.line} fill="none" stroke={terminalColors.greenUp} strokeWidth={2.4} />
    </svg>
  )
}

/* ----------------------------------------------- pool → presentation (real) */

interface MarketCardModel {
  key: string
  detailPath?: string
  currency0?: Currency
  currency1?: Currency
  symbol0: string
  symbol1: string
  chainLabel: string
  tvl: number
  volume24h: number
  token0?: TokenStats
}

/** Stablecoins whose price hovers at ~$1 — a flat/sawtooth chart, so avoid featuring them. */
const STABLE_SYMBOLS = new Set([
  'USDC',
  'USDT',
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

function buildMarketCard(pool: PoolStat, index: number): MarketCardModel {
  const chainId: UniverseChainId | undefined = supportedChainIdFromGQLChain(pool.token0?.chain as GraphQLApi.Chain)
  const displayToken0 = chainId !== undefined && pool.token0 ? unwrapToken(chainId, pool.token0) : pool.token0
  const displayToken1 = chainId !== undefined && pool.token1 ? unwrapToken(chainId, pool.token1) : pool.token1
  const currency0 = displayToken0 ? gqlToCurrency(displayToken0) : undefined
  const currency1 = displayToken1 ? gqlToCurrency(displayToken1) : undefined

  // Real market-detail route (chainId-address); only when both parts are valid.
  const detailPath = chainId !== undefined && pool.id ? `/terminal/markets/${chainId}-${pool.id}` : undefined

  return {
    key: pool.id ? `${pool.id}-${index}` : `row-${index}`,
    detailPath,
    currency0,
    currency1,
    symbol0: currency0?.symbol ?? pool.token0?.symbol ?? '—',
    symbol1: currency1?.symbol ?? pool.token1?.symbol ?? '—',
    chainLabel: chainId !== undefined ? getChainLabel(chainId) : '—',
    tvl: pool.totalLiquidity?.value ?? 0,
    volume24h: pool.volume1Day?.value ?? 0,
    token0: pool.token0,
  }
}

/* ------------------------------------------------------------- market card */

function MarketCard({
  card,
  fiat,
  onOpen,
}: {
  card: MarketCardModel
  fiat: (value: number | undefined) => string
  onOpen: (path: string | undefined) => void
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onOpen(card.detailPath)}
      style={{
        display: 'block',
        textAlign: 'left',
        width: '100%',
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 14,
        background: terminalColors.bg,
        padding: 16,
        cursor: card.detailPath ? 'pointer' : 'default',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Head: logos + chain chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <DoubleCurrencyLogo currencies={[card.currency0, card.currency1]} size={26} />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10.5,
            color: terminalColors.ink3Alt,
            background: terminalColors.panel2,
            padding: '3px 8px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 120,
          }}
        >
          {card.chainLabel}
        </span>
      </div>

      {/* Pair name */}
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: terminalColors.ink,
          marginTop: 12,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {card.symbol0} / {card.symbol1}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt, marginTop: 4 }}>
        24h volume {fiat(card.volume24h)}
      </div>

      {/* Footer: TVL */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${terminalColors.line2}`,
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>TVL</span>
        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: terminalColors.ink }}>
          {fiat(card.tvl)}
        </span>
      </div>
    </button>
  )
}

function MarketCardSkeleton(): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 14,
        background: terminalColors.bg,
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 26, borderRadius: 999, background: terminalColors.line2 }} />
        <div style={{ width: 54, height: 18, borderRadius: 999, background: terminalColors.line3 }} />
      </div>
      <div style={{ height: 14, width: '60%', borderRadius: 4, background: terminalColors.line2, marginTop: 14 }} />
      <div style={{ height: 11, width: '45%', borderRadius: 4, background: terminalColors.line3, marginTop: 8 }} />
      <div
        style={{
          height: 12,
          width: '35%',
          borderRadius: 4,
          background: terminalColors.line3,
          marginTop: 18,
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------- hero buttons */

function HeroButton({
  label,
  variant,
  onClick,
}: {
  label: string
  variant: 'primary' | 'outline'
  onClick: () => void
}): JSX.Element {
  const primary = variant === 'primary'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: SANS,
        fontSize: 14,
        fontWeight: 600,
        padding: '11px 20px',
        borderRadius: 12,
        cursor: 'pointer',
        background: primary ? terminalColors.brandGreen : terminalColors.bg,
        color: primary ? terminalColors.btnInk : terminalColors.ink,
        border: primary ? 'none' : `1px solid ${terminalColors.line}`,
      }}
    >
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ feature grid */

/**
 * DEX capabilities surfaced on the landing. Every entry routes to a REAL,
 * already-built Terminal screen — no dead links, no fabricated features.
 */
interface FeatureModel {
  icon: TerminalNavIcon
  title: string
  desc: string
  cta: string
  path: string
}

const FEATURES: readonly FeatureModel[] = [
  { icon: 'swap', title: 'Swap', desc: 'Market & limit orders routed across v2 + v3 pools with MEV protection.', cta: 'Trade', path: '/swap' },
  { icon: 'markets', title: 'Markets', desc: 'Every pool ranked by TVL, volume, and APR with live price charts.', cta: 'Explore', path: '/terminal/markets' },
  { icon: 'pools', title: 'Liquidity', desc: 'Provide concentrated (v3) or full-range (v2) liquidity and earn fees.', cta: 'Add liquidity', path: '/terminal/pools/new' },
  { icon: 'portfolio', title: 'Portfolio', desc: 'Track balances, open LP positions, PnL, and claimable fees.', cta: 'View', path: '/terminal/portfolio' },
  { icon: 'analytics', title: 'Analytics', desc: 'Protocol-wide TVL, volume, and fee trends across every chain.', cta: 'Analyze', path: '/terminal/analytics' },
  { icon: 'activity', title: 'Activity', desc: 'Your full transaction history — swaps, liquidity, transfers.', cta: 'Open', path: '/terminal/activity' },
]

function FeatureCard({ feature, onOpen }: { feature: FeatureModel; onOpen: (path: string) => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onOpen(feature.path)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        textAlign: 'left',
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 14,
        background: terminalColors.bg,
        padding: 18,
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
        <NavIcon name={feature.icon} stroke={terminalColors.greenDeep} size={19} />
      </span>
      <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, color: terminalColors.ink }}>
        {feature.title}
      </span>
      <span style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5, color: terminalColors.ink2, flex: 1 }}>
        {feature.desc}
      </span>
      <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: terminalColors.greenDeep }}>
        {feature.cta} →
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ the body */

function LandingScreenBody(): JSX.Element {
  const navigate = useNavigate()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { chains } = useEnabledChains()

  // Real token list — feeds the ticker strip + the right-card price join.
  const { topTokens, isLoading: tokensLoading } = useListTokens(undefined)
  // Real top-pools feed — feeds the stat-bar pool count + right card + market grid.
  const {
    topPools,
    isLoading: poolsLoading,
    isError: poolsError,
  } = useTopPools({
    sortState: { sortBy: PoolSortFields.Volume24h, sortDirection: OrderDirection.Desc },
  })
  // Real protocol stats — feeds the TVL + 24h volume stat cells.
  const tvlStats = useDailyTVLWithChange()
  const volumeStats = use24hProtocolVolume()

  const metricMaps = useMemo(() => buildTokenMetrics(topTokens), [topTokens])
  const tickers = useMemo(() => buildTickers(topTokens), [topTokens])

  const marketCards = useMemo(
    () => (topPools ? topPools.slice(0, 6).map((pool, i) => buildMarketCard(pool, i)) : undefined),
    [topPools],
  )

  // Featured pool for the right terminal card = the highest-volume pool.
  // Feature the highest-volume pool whose base token (token0, the chart's price
  // source) isn't a stablecoin — so the featured chart shows real movement, not a
  // flat/sawtooth $1 line. Falls back to the top pool if all bases are stable.
  const featured = useMemo(() => {
    if (!topPools || topPools.length === 0) {
      return undefined
    }
    return topPools.find((pool) => !isStableSymbol(pool.token0?.symbol)) ?? topPools[0]
  }, [topPools])
  const featuredCard = useMemo(() => (featured ? buildMarketCard(featured, 0) : undefined), [featured])
  const featuredMetric = useMemo(
    () => (featured ? lookupMetric(featured.token0, metricMaps) : undefined),
    [featured, metricMaps],
  )

  const fiatPrice = (value: number | undefined): string =>
    value !== undefined && value > 0 ? convertFiatAmountFormatted(value, NumberType.FiatTokenPrice) : '—'
  const fiatStats = (value: number | undefined): string =>
    value !== undefined && value > 0 ? convertFiatAmountFormatted(value, NumberType.FiatTokenStats) : '—'

  const heroTitle = 'HookSwap. A DEX in terminal form.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Market ticker strip (live) */}
      <TickerStrip tickers={tickers} loading={tokensLoading} fiatPrice={fiatPrice} />

      <div style={{ padding: '28px 24px 40px', minWidth: 0 }}>
        {/* Hero + right terminal card (wrapping flex row) */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 32 }}>
          {/* Hero column */}
          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Badge — adapted for v2/v3 (no v4 / no hook engine) */}
            <span
              style={{
                alignSelf: 'flex-start',
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.02em',
                color: terminalColors.greenDeep,
                background: terminalColors.greenBg,
                border: `1px solid ${terminalColors.greenBorder}`,
                padding: '5px 11px',
                borderRadius: 999,
              }}
            >
              V2 · V3 · MULTI-CHAIN DEX
            </span>

            <h1
              style={{
                fontFamily: DISPLAY,
                fontSize: 48,
                lineHeight: 1.05,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: terminalColors.ink,
                margin: '18px 0 0',
              }}
            >
              {heroTitle}
            </h1>

            <p
              style={{
                fontFamily: SANS,
                fontSize: 15,
                lineHeight: 1.6,
                color: terminalColors.ink2,
                margin: '16px 0 0',
                maxWidth: 520,
              }}
            >
              Depth charts, live routing, and concentrated liquidity across every HookSwap chain — pro tooling wired into
              HookSwap&apos;s own v2 + v3 deployments.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <HeroButton label="Open terminal" variant="primary" onClick={() => navigate('/swap')} />
              <HeroButton label="Explore markets" variant="outline" onClick={() => navigate('/terminal/markets')} />
            </div>

            {/* 4-cell stat bar (all real; honest "—" when unsourced) */}
            <div
              style={{
                marginTop: 30,
                border: `1px solid ${terminalColors.line}`,
                borderRadius: 14,
                background: terminalColors.bg,
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 18,
              }}
            >
              <StatCell
                label="TVL"
                value={tvlStats.totalTVL !== undefined ? fiatStats(tvlStats.totalTVL) : undefined}
                delta={
                  tvlStats.totalChangePercent !== undefined && !Number.isNaN(tvlStats.totalChangePercent)
                    ? { text: formatSignedPct(tvlStats.totalChangePercent), up: tvlStats.totalChangePercent >= 0 }
                    : undefined
                }
                loading={tvlStats.isLoading}
              />
              <StatCell
                label="24h vol"
                value={volumeStats.totalVolume !== undefined ? fiatStats(volumeStats.totalVolume) : undefined}
                delta={
                  volumeStats.totalChangePercent !== undefined && !Number.isNaN(volumeStats.totalChangePercent)
                    ? { text: formatSignedPct(volumeStats.totalChangePercent), up: volumeStats.totalChangePercent >= 0 }
                    : undefined
                }
                loading={volumeStats.isLoading}
              />
              <StatCell
                label="Pools"
                value={topPools ? String(topPools.length) : undefined}
                loading={poolsLoading && !topPools}
              />
              <StatCell label="Chains" value={String(chains.length)} loading={false} />
            </div>
          </div>

          {/* Right terminal panel card (live) */}
          <div style={{ flex: '1 1 380px', minWidth: 0, display: 'flex' }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                border: `1px solid ${terminalColors.line}`,
                borderRadius: 16,
                background: terminalColors.bg,
                padding: 18,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* Pair header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <DoubleCurrencyLogo currencies={[featuredCard?.currency0, featuredCard?.currency1]} size={26} />
                  <span
                    style={{
                      fontFamily: DISPLAY,
                      fontSize: 15,
                      fontWeight: 600,
                      color: terminalColors.ink,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {featuredCard ? `${featuredCard.symbol0} / ${featuredCard.symbol1}` : '—'}
                  </span>
                </div>
                <div style={{ textAlign: 'right', minWidth: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: terminalColors.ink }}>
                    {fiatPrice(featuredMetric?.price)}
                  </div>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 11.5,
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

              {/* Real price-history area chart (base token 1d closes) */}
              <div style={{ marginTop: 16 }}>
                {poolsLoading && !featured ? (
                  <div style={{ height: 150, borderRadius: 10, background: terminalColors.line2 }} aria-busy="true" />
                ) : (
                  <AreaChart
                    closes={featuredMetric?.sparkline}
                    emptyMessage={
                      featured
                        ? 'Live chart — no recent price history for this market.'
                        : 'Live chart — connect a pool feed to plot price.'
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* DEX feature grid — every entry routes to a real, built screen */}
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: terminalColors.ink,
              margin: 0,
            }}
          >
            Everything in one terminal
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 40,
          }}
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} onOpen={(path) => navigate(path)} />
          ))}
        </div>

        {/* Top markets grid (replaces the hook marketplace) */}
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: terminalColors.ink,
              margin: 0,
            }}
          >
            Top markets
          </h2>
        </div>

        {poolsError ? (
          <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.redDown }}>Failed to load markets.</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {marketCards
              ? marketCards.map((card) => (
                  <MarketCard
                    key={card.key}
                    card={card}
                    fiat={fiatStats}
                    onOpen={(path) => (path ? navigate(path) : navigate('/terminal/markets'))}
                  />
                ))
              : Array.from({ length: 6 }, (_, i) => <MarketCardSkeleton key={i} />)}
          </div>
        )}

        {marketCards && marketCards.length === 0 ? (
          <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink3Alt }}>No markets found.</div>
        ) : null}

        {/* Honest data-provenance note (no fabricated values). */}
        <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 20, lineHeight: 1.5 }}>
          Tickers &amp; the featured chart join the live token feed; TVL &amp; 24h volume are the live protocol-stats feed;
          top markets are the live pools feed. Values with no live source render an honest &ldquo;—&rdquo;.
        </div>
      </div>
    </div>
  )
}

/**
 * B1 Landing screen. Wraps the body in the same Explore providers the legacy
 * `/explore` page uses so the real token-list, pools, and protocol-stats queries
 * resolve: `ExploreContextProvider` (chain scope; defaults to all-networks) +
 * `ExploreTablesFilterStoreContextProvider` (required by the pools filter layer).
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
