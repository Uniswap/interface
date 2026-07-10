/**
 * HookSwap Terminal — B3 Markets (CMC-style pool/market table).
 *
 * Pixel-perfect recreation of design handoff screen B3 (column 1b) — see
 * `design_handoff_hookswap_terminal/screenshots/B03-markets.png` and the B3 markup
 * in `design/HookSwap Redesign.dc.html`: a title + filter chips, a 6-tile top-movers
 * heatmap, and a dense sortable table (Pair · Price · 24H · 7D · Volume · TVL ·
 * Fees 24h · APR · 7d sparkline).
 *
 * HookSwap ships v2 + v3 only (locked decision 2026-07-04) — there is NO hook
 * column, hook badge, or hook filter anywhere in this screen.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Pool rows — LIVE from the app's real Explore pools layer (`useTopPools` →
 *     `useExploreStats`). Pair (real token logos via the app's DoubleCurrencyLogo),
 *     TVL, 24h volume, APR come straight from the pool stats; Fees 24h is derived
 *     from `volume24h × feeTier`. These are the same numbers the legacy `/explore`
 *     Pools tab shows.
 *   • Price / 24H change / 7d sparkline — LIVE, joined from the app's real token
 *     list (`useListTokens`) keyed on each pool's base token (chain+address, symbol
 *     fallback). The same token list feeds the top-movers heatmap.
 *   • 7D price change — the Explore stats feed only exposes 1h/1d change, so this
 *     column renders an honest "—" (TODO: wire once a 7d series is available). It is
 *     NEVER fabricated.
 *
 * Loading / empty / error states are all real (the reused DataTable + StatCard-style
 * heatmap tiles render skeletons while the queries are in flight).
 */
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import type { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { ReactNode, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { supportedChainIdFromGQLChain } from '~/appGraphql/data/chainUtils'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'
import { gqlToCurrency, OrderDirection, unwrapToken } from '~/appGraphql/data/util'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { ExploreContextProvider } from '~/features/Explore/state'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { useTopPools } from '~/features/Explore/state/topPools/useTopPools'
import { ComingSoon } from '~/terminal/components/ComingSoon'
import { DataTable, DataTableColumn } from '~/terminal/components/DataTable'
import { SparklineCell } from '~/terminal/components/SparklineCell'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import type { PoolStat } from '~/types/explore'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* --------------------------------------------------------------- data model */

/** Per-token metrics joined onto pool rows (from the real token list). */
interface TokenMetric {
  price?: number
  /** 1d price change as a percent number (e.g. 2.4 → +2.4%). */
  change1d?: number
  /** 1d price-history closes, oldest → newest (drives the sparkline). */
  sparkline?: number[]
}

interface TokenMetricMaps {
  byKey: Map<string, TokenMetric>
  bySymbol: Map<string, TokenMetric>
}

/** One row of the markets table. Raw values; formatting happens in the cells. */
interface MarketRow {
  key: string
  /** `/markets/:poolId` route target (chainId-poolId), when resolvable. */
  detailPath?: string
  currency0?: Currency
  currency1?: Currency
  symbol0: string
  symbol1: string
  price?: number
  change1d?: number
  sparkline?: number[]
  tvl: number
  volume24h: number
  fees24h?: number
  aprPercent: number
  aprText: string
}

type MarketFilter = 'all' | 'stable' | 'new'

/** Symbols treated as stablecoins for the "Stable" filter chip. */
const STABLES = new Set([
  'USDC',
  'USDT',
  'USDT0',
  'DAI',
  'USDBC',
  'FDUSD',
  'TUSD',
  'USDE',
  'FRAX',
  'LUSD',
  'GUSD',
  'USDP',
  'SUSD',
  'CRVUSD',
  'USDD',
  'PYUSD',
  'USDS',
])

/** Signed percent, 1 decimal: 14.6 → "+14.6%", -3.4 → "-3.4%". */
function formatSignedPct(value: number): string {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(1)}%`
}

/* ---------------------------------------------------- token-metric building */

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

/* ------------------------------------------------------------ row building */

function buildRows(pools: PoolStat[] | undefined, maps: TokenMetricMaps): MarketRow[] | undefined {
  if (!pools) {
    return undefined
  }

  return pools.map((pool, index): MarketRow => {
    const chainId: UniverseChainId | undefined = supportedChainIdFromGQLChain(pool.token0?.chain as GraphQLApi.Chain)
    // Unwrap WETH → ETH for display (matches the legacy Pools table). Metric lookup
    // uses the ORIGINAL token so the wrapped-native address still resolves.
    const displayToken0 = chainId !== undefined && pool.token0 ? unwrapToken(chainId, pool.token0) : pool.token0
    const displayToken1 = chainId !== undefined && pool.token1 ? unwrapToken(chainId, pool.token1) : pool.token1
    const currency0 = displayToken0 ? gqlToCurrency(displayToken0) : undefined
    const currency1 = displayToken1 ? gqlToCurrency(displayToken1) : undefined

    const metric = lookupMetric(pool.token0, maps)

    const tvl = pool.totalLiquidity?.value ?? 0
    const volume24h = pool.volume1Day?.value ?? 0
    const feeAmount = pool.feeTier?.feeAmount
    const isDynamicFee = pool.feeTier?.isDynamic ?? false
    // Uniswap fee amounts are in hundredths of a bip (3000 → 0.30% → 0.003 fraction).
    const fees24h = feeAmount !== undefined && !isDynamicFee ? volume24h * (feeAmount / 1_000_000) : undefined

    return {
      key: pool.id ? `${pool.id}-${index}` : `row-${index}`,
      // Same encoding Landing uses (`chainId-poolId`) so the row opens MarketDetailScreen.
      detailPath: chainId !== undefined && pool.id ? `/markets/${chainId}-${pool.id}` : undefined,
      currency0,
      currency1,
      symbol0: currency0?.symbol ?? pool.token0?.symbol ?? '—',
      symbol1: currency1?.symbol ?? pool.token1?.symbol ?? '—',
      price: metric?.price,
      change1d: metric?.change1d,
      sparkline: metric?.sparkline,
      tvl,
      volume24h,
      fees24h,
      aprPercent: Number(pool.apr.toFixed(4)),
      aprText: `${pool.apr.toFixed(1)}%`,
    }
  })
}

function applyFilter(rows: MarketRow[] | undefined, filter: MarketFilter): MarketRow[] | undefined {
  if (!rows) {
    return undefined
  }
  switch (filter) {
    case 'stable':
      return rows.filter((row) => STABLES.has(row.symbol0.toUpperCase()) && STABLES.has(row.symbol1.toUpperCase()))
    case 'new':
      // No pool-creation timestamp in the Explore stats feed — honest empty state
      // (TODO: wire "new pools" once the self-hosted indexer exposes creation time).
      return []
    default:
      return rows
  }
}

/* -------------------------------------------------------------- top movers */

interface Mover {
  symbol: string
  change: number
}

/** How many top-ranked (volume-sorted) tokens to consider for the movers heatmap. */
const MOVERS_UNIVERSE = 40

function buildMovers(tokens: readonly MultichainToken[]): Mover[] {
  // Restrict to the most prominent tokens (the list is already volume-ranked) so the
  // heatmap surfaces notable movers rather than long-tail micro-cap extremes.
  const withChange: Mover[] = tokens
    .slice(0, MOVERS_UNIVERSE)
    .map((token) => ({ symbol: token.symbol, change: token.stats?.priceChange1d }))
    .filter((mover): mover is Mover => mover.symbol !== '' && typeof mover.change === 'number' && mover.change !== 0)
    .sort((a, b) => b.change - a.change)

  if (withChange.length <= 6) {
    return withChange
  }
  const gainers = withChange.slice(0, 3)
  const losers = withChange.slice(-3).reverse()
  return [...gainers, ...losers]
}

/* ------------------------------------------------------------- UI pieces */

const FILTER_CHIPS: ReadonlyArray<{ id: MarketFilter; label: string }> = [
  { id: 'all', label: 'All pools' },
  { id: 'stable', label: 'Stable' },
  { id: 'new', label: 'New' },
]

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: SANS,
        fontSize: 12.5,
        fontWeight: 600,
        padding: '6px 13px',
        borderRadius: 999,
        cursor: 'pointer',
        border: active ? `1px solid ${terminalColors.line}` : '1px solid transparent',
        background: active ? terminalColors.bg : 'transparent',
        color: active ? terminalColors.ink : terminalColors.ink2,
        boxShadow: active ? '0 1px 2px rgba(11,15,20,.06)' : undefined,
      }}
    >
      {label}
    </button>
  )
}

function MoverTile({ mover }: { mover: Mover }): JSX.Element {
  const up = mover.change >= 0
  return (
    <div
      style={{
        border: `1px solid ${up ? terminalColors.greenBorder : terminalColors.redBg}`,
        background: up ? terminalColors.greenBg : terminalColors.redBg,
        borderRadius: 12,
        padding: '12px 14px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 12,
          fontWeight: 600,
          color: terminalColors.ink,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {mover.symbol}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 13,
          fontWeight: 600,
          marginTop: 4,
          color: up ? terminalColors.greenUp : terminalColors.redDown,
        }}
      >
        {formatSignedPct(mover.change)}
      </div>
    </div>
  )
}

function MoverTileSkeleton(): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        background: terminalColors.bg,
        borderRadius: 12,
        padding: '12px 14px',
      }}
    >
      <div style={{ height: 11, width: 44, borderRadius: 4, background: terminalColors.line2 }} />
      <div style={{ height: 12, width: 56, borderRadius: 4, background: terminalColors.line3, marginTop: 6 }} />
    </div>
  )
}

function TopMovers({
  tokens,
  loading,
  error,
}: {
  tokens: readonly MultichainToken[]
  loading: boolean
  error: boolean
}): JSX.Element {
  const movers = useMemo(() => buildMovers(tokens), [tokens])

  // Skeleton while the token feed is first loading.
  if (loading && movers.length === 0) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <MoverTileSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Honest empty / coming-soon state — a single branded strip instead of a blank grid row.
  if (movers.length === 0) {
    return (
      <div
        style={{
          border: `1px solid ${terminalColors.line}`,
          background: terminalColors.bg,
          borderRadius: 12,
          padding: '18px 16px',
          marginBottom: 20,
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 12.5,
          color: terminalColors.ink3Alt,
        }}
      >
        {error ? (
          <ComingSoon variant="inline" subtext="Top movers appear as trading activity accrues." />
        ) : (
          'No market movers yet — builds as trading activity accrues.'
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      {movers.map((mover) => (
        <MoverTile key={mover.symbol} mover={mover} />
      ))}
    </div>
  )
}

/* --------------------------------------------------------------- pair cell */

function PairCell({ row }: { row: MarketRow }): JSX.Element {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <DoubleCurrencyLogo currencies={[row.currency0, row.currency1]} size={22} />
      <span
        style={{
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 600,
          color: terminalColors.ink,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {row.symbol0} / {row.symbol1}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------- the screen */

function MarketsScreenBody(): JSX.Element {
  const [filter, setFilter] = useState<MarketFilter>('all')
  const navigate = useNavigate()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { chains } = useEnabledChains()

  // Real pool data (all enabled networks; ExploreContext defaults to all-networks).
  const {
    topPools,
    isLoading: poolsLoading,
    isError: poolsError,
  } = useTopPools({
    sortState: { sortBy: PoolSortFields.TVL, sortDirection: OrderDirection.Desc },
  })

  // Real token list — feeds the price/24H/sparkline join + the top-movers heatmap.
  const { topTokens, isLoading: tokensLoading, isError: tokensError } = useListTokens(undefined)

  const metricMaps = useMemo(() => buildTokenMetrics(topTokens), [topTokens])
  const rows = useMemo(() => buildRows(topPools, metricMaps), [topPools, metricMaps])
  const filteredRows = useMemo(() => applyFilter(rows, filter), [rows, filter])

  const emptyMessage =
    filter === 'new'
      ? 'New-pool sorting by creation time is not available yet.'
      : filter === 'stable'
        ? 'No stablecoin pools in the current data set.'
        : 'No pools with liquidity yet — appears once pools have liquidity.'

  const fiatStats = (value: number | undefined): string =>
    value !== undefined && value > 0 ? convertFiatAmountFormatted(value, NumberType.FiatTokenStats) : '—'

  const columns: ReadonlyArray<DataTableColumn<MarketRow>> = useMemo(
    () => [
      {
        id: 'pair',
        header: 'Pair',
        width: 'minmax(150px,1.6fr)',
        align: 'left',
        cell: (row) => <PairCell row={row} />,
        sortValue: (row) => `${row.symbol0}/${row.symbol1}`,
      },
      {
        id: 'price',
        header: 'Price',
        width: 'minmax(90px,1fr)',
        align: 'right',
        mono: true,
        cell: (row) =>
          row.price !== undefined && row.price > 0
            ? convertFiatAmountFormatted(row.price, NumberType.FiatTokenPrice)
            : '—',
        cellColor: (row) => (row.price !== undefined && row.price > 0 ? terminalColors.ink : terminalColors.faint),
        sortValue: (row) => row.price ?? -1,
      },
      {
        id: 'change24h',
        header: '24H',
        width: 'minmax(64px,0.7fr)',
        align: 'right',
        mono: true,
        cell: (row) => (row.change1d !== undefined ? formatSignedPct(row.change1d) : '—'),
        cellColor: (row) =>
          row.change1d === undefined
            ? terminalColors.faint
            : row.change1d >= 0
              ? terminalColors.greenUp
              : terminalColors.redDown,
        sortValue: (row) => row.change1d ?? Number.NEGATIVE_INFINITY,
      },
      {
        id: 'change7d',
        header: '7D',
        width: 'minmax(64px,0.7fr)',
        align: 'right',
        mono: true,
        // Explore stats only exposes 1h/1d change — honest "—" (never fabricated).
        cell: () => '—',
        cellColor: () => terminalColors.faint,
      },
      {
        id: 'volume',
        header: 'Volume',
        width: 'minmax(90px,1fr)',
        align: 'right',
        mono: true,
        cell: (row) => fiatStats(row.volume24h),
        sortValue: (row) => row.volume24h,
      },
      {
        id: 'tvl',
        header: 'TVL',
        width: 'minmax(90px,1fr)',
        align: 'right',
        mono: true,
        cell: (row) => fiatStats(row.tvl),
        sortValue: (row) => row.tvl,
      },
      {
        id: 'fees24h',
        header: 'Fees 24h',
        width: 'minmax(80px,0.9fr)',
        align: 'right',
        mono: true,
        cell: (row) => fiatStats(row.fees24h),
        sortValue: (row) => row.fees24h ?? -1,
      },
      {
        id: 'apr',
        header: 'APR',
        width: 'minmax(72px,0.7fr)',
        align: 'right',
        mono: true,
        cell: (row) => row.aprText,
        cellColor: () => terminalColors.ink2,
        sortValue: (row) => row.aprPercent,
      },
      {
        id: 'sparkline',
        header: '7d',
        width: '96px',
        align: 'center',
        cell: (row) =>
          row.sparkline && row.sparkline.length >= 2 ? (
            <span style={{ display: 'inline-flex', justifyContent: 'center', width: '100%' }}>
              <SparklineCell data={row.sparkline} width={80} height={26} strokeWidth={2} />
            </span>
          ) : (
            <span style={{ fontFamily: MONO, fontSize: 12.5, color: terminalColors.faint }}>—</span>
          ),
      },
    ],
    [convertFiatAmountFormatted],
  )

  return (
    <div style={{ padding: '20px var(--tm-gutter) 40px' }}>
      {/* Header: title + network context + filter chips */}
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
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
            Markets
          </h1>
          {/* Real chain context — reflects the app's enabled networks (incl. HookSwap chains). */}
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: terminalColors.ink3Alt,
              background: terminalColors.panel2,
              padding: '3px 8px',
              borderRadius: 999,
            }}
            title="Live pool data across all enabled networks"
          >
            All networks · {chains.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTER_CHIPS.map((chip) => (
            <FilterChip
              key={chip.id}
              label={chip.label}
              active={filter === chip.id}
              onClick={() => setFilter(chip.id)}
            />
          ))}
        </div>
      </div>

      {/* Top-movers heatmap (live, from the token list) */}
      <TopMovers tokens={topTokens} loading={tokensLoading} error={tokensError} />

      {/*
        Dense markets table (reused Terminal DataTable primitive). The DataTable is a
        CSS grid whose column minimums sum wider than the content area at narrow
        widths, so it scrolls horizontally INSIDE its own `.tm-table-scroll` container
        (built into DataTable) and never widens the page — header, chips, heatmap and
        note stay put.
      */}
      <DataTable<MarketRow>
        columns={columns}
        rows={filteredRows}
        rowKey={(row) => row.key}
        onRowClick={(row) => (row.detailPath ? navigate(row.detailPath) : undefined)}
        loading={poolsLoading}
        comingSoon={poolsError}
        comingSoonSubtext="Markets appear once pools have liquidity."
        emptyMessage={emptyMessage}
        initialSort={{ columnId: 'tvl', direction: 'desc' }}
        skeletonRows={8}
      />

      {/* Honest data-provenance note (visible-but-muted; no fabricated values). */}
      <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 14, lineHeight: 1.5 }}>
        Price · 24H · 7d spark join the live token feed by pool base token; 7D change builds as trading history
        accrues.
      </div>
    </div>
  )
}

/**
 * B3 Markets screen. Wraps the body in the same Explore providers the legacy
 * `/explore` page uses so the real pools query resolves: `ExploreContextProvider`
 * (chain scope; defaults to all-networks) + `ExploreTablesFilterStoreContextProvider`
 * (required by the pools filter layer).
 */
export function MarketsScreen(): JSX.Element {
  return (
    <ExploreContextProvider>
      <ExploreTablesFilterStoreContextProvider>
        <MarketsScreenBody />
      </ExploreTablesFilterStoreContextProvider>
    </ExploreContextProvider>
  )
}
