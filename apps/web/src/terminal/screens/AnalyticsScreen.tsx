/**
 * HookSwap Terminal — B10 Analytics (protocol-wide analytics dashboard).
 *
 * Pixel-perfect recreation of design handoff screen B10 (column 1b) — see
 * `design_handoff_hookswap_terminal/screenshots/B10-analytics.png` and the B10 markup
 * in `design/HookSwap Redesign.dc.html`: a timeframe segmented control (24H/7D/30D/1Y)
 * + Export button; a row of 6 stat subgraph cards (label · mono value · delta · mini
 * sparkline); a large TVL/Volume/Fees area chart with a metric toggle + date axis; an
 * allocation donut (conic-gradient, center total) + legend + a "Browse markets"
 * button; and a second row with a volume bar chart, a Top-pools table, and a
 * Top-pools-by-TVL list.
 *
 * HOOKS REMOVED (Reggie hard rule — HookSwap ships v2+v3, no hooks): the design's
 * "Hook adoption by category" donut, "Active hooks" stat card, "Top hooks by TVL"
 * list, and "Browse hook marketplace" button are ALL stripped. In their place:
 *   • Donut → REAL "TVL by network" allocation, aggregated from the live top-pools
 *     feed (pool TVL grouped by chain, top networks + an "Other" bucket).
 *   • "Active hooks" card → real "v3 TVL" (with 24h change + sparkline).
 *   • "Top hooks by TVL" → real "Top pools by TVL" (live top-pools feed).
 *   • "Browse hook marketplace" → "Browse markets" (links to /terminal/markets).
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Stat cards + big area chart + volume bars — LIVE from the app's real protocol
 *     stats layer (`useProtocolStats` → `dailyProtocolTvl` and
 *     `historicalProtocolVolume`, the same REST series the legacy `/explore` stats
 *     header uses), via `useDailyTVLWithChange` / `use24hProtocolVolume` for the
 *     headline values + 24h deltas, and the raw daily series for the charts +
 *     sparklines.
 *   • 24h Fees — REAL, derived the same way the Markets table derives it: summed
 *     `volume24h × feeTier` over the live top-pools feed (no single protocol fee rate
 *     exists, so it is aggregated from pools that carry a known static fee tier).
 *   • Donut ("TVL by network") + both bottom tables/lists — LIVE from `useTopPools`
 *     (the real Explore pools feed, as MarketsScreen uses); the Top-pools table's
 *     mini sparklines + 24h change join the real token list (`useListTokens`) by pool
 *     base token, exactly like MarketsScreen.
 *   • HONEST "—" (never fabricated): the big chart's **Fees** toggle — the protocol
 *     stats feed exposes TVL and volume series but NO fee-over-time series, so
 *     selecting Fees shows an honest "not exposed by the feed" state instead of a
 *     fabricated line. Unique-LP / swap-count style metrics from the design have no
 *     source in this frontend and are simply not shown (not faked).
 *
 * Loading / empty / error states are all real over the live queries. Export
 * downloads a CSV snapshot of the REAL loaded headline metrics (honest, no fake).
 */
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { TimestampedAmount, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import type { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { ReactNode, useMemo, useState } from 'react'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { supportedChainIdFromGQLChain } from '~/appGraphql/data/chainUtils'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'
import { gqlToCurrency, OrderDirection, unwrapToken } from '~/appGraphql/data/util'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { ExploreContextProvider } from '~/features/Explore/state'
import { use24hProtocolVolume, useDailyTVLWithChange } from '~/features/Explore/state/protocolStats'
import { useProtocolStats } from '~/features/Explore/state'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { useTopPools } from '~/features/Explore/state/topPools/useTopPools'
import { ComingSoon } from '~/terminal/components/ComingSoon'
import { DataTable, DataTableColumn } from '~/terminal/components/DataTable'
import { SparklineCell } from '~/terminal/components/SparklineCell'
import { StatCard, StatDelta } from '~/terminal/components/StatCard'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import type { PoolStat } from '~/types/explore'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* ------------------------------------------------------------------ helpers */

/** Signed percent, 1 decimal: 3.1 → "+3.1%", -2.3 → "-2.3%". */
function formatSignedPct(value: number): string {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(1)}%`
}

/** {label, direction} delta for a StatCard from a signed percent change. */
function pctDelta(value: number): StatDelta {
  return { label: formatSignedPct(value), direction: value >= 0 ? 'up' : 'down' }
}

/** One (t=epoch-seconds, v=value) point of a merged protocol series, oldest → newest. */
interface SeriesPoint {
  t: number
  v: number
}

/**
 * Merge one or more per-protocol `TimestampedAmount[]` series into a single
 * timestamp-summed series (v2 + v3 + v4), sorted oldest → newest.
 */
function mergeSeries(...groups: (TimestampedAmount[] | undefined)[]): SeriesPoint[] {
  const byTs = new Map<number, number>()
  for (const group of groups) {
    if (!group) {
      continue
    }
    for (const point of group) {
      byTs.set(point.timestamp, (byTs.get(point.timestamp) ?? 0) + Number(point.value))
    }
  }
  return [...byTs.entries()].map(([t, v]) => ({ t, v })).sort((a, b) => a.t - b.t)
}

/** Take the last `n` points (whole series if shorter). */
function sliceLast(points: SeriesPoint[], n: number): SeriesPoint[] {
  return points.length > n ? points.slice(points.length - n) : points
}

/** Format an epoch-seconds timestamp as a compact axis date, e.g. "Jun 03". */
function formatAxisDate(epochSec: number): string {
  return new Date(epochSec * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

/* -------------------------------------------------------------- timeframe */

type Timeframe = '24H' | '7D' | '30D' | '1Y'
const TIMEFRAMES: readonly Timeframe[] = ['24H', '7D', '30D', '1Y']
/** How many trailing daily points each timeframe windows the daily series to. */
const TIMEFRAME_DAYS: Record<Timeframe, number> = { '24H': 2, '7D': 7, '30D': 30, '1Y': 365 }

type ChartMetric = 'tvl' | 'volume' | 'fees'
const CHART_METRICS: ReadonlyArray<{ id: ChartMetric; label: string }> = [
  { id: 'tvl', label: 'TVL' },
  { id: 'volume', label: 'Volume' },
  { id: 'fees', label: 'Fees' },
]

/* -------------------------------------------------------- segmented control */

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ id: T; label: string }>
  value: T
  onChange: (id: T) => void
}): JSX.Element {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: terminalColors.panel2,
        borderRadius: 999,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((option) => {
        const active = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              padding: '5px 13px',
              borderRadius: 999,
              cursor: 'pointer',
              border: 'none',
              background: active ? terminalColors.bg : 'transparent',
              color: active ? terminalColors.ink : terminalColors.ink2,
              boxShadow: active ? '0 1px 2px rgba(11,15,20,.06)' : undefined,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------------- card shell */

function Card({
  title,
  right,
  children,
  padding = 18,
}: {
  title?: string
  right?: ReactNode
  children: ReactNode
  padding?: number
}): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 14,
        background: terminalColors.bg,
        padding,
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      {title || right ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
          }}
        >
          {title ? (
            <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: terminalColors.ink }}>{title}</div>
          ) : (
            <span />
          )}
          {right}
        </div>
      ) : null}
      {children}
    </div>
  )
}

/* ----------------------------------------------------------------- area chart */

function AreaChart({
  points,
  loading,
  error,
  emptyMessage,
  height = 230,
}: {
  points?: SeriesPoint[]
  loading: boolean
  error?: boolean
  emptyMessage?: string
  height?: number
}): JSX.Element {
  const VB_W = 1000
  const VB_H = 260
  const gradientId = 'tm-area-fill'

  const geometry = useMemo(() => {
    if (!points || points.length < 2) {
      return undefined
    }
    const values = points.map((p) => p.v)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * VB_W
      // 6px top / bottom breathing room inside the viewBox.
      const y = VB_H - 6 - ((p.v - min) / span) * (VB_H - 12)
      return { x, y }
    })
    const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
    const area = `0,${VB_H} ${line} ${VB_W},${VB_H}`
    return { line, area }
  }, [points])

  const axisLabels = useMemo(() => {
    if (!points || points.length < 2) {
      return []
    }
    const count = Math.min(5, points.length)
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round((i / (count - 1)) * (points.length - 1))
      return formatAxisDate(points[idx].t)
    })
  }, [points])

  if (loading) {
    return <div style={{ height, borderRadius: 10, background: terminalColors.line2 }} aria-busy="true" />
  }
  if (error) {
    return <ComingSoon variant="panel" minHeight={height} subtext="Protocol analytics arrive with the HookSwap indexer." />
  }
  if (!geometry) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 12.5,
          color: terminalColors.ink3Alt,
          padding: '0 24px',
          lineHeight: 1.5,
        }}
      >
        {emptyMessage ?? 'No series data available.'}
      </div>
    )
  }

  return (
    <div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={terminalColors.greenUp} stopOpacity="0.22" />
            <stop offset="100%" stopColor={terminalColors.greenUp} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={geometry.area} fill={`url(#${gradientId})`} />
        <polyline points={geometry.line} fill="none" stroke={terminalColors.greenUp} strokeWidth={2.4} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {axisLabels.map((label, i) => (
          <span key={`${label}-${i}`} style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ bar chart */

function BarChart({
  points,
  loading,
  error,
}: {
  points?: SeriesPoint[]
  loading: boolean
  error?: boolean
}): JSX.Element {
  const height = 150
  if (loading) {
    return <div style={{ height: height + 24, borderRadius: 10, background: terminalColors.line2 }} aria-busy="true" />
  }
  if (error) {
    return <ComingSoon variant="panel" minHeight={height + 24} subtext="Volume metrics arrive with the HookSwap indexer." />
  }
  if (!points || points.length === 0) {
    return (
      <div
        style={{
          height: height + 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 16px',
          fontFamily: SANS,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: terminalColors.ink3Alt,
        }}
      >
        No volume yet — arrives with the HookSwap indexer.
      </div>
    )
  }
  const max = Math.max(...points.map((p) => p.v), 1)
  const lastIndex = points.length - 1
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
        {points.map((point, i) => (
          <div
            key={point.t}
            title={formatAxisDate(point.t)}
            style={{
              flex: 1,
              minWidth: 0,
              height: `${Math.max(2, (point.v / max) * 100)}%`,
              borderRadius: 3,
              // Most-recent bar reads as the accent; earlier bars a lighter green.
              background: i === lastIndex ? terminalColors.greenUp : terminalColors.greenBorder,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint }}>
          {formatAxisDate(points[0].t)}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint }}>
          {formatAxisDate(points[lastIndex].t)}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ donut */

const ALLOC_COLORS = [
  terminalColors.accentIndigo,
  terminalColors.accentBlue,
  terminalColors.greenUp,
  terminalColors.accentPurple,
  terminalColors.accentPink,
  terminalColors.accentTeal,
] as const
const OTHER_COLOR = terminalColors.faint

interface AllocSlice {
  label: string
  usd: number
  percent: number
  color: string
}

/** Aggregate live pool TVL by chain → donut slices (top networks + "Other"). */
function buildNetworkAllocation(pools: PoolStat[] | undefined): { slices: AllocSlice[]; total: number } | undefined {
  if (!pools) {
    return undefined
  }
  const byChain = new Map<string, number>()
  for (const pool of pools) {
    const chainId = supportedChainIdFromGQLChain(pool.token0?.chain as GraphQLApi.Chain)
    const label = chainId !== undefined ? getChainLabel(chainId) : 'Other'
    const tvl = pool.totalLiquidity?.value ?? 0
    if (tvl > 0) {
      byChain.set(label, (byChain.get(label) ?? 0) + tvl)
    }
  }
  const rows = [...byChain.entries()].map(([label, usd]) => ({ label, usd })).sort((a, b) => b.usd - a.usd)
  const total = rows.reduce((sum, r) => sum + r.usd, 0)
  if (total <= 0) {
    return { slices: [], total: 0 }
  }
  const top = rows.slice(0, ALLOC_COLORS.length)
  const otherUsd = rows.slice(ALLOC_COLORS.length).reduce((sum, r) => sum + r.usd, 0)
  const slices: AllocSlice[] = top.map((r, i) => ({
    label: r.label,
    usd: r.usd,
    percent: (r.usd / total) * 100,
    color: ALLOC_COLORS[i],
  }))
  if (otherUsd > 0) {
    slices.push({ label: 'Other', usd: otherUsd, percent: (otherUsd / total) * 100, color: OTHER_COLOR })
  }
  return { slices, total }
}

function NetworkDonut({
  allocation,
  totalLabel,
  loading,
  error,
}: {
  allocation?: { slices: AllocSlice[]; total: number }
  totalLabel?: string
  loading: boolean
  error?: boolean
}): JSX.Element {
  const gradient = useMemo(() => {
    if (!allocation || allocation.slices.length === 0) {
      return undefined
    }
    let acc = 0
    const stops = allocation.slices.map((s) => {
      const start = acc
      acc += s.percent
      return `${s.color} ${start.toFixed(2)}% ${acc.toFixed(2)}%`
    })
    return `conic-gradient(${stops.join(',')})`
  }, [allocation])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative', flexShrink: 0, width: 128, height: 128 }}>
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: '50%',
            background: loading || !gradient ? terminalColors.line2 : gradient,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 24,
            borderRadius: '50%',
            background: terminalColors.bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontFamily: SANS, fontSize: 10, color: terminalColors.ink3Alt }}>TVL</span>
          {!loading && totalLabel ? (
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: terminalColors.ink }}>
              {totalLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0, flex: 1 }}>
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ height: 12, width: '75%', borderRadius: 4, background: terminalColors.line2 }} />
          ))
        ) : allocation && allocation.slices.length > 0 ? (
          allocation.slices.map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 12.5,
                  color: terminalColors.ink2,
                  flex: 1,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.label}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: terminalColors.ink }}>
                {s.percent.toFixed(0)}%
              </span>
            </div>
          ))
        ) : error ? (
          <ComingSoon variant="inline" subtext="Network allocation arrives with the HookSwap indexer." />
        ) : (
          <div style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5, color: terminalColors.ink3Alt }}>
            No pool TVL yet — network allocation appears with the HookSwap indexer.
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------- pool presentation + join */

interface PoolPresentation {
  key: string
  currency0?: Currency
  currency1?: Currency
  symbol0: string
  symbol1: string
  chainLabel: string
  tvl: number
  volume24h: number
  fees24h?: number
  aprText: string
  aprPercent: number
  token0?: TokenStats
}

function buildPoolPresentation(pool: PoolStat, index: number): PoolPresentation {
  const chainId = supportedChainIdFromGQLChain(pool.token0?.chain as GraphQLApi.Chain)
  const displayToken0 = chainId !== undefined && pool.token0 ? unwrapToken(chainId, pool.token0) : pool.token0
  const displayToken1 = chainId !== undefined && pool.token1 ? unwrapToken(chainId, pool.token1) : pool.token1
  const currency0 = displayToken0 ? gqlToCurrency(displayToken0) : undefined
  const currency1 = displayToken1 ? gqlToCurrency(displayToken1) : undefined

  const tvl = pool.totalLiquidity?.value ?? 0
  const volume24h = pool.volume1Day?.value ?? 0
  const feeAmount = pool.feeTier?.feeAmount
  const isDynamicFee = pool.feeTier?.isDynamic ?? false
  const fees24h = feeAmount !== undefined && !isDynamicFee ? volume24h * (feeAmount / 1_000_000) : undefined

  return {
    key: pool.id ? `${pool.id}-${index}` : `row-${index}`,
    currency0,
    currency1,
    symbol0: currency0?.symbol ?? pool.token0?.symbol ?? '—',
    symbol1: currency1?.symbol ?? pool.token1?.symbol ?? '—',
    chainLabel: chainId !== undefined ? getChainLabel(chainId) : '—',
    tvl,
    volume24h,
    fees24h,
    aprText: `${pool.apr.toFixed(1)}%`,
    aprPercent: Number(pool.apr.toFixed(4)),
    token0: pool.token0,
  }
}

/** Per-token 1d price-history closes, keyed for the top-pools sparkline join. */
function buildSparklineMaps(tokens: readonly MultichainToken[]): {
  byKey: Map<string, number[]>
  bySymbol: Map<string, number[]>
} {
  const byKey = new Map<string, number[]>()
  const bySymbol = new Map<string, number[]>()
  for (const token of tokens) {
    const history = token.stats?.priceHistory1d
    if (!history || history.length === 0) {
      continue
    }
    const series = history.map((point) => point.value)
    for (const chainToken of token.chainTokens) {
      if (chainToken.address) {
        byKey.set(`${chainToken.chainId}:${chainToken.address.toLowerCase()}`, series)
      }
    }
    if (token.symbol) {
      bySymbol.set(token.symbol.toUpperCase(), series)
    }
  }
  return { byKey, bySymbol }
}

function lookupSparkline(
  token: TokenStats | undefined,
  maps: { byKey: Map<string, number[]>; bySymbol: Map<string, number[]> },
): number[] | undefined {
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

/* --------------------------------------------------------------- pair cell */

function PairCell({ presentation }: { presentation: PoolPresentation }): JSX.Element {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <DoubleCurrencyLogo currencies={[presentation.currency0, presentation.currency1]} size={20} />
      <span
        style={{
          fontFamily: SANS,
          fontSize: 12.5,
          fontWeight: 600,
          color: terminalColors.ink,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {presentation.symbol0} / {presentation.symbol1}
      </span>
    </span>
  )
}

/* ---------------------------------------------------- top pools by TVL list */

function TopPoolsByTvlList({
  presentations,
  loading,
  error,
  fiat,
}: {
  presentations?: PoolPresentation[]
  loading: boolean
  error?: boolean
  fiat: (v: number | undefined) => string
}): JSX.Element {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '11px 0',
              borderTop: i === 0 ? undefined : `1px solid ${terminalColors.line3}`,
            }}
          >
            <div style={{ height: 12, width: '45%', borderRadius: 4, background: terminalColors.line2 }} />
            <div style={{ height: 12, width: 56, borderRadius: 4, background: terminalColors.line3 }} />
          </div>
        ))}
      </div>
    )
  }
  if (error) {
    return <ComingSoon variant="inline" subtext="Pool rankings arrive with the HookSwap indexer." />
  }
  if (!presentations || presentations.length === 0) {
    return (
      <div style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5, color: terminalColors.ink3Alt }}>
        No pools indexed yet — liquidity data goes live with the HookSwap indexer.
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {presentations.map((p, i) => (
        <div
          key={p.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 0',
            borderTop: i === 0 ? undefined : `1px solid ${terminalColors.line3}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <DoubleCurrencyLogo currencies={[p.currency0, p.currency1]} size={20} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: terminalColors.ink,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.symbol0} / {p.symbol1}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: terminalColors.ink3Alt }}>{p.chainLabel}</div>
            </div>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: terminalColors.ink }}>
            {fiat(p.tvl)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ the body */

function AnalyticsScreenBody(): JSX.Element {
  const [timeframe, setTimeframe] = useState<Timeframe>('30D')
  const [chartMetric, setChartMetric] = useState<ChartMetric>('tvl')
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Raw protocol series (TVL + volume) — feeds the chart, bars, and sparklines.
  const protocol = useProtocolStats()
  // Derived headline values + 24h deltas (same layer the legacy /explore header uses).
  const tvlStats = useDailyTVLWithChange()
  const volumeStats = use24hProtocolVolume()

  // Real top-pools feed — feeds the donut + both bottom tables/lists + 24h fees.
  const { topPools, isLoading: poolsLoading, isError: poolsError } = useTopPools({
    sortState: { sortBy: PoolSortFields.TVL, sortDirection: OrderDirection.Desc },
  })
  // Real token list — sparkline join for the Top-pools table.
  const { topTokens } = useListTokens(undefined)

  const protocolLoading = protocol.isLoading
  const protocolError = protocol.isError

  /* --- protocol series --- */
  const tvlSeries = useMemo(() => {
    const tvl = protocol.data?.dailyProtocolTvl
    return mergeSeries(tvl?.v2, tvl?.v3, tvl?.v4)
  }, [protocol.data])

  const monthVolumeSeries = useMemo(() => {
    const vol = protocol.data?.historicalProtocolVolume?.Month
    return mergeSeries(vol?.v2, vol?.v3, vol?.v4)
  }, [protocol.data])

  const yearVolumeSeries = useMemo(() => {
    const vol = protocol.data?.historicalProtocolVolume?.Year
    return mergeSeries(vol?.v2, vol?.v3, vol?.v4)
  }, [protocol.data])

  const v2TvlSeries = useMemo(() => mergeSeries(protocol.data?.dailyProtocolTvl?.v2), [protocol.data])
  const v3TvlSeries = useMemo(() => mergeSeries(protocol.data?.dailyProtocolTvl?.v3), [protocol.data])

  // Big-chart points for the active metric + timeframe.
  const chartPoints = useMemo((): SeriesPoint[] | undefined => {
    const days = TIMEFRAME_DAYS[timeframe]
    if (chartMetric === 'tvl') {
      return sliceLast(tvlSeries, days)
    }
    if (chartMetric === 'volume') {
      return timeframe === '1Y' ? yearVolumeSeries : sliceLast(monthVolumeSeries, days)
    }
    // Fees — no protocol fee-over-time series exists (honest empty; never fabricated).
    return undefined
  }, [chartMetric, timeframe, tvlSeries, monthVolumeSeries, yearVolumeSeries])

  // Volume bar chart window (daily buckets from the real Month/Year volume series).
  const barPoints = useMemo(
    () => (timeframe === '1Y' ? yearVolumeSeries : sliceLast(monthVolumeSeries, TIMEFRAME_DAYS[timeframe])),
    [timeframe, monthVolumeSeries, yearVolumeSeries],
  )

  /* --- pools --- */
  const presentations = useMemo(
    () => (topPools ? topPools.map((pool, i) => buildPoolPresentation(pool, i)) : undefined),
    [topPools],
  )
  const sparklineMaps = useMemo(() => buildSparklineMaps(topTokens), [topTokens])
  const allocation = useMemo(() => buildNetworkAllocation(topPools), [topPools])

  // Aggregate 24h fees from pools with a known static fee tier (real, derived).
  const aggFees24h = useMemo(() => {
    if (!presentations) {
      return undefined
    }
    let sum = 0
    let any = false
    for (const p of presentations) {
      if (p.fees24h !== undefined) {
        sum += p.fees24h
        any = true
      }
    }
    return any ? sum : undefined
  }, [presentations])

  const topByVolume = useMemo(() => {
    if (!presentations) {
      return undefined
    }
    return [...presentations].sort((a, b) => b.volume24h - a.volume24h).slice(0, 6)
  }, [presentations])

  const topByTvl = useMemo(() => presentations?.slice(0, 6), [presentations])

  /* --- formatting --- */
  const fiatStats = (value: number | undefined): string =>
    value !== undefined && value > 0 ? convertFiatAmountFormatted(value, NumberType.FiatTokenStats) : '—'

  /* --- export (real snapshot of loaded headline metrics) --- */
  const onExport = (): void => {
    const rows: Array<[string, string]> = [
      ['Total TVL', fiatStats(tvlStats.totalTVL)],
      ['Total TVL 24h change', formatSignedPct(tvlStats.totalChangePercent)],
      ['24h Volume', fiatStats(volumeStats.totalVolume)],
      ['24h Volume change', formatSignedPct(volumeStats.totalChangePercent)],
      ['24h Fees (from pools)', fiatStats(aggFees24h)],
      ['v3 TVL', fiatStats(tvlStats.protocolTVL.v3)],
      ['v2 TVL', fiatStats(tvlStats.protocolTVL.v2)],
      ['Pools tracked', String(topPools?.length ?? 0)],
    ]
    const csv = ['metric,value', ...rows.map(([k, v]) => `${k},${v.replace(/,/g, '')}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'hookswap-analytics.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  /* --- top-pools table columns --- */
  const columns: ReadonlyArray<DataTableColumn<PoolPresentation>> = useMemo(
    () => [
      {
        id: 'pair',
        header: 'Pool',
        width: 'minmax(130px,1.5fr)',
        align: 'left',
        cell: (row) => <PairCell presentation={row} />,
        sortValue: (row) => `${row.symbol0}/${row.symbol1}`,
      },
      {
        id: 'volume',
        header: 'Volume',
        width: 'minmax(84px,1fr)',
        align: 'right',
        mono: true,
        cell: (row) => fiatStats(row.volume24h),
        cellColor: () => terminalColors.ink,
        sortValue: (row) => row.volume24h,
      },
      {
        id: 'apr',
        header: 'APR',
        width: 'minmax(60px,0.7fr)',
        align: 'right',
        mono: true,
        cell: (row) => row.aprText,
        cellColor: () => terminalColors.ink2,
        sortValue: (row) => row.aprPercent,
      },
      {
        id: 'spark',
        header: '7d',
        width: '84px',
        align: 'center',
        cell: (row) => {
          const series = lookupSparkline(row.token0, sparklineMaps)
          return series && series.length >= 2 ? (
            <span style={{ display: 'inline-flex', justifyContent: 'center', width: '100%' }}>
              <SparklineCell data={series} width={72} height={22} strokeWidth={2} />
            </span>
          ) : (
            <span style={{ fontFamily: MONO, fontSize: 12, color: terminalColors.faint }}>—</span>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [convertFiatAmountFormatted, sparklineMaps],
  )

  const chartTitleValue =
    chartMetric === 'tvl'
      ? fiatStats(tvlStats.totalTVL)
      : chartMetric === 'volume'
        ? fiatStats(volumeStats.totalVolume)
        : fiatStats(aggFees24h)
  const chartTitleChange = chartMetric === 'tvl' ? tvlStats.totalChangePercent : volumeStats.totalChangePercent
  const chartTitle = chartMetric === 'tvl' ? 'Total value locked' : chartMetric === 'volume' ? 'Volume' : 'Fees'

  return (
    <div style={{ padding: '20px var(--tm-gutter) 40px' }}>
      {/* Header: title + timeframe + export */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: terminalColors.ink,
            margin: 0,
          }}
        >
          Analytics
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Segmented options={TIMEFRAMES.map((tf) => ({ id: tf, label: tf }))} value={timeframe} onChange={setTimeframe} />
          <button
            type="button"
            onClick={onExport}
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 600,
              color: terminalColors.ink,
              background: terminalColors.bg,
              border: `1px solid ${terminalColors.line}`,
              padding: '7px 14px',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            ↑ Export
          </button>
        </div>
      </div>

      {/* 6 stat subgraph cards — auto-fit so they wrap to 2–3 rows instead of
          cramping/overflowing on narrow content widths; one row of 6 at ≥~960px. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <StatCard
          label="Total TVL"
          value={protocolError ? undefined : fiatStats(tvlStats.totalTVL)}
          delta={protocolError ? undefined : pctDelta(tvlStats.totalChangePercent)}
          sparkline={tvlSeries.length >= 2 ? tvlSeries.map((p) => p.v) : undefined}
          loading={tvlStats.isLoading}
          comingSoon={protocolError}
        />
        <StatCard
          label="24h Volume"
          value={protocolError ? undefined : fiatStats(volumeStats.totalVolume)}
          delta={protocolError ? undefined : pctDelta(volumeStats.totalChangePercent)}
          sparkline={monthVolumeSeries.length >= 2 ? monthVolumeSeries.map((p) => p.v) : undefined}
          loading={volumeStats.isLoading}
          comingSoon={protocolError}
        />
        <StatCard
          label="24h Fees"
          value={fiatStats(aggFees24h)}
          loading={poolsLoading && !presentations}
          comingSoon={poolsError}
        />
        <StatCard
          label="v3 TVL"
          value={protocolError ? undefined : fiatStats(tvlStats.protocolTVL.v3)}
          delta={protocolError ? undefined : pctDelta(tvlStats.protocolChangePercent.v3)}
          sparkline={v3TvlSeries.length >= 2 ? v3TvlSeries.map((p) => p.v) : undefined}
          loading={tvlStats.isLoading}
          comingSoon={protocolError}
        />
        <StatCard
          label="v2 TVL"
          value={protocolError ? undefined : fiatStats(tvlStats.protocolTVL.v2)}
          delta={protocolError ? undefined : pctDelta(tvlStats.protocolChangePercent.v2)}
          sparkline={v2TvlSeries.length >= 2 ? v2TvlSeries.map((p) => p.v) : undefined}
          loading={tvlStats.isLoading}
          comingSoon={protocolError}
        />
        <StatCard
          label="Pools tracked"
          value={topPools ? String(topPools.length) : undefined}
          loading={poolsLoading && !presentations}
          comingSoon={poolsError}
        />
      </div>

      {/* Big chart (left) + network allocation donut (right) */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 560px', minWidth: 0 }}>
          <Card
            title={undefined}
            right={<Segmented options={CHART_METRICS} value={chartMetric} onChange={setChartMetric} />}
          >
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink3Alt }}>{chartTitle}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 26,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: terminalColors.ink,
                  }}
                >
                  {chartMetric === 'fees' && chartTitleValue === '—' ? '—' : chartTitleValue}
                </span>
                {chartMetric !== 'fees' && !protocolError ? (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 13,
                      fontWeight: 600,
                      color: chartTitleChange >= 0 ? terminalColors.greenUp : terminalColors.redDown,
                    }}
                  >
                    {formatSignedPct(chartTitleChange)}
                  </span>
                ) : null}
              </div>
            </div>
            <AreaChart
              points={chartPoints}
              loading={protocolLoading && chartMetric !== 'fees'}
              error={protocolError && chartMetric !== 'fees'}
              emptyMessage={
                chartMetric === 'fees'
                  ? 'Fee-over-time series is not exposed by the protocol stats feed. 24h fees are shown in the stat card above (aggregated from live pools).'
                  : 'No protocol series yet — analytics populate once the HookSwap indexer is live.'
              }
            />
          </Card>
        </div>

        <div style={{ flex: '0 1 336px', minWidth: 0 }}>
          <Card title="TVL by network">
            <NetworkDonut
              allocation={allocation}
              totalLabel={allocation && allocation.total > 0 ? fiatStats(allocation.total) : undefined}
              loading={poolsLoading && !allocation}
              error={poolsError}
            />
            <a
              href="/markets"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: 18,
                fontFamily: SANS,
                fontSize: 13.5,
                fontWeight: 600,
                color: terminalColors.btnInk,
                background: terminalColors.brandGreen,
                border: 'none',
                padding: '11px 16px',
                borderRadius: 12,
                textDecoration: 'none',
              }}
            >
              Browse markets
            </a>
          </Card>
        </div>
      </div>

      {/* Second row: volume bars + top-pools table + top-pools-by-TVL list */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card title={`Volume · ${timeframe === '1Y' ? 'weekly (1y)' : `daily (${timeframe})`}`}>
            <BarChart points={barPoints} loading={protocolLoading} error={protocolError} />
          </Card>
        </div>

        <div style={{ flex: '1.3 1 360px', minWidth: 0 }}>
          <Card title="Top pools">
            {/* Table grid has a ~358px min-track floor — DataTable scrolls it inside
                its own container so it never pushes the page wide on narrow content. */}
            <DataTable<PoolPresentation>
              columns={columns}
              rows={poolsLoading && !topByVolume ? undefined : topByVolume}
              rowKey={(row) => row.key}
              loading={poolsLoading && !topByVolume}
              comingSoon={poolsError}
              comingSoonSubtext="Pool liquidity data goes live with the HookSwap indexer."
              emptyMessage="No pools indexed yet — liquidity data goes live with the HookSwap indexer."
              initialSort={{ columnId: 'volume', direction: 'desc' }}
              skeletonRows={6}
              minWidth={360}
            />
          </Card>
        </div>

        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <Card title="Top pools by TVL">
            <TopPoolsByTvlList
              presentations={topByTvl}
              loading={poolsLoading && !topByTvl}
              error={poolsError}
              fiat={fiatStats}
            />
          </Card>
        </div>
      </div>

      {/* Honest data-provenance note (no fabricated values). */}
      <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 16, lineHeight: 1.5 }}>
        TVL &amp; volume series are the live protocol stats feed; 24h fees + network allocation + top pools are the live
        pools feed (fees derived from volume × static fee tier). Protocol fee-over-time is not exposed by the feed.
      </div>
    </div>
  )
}

/**
 * B10 Analytics screen. Wraps the body in the same Explore providers the legacy
 * `/explore` page uses so the real protocol-stats + pools queries resolve:
 * `ExploreContextProvider` (chain scope; defaults to all-networks) +
 * `ExploreTablesFilterStoreContextProvider` (required by the pools filter layer).
 */
export function AnalyticsScreen(): JSX.Element {
  return (
    <ExploreContextProvider>
      <ExploreTablesFilterStoreContextProvider>
        <AnalyticsScreenBody />
      </ExploreTablesFilterStoreContextProvider>
    </ExploreContextProvider>
  )
}
