/**
 * HookSwap Terminal — B6 Market detail.
 *
 * Pixel-perfect recreation of design handoff screen B6 (column 1b) — see
 * `design_handoff_hookswap_terminal/screenshots/B06-market-detail.png` and the B6
 * markup in `design/HookSwap Redesign.dc.html`: a pair-identity header (overlapped
 * token circles, fee-tier badge, pool address) with Price/24h stats + Swap /
 * Add-liquidity buttons; a large area chart over a grid with an O/H/L/C readout +
 * timeframe tabs; a 4-tile KPI row (TVL · 24h volume · 24h fees · APR); and a right
 * ~330px column with Trades / Your-position tabs, a live trade tape, and a
 * pool-composition bar + legend.
 *
 * HOOKS REMOVED (LOCKED decision — HookSwap ships v2 + v3 only): the B6 design puts
 * a "Dynamic Fee" hook badge on the header, a "Dyn Fee 0.031%" chip on the chart,
 * and a hook-config strip below it. NONE of those are rendered here — no hook badge,
 * no hook chip, no hook surface anywhere on this screen.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Pool identity + KPIs — LIVE from the app's real pool-detail layer
 *     (`usePoolData`, the same hook the legacy `/explore/pools/:chain/:address` page
 *     uses). Pair (real token logos via DoubleCurrencyLogo), fee tier, pool address,
 *     TVL, 24h volume all come straight from it. 24h fees is derived from the real
 *     `volume24h × feeTier` (only for a static fee tier; a dynamic tier renders an
 *     honest "—" since its realized fee isn't in this feed). APR = the app's real
 *     `calculateApr(volume, tvl, feeTier)`.
 *   • Price / 24h change / O·H·L·C / area chart — LIVE from the app's real pool
 *     price-history feed (`usePoolPriceChartData`, the same series the legacy PDP
 *     price chart draws). Price = the series' last close; change/O/H/L/C are derived
 *     from the selected-timeframe series. The area chart is drawn from that real
 *     close series (no fabricated points); an empty series → honest empty state.
 *   • Trade tape — LIVE from the real pool-transactions feed (`usePoolTransactions`,
 *     swaps only). Price = token1/token0 executed ratio, size = token0 amount, side
 *     colours the mono price (buy green / sell red), time = relative from the tx
 *     timestamp.
 *   • Your position — LIVE from the wallet's real LP positions (`useWalletPositions`)
 *     filtered to this pool; disconnected → an honest connect prompt, connected with
 *     none → an honest empty state.
 *   • Pool composition — LIVE from the pool's real token reserves (`tvlToken0/1`) and
 *     token prices; the bar splits by USD value, the legend shows token amounts.
 *
 * The route param `:poolId` is encoded `chainId-address` (e.g. `1-0x88e6…a4f2`); a
 * malformed or unresolvable id renders an honest not-found state. All loading /
 * empty / error / disconnected states are real over the live hooks.
 */
import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { NumberType } from 'utilities/src/format/types'
import { PoolData, usePoolData } from '~/appGraphql/data/pools/usePoolData'
import {
  PoolTableTransaction,
  PoolTableTransactionType,
  usePoolTransactions,
} from '~/appGraphql/data/pools/usePoolTransactions'
import { calculateApr } from '~/appGraphql/data/pools/useTopPools'
import { gqlToCurrency, TimePeriod, toHistoryDuration, unwrapToken } from '~/appGraphql/data/util'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { usePoolPriceChartData } from '~/features/Liquidity/charts/usePoolPriceChartData'
import { useAccount } from '~/hooks/useAccount'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* ------------------------------------------------------------------ helpers */

/** Parse the `chainId-address` route param into a chainId + pool address. */
function parsePoolId(poolId: string | undefined): { chainId: UniverseChainId; address: string } | undefined {
  if (!poolId) {
    return undefined
  }
  const dash = poolId.indexOf('-')
  if (dash <= 0) {
    return undefined
  }
  const chainRaw = poolId.slice(0, dash)
  const address = poolId.slice(dash + 1)
  const chainNum = Number(chainRaw)
  if (!Number.isInteger(chainNum) || chainNum <= 0 || !isEVMAddress(address)) {
    return undefined
  }
  return { chainId: chainNum as UniverseChainId, address }
}

/** Format a pool price ratio (no currency symbol), adaptive decimals. */
function formatRatio(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return '—'
  }
  if (value >= 1000) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (value >= 1) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 4 })
  }
  if (value >= 0.0001) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 6 })
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 8 })
}

/** Compact token amount, e.g. 118432 → "118.4k", 402100000 → "402.1M". */
function formatCompact(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return '—'
  }
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

/** Signed percent, 2 decimals: 2.41 → "+2.41%". */
function formatSignedPct(value: number): string {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}%`
}

/** Truncate a pool/tx address to `0x88e6…a4f2`. */
function shortAddress(address: string | undefined): string {
  if (!address || address.length < 10) {
    return address ?? '—'
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** Compact relative time from a unix-seconds timestamp: "8s", "3m", "14h", "2d". */
function relativeFromSeconds(timestampSec: number, nowMs: number = Date.now()): string {
  const deltaSec = Math.max(0, Math.round(nowMs / 1000 - timestampSec))
  if (deltaSec < 60) {
    return `${deltaSec}s`
  }
  const min = Math.round(deltaSec / 60)
  if (min < 60) {
    return `${min}m`
  }
  const hr = Math.round(min / 60)
  if (hr < 24) {
    return `${hr}h`
  }
  return `${Math.round(hr / 24)}d`
}

/* ------------------------------------------------------------- timeframe tabs */

/**
 * The B6 design shows intraday tabs (5m/15m/1H/4H) but the pools price-history feed
 * only serves daily+ candles (the legacy PDP filters HOUR out for price), so we wire
 * the tabs to the real durations the feed supports — no dead controls. `changeLabel`
 * is the header change-stat label matching the selected window.
 */
interface Timeframe {
  label: string
  period: TimePeriod
  changeLabel: string
}
const TIMEFRAMES: readonly Timeframe[] = [
  { label: '1D', period: TimePeriod.DAY, changeLabel: '24h' },
  { label: '1W', period: TimePeriod.WEEK, changeLabel: '7d' },
  { label: '1M', period: TimePeriod.MONTH, changeLabel: '30d' },
  { label: '1Y', period: TimePeriod.YEAR, changeLabel: '1y' },
]

/* ---------------------------------------------------------------- area chart */

/** Real price-series area chart (line + gradient fill), drawn from the close series. */
function PriceAreaChart({
  closes,
  loading,
}: {
  closes: readonly number[]
  loading: boolean
}): JSX.Element {
  const W = 720
  const H = 360
  const paths = useMemo(() => {
    if (closes.length < 2) {
      return undefined
    }
    const min = Math.min(...closes)
    const max = Math.max(...closes)
    const span = max - min || 1
    // Inset the series vertically so it never touches the frame edges.
    const top = 16
    const bottom = H - 16
    const pts = closes.map((value, index) => {
      const x = (index / (closes.length - 1)) * W
      const y = bottom - ((value - min) / span) * (bottom - top)
      return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
    })
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    const area = `M${pts[0].x},${H} L${line.slice(1)} L${pts[pts.length - 1].x},${H} Z`
    return { line, area }
  }, [closes])

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 340,
        border: `1px solid ${terminalColors.line2}`,
        borderRadius: 12,
        overflow: 'hidden',
        background: terminalColors.bg,
      }}
    >
      {/* Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg,transparent 0 47px,${terminalColors.line3} 47px 48px), repeating-linear-gradient(90deg,transparent 0 63px,${terminalColors.line3} 63px 64px)`,
        }}
      />
      {paths ? (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0 }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="md-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={terminalColors.brandGreen} stopOpacity={0.2} />
              <stop offset="1" stopColor={terminalColors.brandGreen} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={paths.area} fill="url(#md-area-grad)" />
          <path d={paths.line} fill="none" stroke={terminalColors.greenUp} strokeWidth={2.2} />
        </svg>
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 12, color: terminalColors.faint }}>
            {loading ? 'Loading price history…' : 'No price history for this window.'}
          </span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ KPI tile */

function KpiTile({ label, value, valueColor }: { label: string; value?: string; valueColor?: string }): JSX.Element {
  return (
    <div style={{ border: `1px solid ${terminalColors.line2}`, borderRadius: 10, padding: '12px 14px', minWidth: 0 }}>
      <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>{label}</div>
      {value === undefined ? (
        <div style={{ height: 16, width: 60, borderRadius: 4, background: terminalColors.line2, marginTop: 6 }} />
      ) : (
        <div
          style={{
            fontFamily: MONO,
            fontSize: 16,
            fontWeight: 600,
            color: valueColor ?? terminalColors.ink,
            marginTop: 4,
          }}
        >
          {value}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- header stat */

function HeaderStat({ label, value, valueColor, size }: { label: string; value: string; valueColor?: string; size: number }): JSX.Element {
  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: 10.5, color: terminalColors.ink3Alt, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: size, fontWeight: 600, color: valueColor ?? terminalColors.ink, whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- trade tape */

interface TradeRow {
  key: string
  price: string
  size: string
  time: string
  isBuy: boolean
}

function buildTradeRows(txns: PoolTableTransaction[]): TradeRow[] {
  return txns
    .filter((tx) => tx.type === PoolTableTransactionType.BUY || tx.type === PoolTableTransactionType.SELL)
    .map((tx, index) => {
      const size0 = Math.abs(tx.amount0)
      const size1 = Math.abs(tx.amount1)
      const price = size0 > 0 ? size1 / size0 : undefined
      return {
        key: `${tx.transaction}-${index}`,
        price: formatRatio(price),
        size: size0 > 0 ? size0.toLocaleString('en-US', { maximumFractionDigits: 3 }) : '—',
        time: relativeFromSeconds(tx.timestamp),
        isBuy: tx.type === PoolTableTransactionType.BUY,
      }
    })
}

function TradesTab({
  rows,
  loading,
  error,
  symbol0,
  symbol1,
}: {
  rows: TradeRow[]
  loading: boolean
  error: boolean
  symbol0: string
  symbol1: string
}): JSX.Element {
  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 44px',
          gap: 6,
          padding: '9px 16px',
          fontFamily: MONO,
          fontSize: 10,
          color: terminalColors.ink3Alt,
          borderBottom: `1px solid ${terminalColors.line3}`,
        }}
      >
        <span>PRICE ({symbol1})</span>
        <span style={{ textAlign: 'right' }}>SIZE ({symbol0})</span>
        <span style={{ textAlign: 'right' }}>TIME</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 44px', gap: 6, padding: '7px 16px', alignItems: 'center' }}
            >
              <span style={{ height: 11, width: '70%', borderRadius: 3, background: terminalColors.line2 }} />
              <span style={{ height: 11, width: '50%', borderRadius: 3, background: terminalColors.line3, justifySelf: 'end' }} />
              <span style={{ height: 10, width: '80%', borderRadius: 3, background: terminalColors.line3, justifySelf: 'end' }} />
            </div>
          ))
        ) : error ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: SANS, fontSize: 12.5, color: terminalColors.redDown }}>
            Failed to load trades.
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt }}>
            No recent trades.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.key}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 44px', gap: 6, padding: '7px 16px', fontFamily: MONO, fontSize: 12, alignItems: 'center' }}
            >
              <span style={{ color: row.isBuy ? terminalColors.greenUp : terminalColors.redDown }}>{row.price}</span>
              <span style={{ textAlign: 'right', color: terminalColors.ink }}>{row.size}</span>
              <span style={{ textAlign: 'right', color: terminalColors.faint, fontSize: 10.5 }}>{row.time}</span>
            </div>
          ))
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------ your position */

function statusLabel(status: PositionStatus): { label: string; color: string } {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return { label: 'In range', color: terminalColors.greenDeep }
    case PositionStatus.OUT_OF_RANGE:
      return { label: 'Out of range', color: terminalColors.warn }
    default:
      return { label: 'Closed', color: terminalColors.ink3 }
  }
}

function YourPositionTab({
  connected,
  onConnect,
  positions,
  loading,
  fiat,
  onAddLiquidity,
}: {
  connected: boolean
  onConnect: () => void
  positions: PositionInfo[]
  loading: boolean
  fiat: (value: number | undefined) => string
  onAddLiquidity: () => void
}): JSX.Element {
  if (!connected) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, lineHeight: 1.5 }}>
          Connect your wallet to see your position in this pool.
        </div>
        <button
          type="button"
          onClick={onConnect}
          style={{
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 600,
            color: terminalColors.btnInk,
            background: terminalColors.brandGreen,
            border: 'none',
            padding: '9px 18px',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          Connect wallet
        </button>
      </div>
    )
  }
  if (loading) {
    return (
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} style={{ height: 14, width: '80%', borderRadius: 4, background: terminalColors.line2 }} />
        ))}
      </div>
    )
  }
  if (positions.length === 0) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink3Alt, lineHeight: 1.5 }}>
          You have no liquidity in this pool.
        </div>
        <button
          type="button"
          onClick={onAddLiquidity}
          style={{
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 600,
            color: terminalColors.ink,
            background: terminalColors.bg,
            border: `1px solid ${terminalColors.line}`,
            padding: '9px 16px',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          Add liquidity
        </button>
      </div>
    )
  }
  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {positions.map((p, index) => {
        const status = statusLabel(p.status)
        return (
          <div
            key={`${p.chainId}-${p.poolId}-${p.tokenId ?? index}`}
            style={{ border: `1px solid ${terminalColors.line2}`, borderRadius: 11, padding: '12px 13px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: terminalColors.ink }}>
                {p.currency0Amount.currency.symbol ?? '—'} / {p.currency1Amount.currency.symbol ?? '—'}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: status.color }}>{status.label}</span>
            </div>
            <PositionRow label="Value" value={fiat(p.totalValueUsd)} />
            <PositionRow label="Fees" value={fiat(p.uncollectedFeesUsd)} valueColor={(p.uncollectedFeesUsd ?? 0) > 0 ? terminalColors.greenUp : undefined} />
            <PositionRow label="APR" value={p.apr !== undefined ? `${p.apr.toFixed(1)}%` : '—'} last />
          </div>
        )
      })}
    </div>
  )
}

function PositionRow({ label, value, valueColor, last }: { label: string; value: string; valueColor?: string; last?: boolean }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11.5, marginBottom: last ? 0 : 7 }}>
      <span style={{ color: terminalColors.ink3 }}>{label}</span>
      <span style={{ color: valueColor ?? terminalColors.ink }}>{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------ pool composition */

function PoolComposition({
  symbol0,
  symbol1,
  amount0,
  amount1,
  usd0,
  usd1,
}: {
  symbol0: string
  symbol1: string
  amount0?: number
  amount1?: number
  usd0?: number
  usd1?: number
}): JSX.Element {
  const total = (usd0 ?? 0) + (usd1 ?? 0)
  const pct0 = total > 0 ? ((usd0 ?? 0) / total) * 100 : 50
  const pct1 = 100 - pct0
  const color0 = terminalColors.accentIndigo
  const color1 = terminalColors.accentBlue
  const hasSplit = total > 0

  return (
    <div style={{ borderTop: `1px solid ${terminalColors.line2}`, padding: '14px 16px', background: terminalColors.bgApp }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 12.5, color: terminalColors.ink, marginBottom: 10 }}>
        Pool composition
      </div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10, background: terminalColors.line2 }}>
        {hasSplit ? (
          <>
            <span style={{ width: `${pct0}%`, background: color0 }} />
            <span style={{ width: `${pct1}%`, background: color1 }} />
          </>
        ) : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11.5 }}>
        <span style={{ color: terminalColors.ink2 }}>
          <span style={{ color: color0 }}>●</span> {symbol0} {formatCompact(amount0)}
        </span>
        <span style={{ color: terminalColors.ink2 }}>
          <span style={{ color: color1 }}>●</span> {symbol1} {formatCompact(amount1)}
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- states */

function CenteredState({ title, detail }: { title: string; detail?: string }): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 480,
        textAlign: 'center',
        fontFamily: SANS,
      }}
    >
      <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: terminalColors.ink }}>{title}</div>
      {detail ? <div style={{ fontSize: 13, color: terminalColors.ink2, maxWidth: 380, lineHeight: 1.5 }}>{detail}</div> : null}
    </div>
  )
}

/* -------------------------------------------------------------- token logos */

function PairLogos({
  currency0,
  currency1,
  size,
}: {
  currency0?: Currency
  currency1?: Currency
  size: number
}): JSX.Element {
  return <DoubleCurrencyLogo currencies={[currency0, currency1]} size={size} />
}

/* -------------------------------------------------------------- the screen */

export function MarketDetailScreen(): JSX.Element {
  const { poolId } = useParams<{ poolId: string }>()
  const navigate = useNavigate()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const [timeframeIndex, setTimeframeIndex] = useState(0)
  const [sideTab, setSideTab] = useState<'trades' | 'position'>('trades')

  const parsed = useMemo(() => parsePoolId(poolId), [poolId])
  const chainId = parsed?.chainId
  const address = parsed?.address

  const { data: poolData, loading: poolLoading, error: poolError } = usePoolData({
    poolIdOrAddress: address ? normalizeAddress(address, AddressStringFormat.Lowercase) : '',
    chainId,
    isPoolAddress: address ? isEVMAddress(address) : false,
  })

  const protocolVersion = poolData?.protocolVersion
  const isV2 = protocolVersion === GraphQLApi.ProtocolVersion.V2
  const isV3 = protocolVersion === GraphQLApi.ProtocolVersion.V3
  const isV4 = protocolVersion === GraphQLApi.ProtocolVersion.V4

  // Real price series for the selected timeframe (same feed as the legacy PDP chart).
  const timeframe = TIMEFRAMES[timeframeIndex]
  const priceQuery = usePoolPriceChartData({
    variables: chainId
      ? {
          addressOrId: poolData?.idOrAddress ?? '',
          chain: toGraphQLChain(chainId),
          duration: toHistoryDuration(timeframe.period),
          isV2,
          isV3,
          isV4,
        }
      : undefined,
    priceInverted: false,
  })

  // Real recent swaps for the trade tape.
  const txResult = usePoolTransactions({
    address: address ?? '',
    chainId,
    token0: poolData?.token0,
    protocolVersion,
    filter: [PoolTableTransactionType.BUY, PoolTableTransactionType.SELL],
  })

  // Real wallet LP positions, filtered to this pool.
  const positionsResult = useWalletPositions({ account: account.address ?? '', disabled: !account.address })
  const poolPositions = useMemo(() => {
    if (!address) {
      return []
    }
    return positionsResult.positions.filter(
      (p) => p.chainId === chainId && p.poolId?.toLowerCase() === address.toLowerCase(),
    )
  }, [positionsResult.positions, address, chainId])

  // Unwrap WETH → ETH for display (v2/v3 only — no v4 native/WETH ambiguity here).
  const [token0, token1] = useMemo(() => {
    if (!poolData || chainId === undefined) {
      return [undefined, undefined] as const
    }
    return [unwrapToken(chainId, poolData.token0), unwrapToken(chainId, poolData.token1)] as const
  }, [poolData, chainId])
  const currency0 = token0 ? gqlToCurrency(token0) : undefined
  const currency1 = token1 ? gqlToCurrency(token1) : undefined
  const symbol0 = currency0?.symbol ?? poolData?.token0?.symbol ?? '—'
  const symbol1 = currency1?.symbol ?? poolData?.token1?.symbol ?? '—'

  // Derived price stats from the real close series.
  const closes = useMemo(() => priceQuery.entries.map((e) => e.close), [priceQuery.entries])
  const priceStats = useMemo(() => {
    if (closes.length === 0) {
      return undefined
    }
    const open = closes[0]
    const close = closes[closes.length - 1]
    return {
      open,
      high: Math.max(...closes),
      low: Math.min(...closes),
      close,
      changePct: open > 0 ? ((close - open) / open) * 100 : undefined,
    }
  }, [closes])

  const fiatStats = (value: number | undefined): string =>
    value !== undefined && value > 0 ? convertFiatAmountFormatted(value, NumberType.FiatTokenStats) : '—'
  const fiatBalance = (value: number | undefined): string =>
    value !== undefined ? convertFiatAmountFormatted(value, NumberType.PortfolioBalance) : '$0.00'

  const feeTierLabel = useMemo(() => {
    const amount = poolData?.feeTier?.feeAmount
    if (amount === undefined) {
      return undefined
    }
    // Uniswap fee amounts are hundredths of a bip (500 → 0.05%).
    return `${(amount / 10000).toFixed(2)}%`
  }, [poolData?.feeTier?.feeAmount])

  const fees24h = useMemo(() => {
    const amount = poolData?.feeTier?.feeAmount
    const isDynamic = poolData?.feeTier?.isDynamic ?? false
    if (amount === undefined || isDynamic || poolData?.volumeUSD24H === undefined) {
      return undefined
    }
    return poolData.volumeUSD24H * (amount / 1_000_000)
  }, [poolData?.feeTier?.feeAmount, poolData?.feeTier?.isDynamic, poolData?.volumeUSD24H])

  const aprLabel = useMemo(() => {
    const apr = calculateApr({
      volume24h: poolData?.volumeUSD24H,
      tvl: poolData?.tvlUSD,
      feeTier: poolData?.feeTier?.feeAmount,
    })
    return `${apr.toFixed(1)}%`
  }, [poolData?.volumeUSD24H, poolData?.tvlUSD, poolData?.feeTier?.feeAmount])

  const tradeRows = useMemo(() => buildTradeRows(txResult.transactions), [txResult.transactions])

  // Pool composition — USD split from real reserves × real token prices.
  const usd0 = poolData?.tvlToken0 !== undefined && poolData.token0Price !== undefined ? poolData.tvlToken0 * poolData.token0Price : undefined
  const usd1 = poolData?.tvlToken1 !== undefined && poolData.token1Price !== undefined ? poolData.tvlToken1 * poolData.token1Price : undefined

  /* ------------------------------------------------------------- guards */

  if (!parsed) {
    return (
      <div style={{ padding: '20px 24px' }}>
        <CenteredState
          title="Market not found"
          detail="This market link is malformed. Open a pool from Markets to view its detail."
        />
      </div>
    )
  }

  if (!poolLoading && !poolData) {
    return (
      <div style={{ padding: '20px 24px' }}>
        <CenteredState
          title={poolError ? 'Failed to load market' : 'Market not found'}
          detail={
            poolError
              ? 'We could not load this pool. It may be on a network without an indexed pools feed.'
              : 'No pool exists at this address on the selected network.'
          }
        />
      </div>
    )
  }

  const priceLabel = priceStats ? formatRatio(priceStats.close) : '—'

  /* ------------------------------------------------------------- render */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Pair-identity header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: `1px solid ${terminalColors.line2}`,
          background: terminalColors.bg,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <PairLogos currency0={currency0} currency1={currency1} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 20, color: terminalColors.ink }}>
                {symbol0} / {symbol1}
              </span>
              {/* Fee-tier badge only — NO hook badge (hooks removed). */}
              {feeTierLabel ? (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: terminalColors.ink2,
                    background: terminalColors.panel2,
                    padding: '3px 8px',
                    borderRadius: 5,
                  }}
                >
                  {feeTierLabel}
                </span>
              ) : null}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: terminalColors.ink3Alt, marginTop: 4 }}>
              {shortAddress(poolData?.idOrAddress ?? address)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <HeaderStat label="Price" value={priceLabel} size={19} />
          <HeaderStat
            label={timeframe.changeLabel}
            value={priceStats?.changePct !== undefined ? formatSignedPct(priceStats.changePct) : '—'}
            valueColor={
              priceStats?.changePct === undefined
                ? terminalColors.faint
                : priceStats.changePct >= 0
                  ? terminalColors.greenUp
                  : terminalColors.redDown
            }
            size={15}
          />
          <div style={{ display: 'flex', gap: 9 }}>
            <button
              type="button"
              onClick={() => navigate('/swap')}
              style={{
                background: terminalColors.brandGreen,
                color: terminalColors.btnInk,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 13,
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Swap
            </button>
            <button
              type="button"
              onClick={() => navigate('/terminal/pools/new')}
              style={{
                background: terminalColors.bg,
                border: `1px solid ${terminalColors.line}`,
                color: terminalColors.ink,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 13,
                padding: '9px 16px',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              Add liquidity
            </button>
          </div>
        </div>
      </div>

      {/* Body: chart + KPIs (left) · trades / position (right).
          Responsive: both columns wrap/stack when the content area is too narrow
          (left min 320 + right min 300 → wraps below ~640px content), so the screen
          never overflows the 226px-rail shell horizontally. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: 600 }}>
        <div
          style={{
            flex: '1 1 360px',
            minWidth: 320,
            padding: '18px 20px',
            borderRight: `1px solid ${terminalColors.line2}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Timeframe tabs + O/H/L/C readout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {TIMEFRAMES.map((tf, index) => {
                const active = index === timeframeIndex
                return (
                  <button
                    key={tf.label}
                    type="button"
                    onClick={() => setTimeframeIndex(index)}
                    style={{
                      fontFamily: MONO,
                      fontSize: 11.5,
                      fontWeight: active ? 600 : 400,
                      color: active ? terminalColors.ink : terminalColors.ink2,
                      background: active ? terminalColors.panel2Alt : 'transparent',
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {tf.label}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 14, fontFamily: MONO, fontSize: 11, color: terminalColors.ink3Alt }}>
              <span>
                O <span style={{ color: terminalColors.ink }}>{priceStats ? formatRatio(priceStats.open) : '—'}</span>
              </span>
              <span>
                H <span style={{ color: terminalColors.ink }}>{priceStats ? formatRatio(priceStats.high) : '—'}</span>
              </span>
              <span>
                L <span style={{ color: terminalColors.ink }}>{priceStats ? formatRatio(priceStats.low) : '—'}</span>
              </span>
              <span>
                C{' '}
                <span
                  style={{
                    color:
                      priceStats?.changePct === undefined
                        ? terminalColors.ink
                        : priceStats.changePct >= 0
                          ? terminalColors.greenUp
                          : terminalColors.redDown,
                  }}
                >
                  {priceStats ? formatRatio(priceStats.close) : '—'}
                </span>
              </span>
            </div>
          </div>

          <PriceAreaChart closes={closes} loading={priceQuery.loading || poolLoading} />

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 14 }}>
            <KpiTile label="TVL" value={poolLoading ? undefined : fiatStats(poolData?.tvlUSD)} />
            <KpiTile label="24h volume" value={poolLoading ? undefined : fiatStats(poolData?.volumeUSD24H)} />
            <KpiTile label="24h fees" value={poolLoading ? undefined : fiatStats(fees24h)} />
            <KpiTile label="APR" value={poolLoading ? undefined : aprLabel} valueColor={terminalColors.greenUp} />
          </div>
        </div>

        {/* Right column — holds ~330px at wide widths (flex-grow 0), shrinks to a
            300px floor then wraps below the chart on narrow content areas. */}
        <div style={{ flex: '0 1 330px', minWidth: 300, background: terminalColors.bg, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', padding: '12px 16px 0', gap: 16, borderBottom: `1px solid ${terminalColors.line2}` }}>
            {(['trades', 'position'] as const).map((tab) => {
              const active = sideTab === tab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSideTab(tab)}
                  style={{
                    fontFamily: SANS,
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 500,
                    color: active ? terminalColors.ink : terminalColors.ink3Alt,
                    paddingBottom: 9,
                    borderBottom: active ? `2px solid ${terminalColors.brandGreen}` : '2px solid transparent',
                    background: 'transparent',
                    border: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {tab === 'trades' ? 'Trades' : 'Your position'}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {sideTab === 'trades' ? (
              <TradesTab
                rows={tradeRows}
                loading={txResult.loading && tradeRows.length === 0}
                error={Boolean(txResult.error)}
                symbol0={symbol0}
                symbol1={symbol1}
              />
            ) : (
              <YourPositionTab
                connected={Boolean(account.address)}
                onConnect={() => accountDrawer.open()}
                positions={poolPositions}
                loading={positionsResult.isLoading && !positionsResult.hasData}
                fiat={fiatBalance}
                onAddLiquidity={() => navigate('/terminal/pools/new')}
              />
            )}
          </div>

          {/* Pool composition (live reserves) */}
          <PoolComposition
            symbol0={symbol0}
            symbol1={symbol1}
            amount0={poolData?.tvlToken0}
            amount1={poolData?.tvlToken1}
            usd0={usd0}
            usd1={usd1}
          />
        </div>
      </div>
    </div>
  )
}
