/**
 * HookSwap Terminal — B5 Portfolio (connected-wallet dashboard).
 *
 * Pixel-perfect recreation of design handoff screen B5 (column 1b) — see
 * `design_handoff_hookswap_terminal/screenshots/B05-portfolio.png` and the B5 markup
 * in `design/HookSwap Redesign.dc.html`: a 4-cell KPI row (Net worth · 24h PnL ·
 * Fees earned · positions), a left Open-positions table, and a right column with an
 * allocation donut + a compact activity feed.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • KPIs — LIVE from the app's real portfolio layer. Net worth + 24h PnL come from
 *     `usePortfolioTotalValue` (REST wallet-balances: `balanceUSD`, `absoluteChangeUSD`,
 *     `percentChange`). Fees claimable = sum of the wallet's real LP position
 *     `uncollectedFeesUsd`. The 4th tile reports the real open-position count (the
 *     design's "Active hooks" is relabelled — HookSwap ships v2+v3, no hooks).
 *   • Open positions — LIVE from `useWalletPositions` (the same REST positions feed the
 *     legacy `/positions` page uses): pair (real token logos), value, fees, APR, and
 *     in/out-of-range status. Per-position 24h PnL is NOT in the positions feed, so that
 *     column renders an honest "—" (never fabricated).
 *   • Allocation donut — LIVE from the wallet's real token balances (`usePortfolioData`),
 *     top holdings by USD value + an "Other" bucket.
 *   • Activity feed — LIVE from `useActivityData` (real local + indexed tx history);
 *     title via the app's real `getTransactionSummaryTitle`, timestamps from `addedTime`.
 *
 * Disconnected → an honest "Connect wallet" empty state (B9 style). All loading / empty
 * states are real over the live hooks.
 */
import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import {
  usePortfolioData,
  usePortfolioTotalValue,
} from 'uniswap/src/features/dataApi/balances/balancesRest'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { isSectionHeader, isLoadingItem } from 'uniswap/src/components/activity/utils'
import type { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { NumberType } from 'utilities/src/format/types'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { useAccount } from '~/hooks/useAccount'
import { DataTable, DataTableColumn } from '~/terminal/components/DataTable'
import {
  terminalColors,
  terminalFonts,
} from '~/terminal/theme/tokens'
import { formatRelativeTime } from '~/terminal/utils/time'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* ------------------------------------------------------------------ helpers */

/** Signed USD, e.g. 1393.8 → "+$1,393.80", -118.2 → "-$118.20". */
function formatSignedUsd(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Signed percent, 2 decimals: 2.74 → "+2.74%". */
function formatSignedPct(value: number): string {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}%`
}

/** Colours for the allocation donut slices (category accents, then a muted "Other"). */
const ALLOC_COLORS = [
  terminalColors.accentIndigo,
  terminalColors.accentBlue,
  terminalColors.greenUp,
  terminalColors.accentPurple,
  terminalColors.accentPink,
  terminalColors.accentTeal,
] as const
const OTHER_COLOR = terminalColors.faint

/* --------------------------------------------------------------- position status */

function statusStyle(status: PositionStatus): { label: string; color: string; background: string; border: string } {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return {
        label: 'In range',
        color: terminalColors.greenDeep,
        background: terminalColors.greenBg,
        border: terminalColors.greenBorder,
      }
    case PositionStatus.OUT_OF_RANGE:
      return {
        label: 'Out of range',
        color: '#C4712A',
        background: terminalColors.warnBg,
        border: terminalColors.warnBg,
      }
    case PositionStatus.CLOSED:
    default:
      return {
        label: 'Closed',
        color: terminalColors.ink3,
        background: terminalColors.panel2,
        border: terminalColors.line,
      }
  }
}

function StatusPill({ status }: { status: PositionStatus }): JSX.Element {
  const s = statusStyle(status)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: 600,
        color: s.color,
        background: s.background,
        border: `1px solid ${s.border}`,
        padding: '3px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  )
}

/* ------------------------------------------------------------------ KPI card */

interface KpiProps {
  label: string
  value?: string
  valueColor?: string
  sub?: string
  subColor?: string
  loading?: boolean
}

function Kpi({ label, value, valueColor, sub, subColor, loading }: KpiProps): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 14,
        background: terminalColors.bg,
        padding: '16px 18px',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>{label}</div>
      {loading ? (
        <div style={{ height: 26, width: 96, borderRadius: 4, background: terminalColors.line2, marginTop: 8 }} />
      ) : (
        <div
          style={{
            fontFamily: MONO,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: valueColor ?? terminalColors.ink,
            marginTop: 6,
          }}
        >
          {value ?? '—'}
        </div>
      )}
      {sub && !loading ? (
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: subColor ?? terminalColors.ink3Alt, marginTop: 6 }}>
          {sub}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ allocation donut */

interface AllocSlice {
  symbol: string
  percent: number
  color: string
}

function buildAllocation(balances: Record<string, PortfolioBalance> | undefined): AllocSlice[] | undefined {
  if (!balances) {
    return undefined
  }
  const rows = Object.values(balances)
    .map((b) => ({ symbol: b.currencyInfo.currency.symbol ?? '—', usd: b.balanceUSD ?? 0 }))
    .filter((r) => r.usd > 0)
    .sort((a, b) => b.usd - a.usd)

  const total = rows.reduce((sum, r) => sum + r.usd, 0)
  if (total <= 0) {
    return []
  }

  const top = rows.slice(0, ALLOC_COLORS.length)
  const otherUsd = rows.slice(ALLOC_COLORS.length).reduce((sum, r) => sum + r.usd, 0)

  const slices: AllocSlice[] = top.map((r, i) => ({
    symbol: r.symbol,
    percent: (r.usd / total) * 100,
    color: ALLOC_COLORS[i],
  }))
  if (otherUsd > 0) {
    slices.push({ symbol: 'Other', percent: (otherUsd / total) * 100, color: OTHER_COLOR })
  }
  return slices
}

function AllocationDonut({ slices, loading }: { slices?: AllocSlice[]; loading: boolean }): JSX.Element {
  const gradient = useMemo(() => {
    if (!slices || slices.length === 0) {
      return undefined
    }
    let acc = 0
    const stops = slices.map((s) => {
      const start = acc
      acc += s.percent
      return `${s.color} ${start.toFixed(2)}% ${acc.toFixed(2)}%`
    })
    return `conic-gradient(${stops.join(',')})`
  }, [slices])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: '50%',
            background: loading || !gradient ? terminalColors.line2 : gradient,
          }}
        />
        {/* Donut hole */}
        <div
          style={{
            position: 'absolute',
            inset: 18,
            borderRadius: '50%',
            background: terminalColors.bg,
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, flex: 1 }}>
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ height: 12, width: '70%', borderRadius: 4, background: terminalColors.line2 }} />
          ))
        ) : slices && slices.length > 0 ? (
          slices.map((s) => (
            <div key={s.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2, flex: 1, minWidth: 0 }}>
                {s.symbol}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: terminalColors.ink }}>
                {s.percent.toFixed(0)}%
              </span>
            </div>
          ))
        ) : (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt }}>No token balances.</div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ activity feed */

interface FeedItem {
  id: string
  title: string
  detail: string
  timestamp: string
}

function ActivityFeed({
  items,
  loading,
  error,
}: {
  items?: FeedItem[]
  loading: boolean
  error?: boolean
}): JSX.Element {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i}>
            <div style={{ height: 12, width: '55%', borderRadius: 4, background: terminalColors.line2 }} />
            <div style={{ height: 10, width: '75%', borderRadius: 4, background: terminalColors.line3, marginTop: 6 }} />
          </div>
        ))}
      </div>
    )
  }
  if (error) {
    return <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.redDown }}>Failed to load activity.</div>
  }
  if (!items || items.length === 0) {
    return <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt }}>No recent activity.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, index) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 10,
            padding: '11px 0',
            borderTop: index === 0 ? undefined : `1px solid ${terminalColors.line3}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: terminalColors.ink }}>
              {item.title}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt, marginTop: 2 }}>
              {item.detail}
            </div>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.faint, whiteSpace: 'nowrap' }}>
            {item.timestamp}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ card wrapper */

function Card({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 14,
        background: terminalColors.bg,
        padding: 18,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: terminalColors.ink, marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ connect state */

function ConnectState({ onConnect }: { onConnect: () => void }): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        minHeight: 420,
        textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: terminalColors.ink }}>
        Connect your wallet
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13.5, color: terminalColors.ink2, maxWidth: 340, lineHeight: 1.5 }}>
        Connect a wallet to see your net worth, open positions, allocation, and activity.
      </div>
      <button
        type="button"
        onClick={onConnect}
        style={{
          marginTop: 6,
          fontFamily: SANS,
          fontSize: 14,
          fontWeight: 600,
          color: terminalColors.btnInk,
          background: terminalColors.brandGreen,
          border: 'none',
          padding: '11px 22px',
          borderRadius: 12,
          cursor: 'pointer',
        }}
      >
        Connect wallet
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ the screen */

export function PortfolioScreen(): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const address = account.address
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Live net worth + 24h change (real REST wallet-balances).
  const totalValue = usePortfolioTotalValue({ evmAddress: address })

  // Live token balances (real) — feeds the allocation donut.
  const balancesResult = usePortfolioData({ evmAddress: address })

  // Live LP positions (real) — feeds the open-positions table + fees KPI.
  const positionsResult = useWalletPositions({ account: address ?? '', disabled: !address })

  // Live activity (real local + indexed tx history) — feeds the compact activity card.
  const activity = useActivityData({
    evmOwner: address,
    ownerAddresses: address ? [address] : [],
    fiatOnRampParams: undefined,
    skip: !address,
    maxItems: 6,
  })

  const positions = positionsResult.positions
  const feesClaimable = useMemo(
    () => positions.reduce((sum, p) => sum + (p.uncollectedFeesUsd ?? 0), 0),
    [positions],
  )
  const poolCount = useMemo(() => new Set(positions.map((p) => p.poolId)).size, [positions])

  const allocation = useMemo(() => buildAllocation(balancesResult.data), [balancesResult.data])

  const feedItems: FeedItem[] | undefined = useMemo(() => {
    if (!activity.sectionData) {
      return undefined
    }
    const items: FeedItem[] = []
    for (const entry of activity.sectionData) {
      if (isSectionHeader(entry) || isLoadingItem(entry)) {
        continue
      }
      const tx = entry as TransactionDetails
      const title = getTransactionSummaryTitle(tx, t) ?? 'Transaction'
      items.push({
        id: tx.id,
        title,
        detail: tx.chainId ? `Chain ${tx.chainId}` : '',
        timestamp: formatRelativeTime(tx.addedTime),
      })
      if (items.length >= 6) {
        break
      }
    }
    return items
  }, [activity.sectionData, t])

  const fiat = (value: number | undefined): string =>
    value !== undefined && value !== 0 ? convertFiatAmountFormatted(value, NumberType.PortfolioBalance) : '$0.00'

  const columns: ReadonlyArray<DataTableColumn<PositionInfo>> = useMemo(
    () => [
      {
        id: 'pair',
        header: 'Pair',
        width: 'minmax(150px,1.6fr)',
        align: 'left',
        cell: (p) => <PositionPairCell position={p} />,
      },
      {
        id: 'value',
        header: 'Value',
        width: 'minmax(90px,1fr)',
        align: 'right',
        mono: true,
        cell: (p) => fiat(p.totalValueUsd),
        cellColor: () => terminalColors.ink,
        sortValue: (p) => p.totalValueUsd ?? 0,
      },
      {
        id: 'pnl',
        header: '24H PnL',
        width: 'minmax(80px,0.8fr)',
        align: 'right',
        mono: true,
        // Per-position 24h PnL is not in the positions feed — honest "—" (never fabricated).
        cell: () => '—',
        cellColor: () => terminalColors.faint,
      },
      {
        id: 'fees',
        header: 'Fees',
        width: 'minmax(80px,0.8fr)',
        align: 'right',
        mono: true,
        cell: (p) => fiat(p.uncollectedFeesUsd),
        cellColor: (p) => ((p.uncollectedFeesUsd ?? 0) > 0 ? terminalColors.greenUp : terminalColors.ink2),
        sortValue: (p) => p.uncollectedFeesUsd ?? 0,
      },
      {
        id: 'apr',
        header: 'APR',
        width: 'minmax(64px,0.6fr)',
        align: 'right',
        mono: true,
        cell: (p) => (p.apr !== undefined ? `${p.apr.toFixed(1)}%` : '—'),
        cellColor: () => terminalColors.ink2,
        sortValue: (p) => p.apr ?? 0,
      },
      {
        id: 'status',
        header: 'Status',
        width: 'minmax(110px,1fr)',
        align: 'right',
        cell: (p) => (
          <span style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100%' }}>
            <StatusPill status={p.status} />
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [convertFiatAmountFormatted],
  )

  const netWorth = totalValue.data?.balanceUSD
  const pnl = totalValue.data?.absoluteChangeUSD
  const pct = totalValue.data?.percentChange

  if (!address) {
    return (
      <div style={{ padding: '20px 24px 40px' }}>
        <Header address={undefined} />
        <ConnectState onConnect={() => accountDrawer.open()} />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px 40px' }}>
      <Header address={address} />

      {/* KPI row — 4 tiles on one line (shrink to fit), collapsing to 2-up only on very narrow content. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <Kpi
          label="Net worth"
          value={netWorth !== undefined ? fiat(netWorth) : undefined}
          sub={
            pnl !== undefined && pct !== undefined
              ? `${formatSignedUsd(pnl)} · ${formatSignedPct(pct)}`
              : undefined
          }
          subColor={pnl !== undefined ? (pnl >= 0 ? terminalColors.greenUp : terminalColors.redDown) : undefined}
          loading={totalValue.loading && netWorth === undefined}
        />
        <Kpi
          label="24h PnL"
          value={pnl !== undefined ? formatSignedUsd(pnl) : undefined}
          valueColor={pnl !== undefined ? (pnl >= 0 ? terminalColors.greenUp : terminalColors.redDown) : undefined}
          sub="unrealized"
          loading={totalValue.loading && pnl === undefined}
        />
        <Kpi
          label="Fees claimable"
          value={fiat(feesClaimable)}
          valueColor={feesClaimable > 0 ? terminalColors.greenUp : terminalColors.ink}
          sub="uncollected"
          loading={positionsResult.isLoading && !positionsResult.hasData}
        />
        <Kpi
          label="LP positions"
          value={String(positions.length)}
          sub={`across ${poolCount} ${poolCount === 1 ? 'pool' : 'pools'}`}
          loading={positionsResult.isLoading && !positionsResult.hasData}
        />
      </div>

      {/* Main: positions table (left) + allocation & activity (right).
          Responsive: flex-wrap so the right column drops BELOW the table when the
          content area is too narrow, instead of overflowing off-screen. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 460px', minWidth: 0 }}>
          <Card title="Open positions">
            {/* Wide table scrolls inside its own container so its column minima
                never widen the page at narrow content widths. */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 560 }}>
                <DataTable<PositionInfo>
                  columns={columns}
                  rows={positionsResult.isLoading && !positionsResult.hasData ? undefined : positions}
                  rowKey={(p) => `${p.chainId}-${p.poolId}-${p.tokenId ?? p.currency0Amount.currency.symbol ?? ''}`}
                  loading={positionsResult.isLoading && !positionsResult.hasData}
                  error={positionsResult.error ? 'Failed to load positions.' : undefined}
                  onRetry={() => positionsResult.refetch()}
                  emptyMessage="No open liquidity positions."
                  initialSort={{ columnId: 'value', direction: 'desc' }}
                  skeletonRows={5}
                />
              </div>
            </div>
          </Card>
        </div>

        <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Allocation">
            <AllocationDonut
              slices={allocation}
              loading={balancesResult.loading && allocation === undefined}
            />
          </Card>
          <Card title="Activity">
            <ActivityFeed
              items={feedItems}
              loading={activity.isLoading && !feedItems}
              error={Boolean(activity.error)}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- sub-pieces */

function Header({ address }: { address: string | undefined }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
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
        Portfolio
      </h1>
      {address ? (
        <span style={{ fontFamily: MONO, fontSize: 12, color: terminalColors.ink3Alt }}>
          {`${address.slice(0, 6)}…${address.slice(-4)}`}
        </span>
      ) : null}
    </div>
  )
}

function PositionPairCell({ position }: { position: PositionInfo }): JSX.Element {
  const currency0: Currency | undefined = position.currency0Amount.currency
  const currency1: Currency | undefined = position.currency1Amount.currency
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <DoubleCurrencyLogo currencies={[currency0, currency1]} size={22} />
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
        {currency0?.symbol ?? '—'} / {currency1?.symbol ?? '—'}
      </span>
    </span>
  )
}
