/**
 * HookSwap Terminal — Positions (LP positions list).
 *
 * Terminal-native replacement for the legacy Uniswap `/positions` page, mounted at
 * `/terminal/positions`. Matches the Atlas light theme (same tokens/components the
 * Portfolio and Pools screens use) and is **v2 + v3 ONLY** — HookSwap ships no v4
 * (locked decision 2026-07-04: hooks are a v4-only feature and are not part of this
 * product). v4 positions are excluded at the query level AND defensively filtered
 * from the rendered list.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Positions — LIVE from `useWalletPositions` (the same REST positions feed the
 *     legacy `/positions` page uses), restricted to `[V2, V3]`. Each row shows the
 *     real pair (real token logos), a v2/v3 version badge, fee tier, position value,
 *     in/out-of-range status, and uncollected fees — all straight from the feed.
 *   • Summary — real counts + summed totals over the returned positions. Values the
 *     feed does not carry render an honest "—" (never fabricated).
 *   • Row click → the app's real position detail route via `getPositionUrl`
 *     (`/positions/v2/:chain/:pairAddress`, `/positions/v3/:chain/:tokenId`).
 *
 * States: disconnected → "Connect your wallet" (opens the real AccountDrawer);
 * connected + zero → honest empty state with the New-position CTA; loading →
 * skeleton rows; error → honest line with retry.
 */
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { getPositionUrl } from 'uniswap/src/features/positions/getPositionUrl'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { useAccount } from '~/hooks/useAccount'
import { DataTable, DataTableColumn } from '~/terminal/components/DataTable'
import { StatCard } from '~/terminal/components/StatCard'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* v2 + v3 only — v4 is intentionally excluded from the query (defensively re-filtered below). */
const V2_V3_ONLY: ProtocolVersion[] = [ProtocolVersion.V2, ProtocolVersion.V3]

/* ------------------------------------------------------------------ helpers */

/**
 * Fee-tier label. v3 carries a real `feeTier.feeAmount` (hundredths of a bip, e.g.
 * 3000 → 0.30%). v2 has no per-position fee field — it is the protocol's fixed
 * 0.30% swap fee (a constant, not fabricated data).
 */
function feeTierLabel(p: PositionInfo): string {
  if (p.version === ProtocolVersion.V2) {
    return '0.30%'
  }
  const amount = p.feeTier?.feeAmount
  if (amount === undefined) {
    return '—'
  }
  return `${(amount / 10000).toFixed(2)}%`
}

function versionLabel(version: ProtocolVersion): string {
  return version === ProtocolVersion.V2 ? 'v2' : 'v3'
}

/* --------------------------------------------------------------- version badge */

function VersionBadge({ version }: { version: ProtocolVersion }): JSX.Element {
  const isV3 = version === ProtocolVersion.V3
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: MONO,
        fontSize: 11,
        fontWeight: 600,
        color: isV3 ? terminalColors.accentIndigo : terminalColors.ink2,
        background: isV3 ? 'rgba(91,107,255,0.10)' : terminalColors.panel2,
        border: `1px solid ${isV3 ? 'rgba(91,107,255,0.22)' : terminalColors.line}`,
        padding: '2px 8px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {versionLabel(version)}
    </span>
  )
}

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

/* --------------------------------------------------- allocation (real, by pair) */

/* Category swatch palette (shared token accents) for the value-by-pair breakdown. */
const ALLOC_COLORS = [
  terminalColors.accentIndigo,
  terminalColors.accentBlue,
  terminalColors.greenUp,
  terminalColors.accentPurple,
  terminalColors.accentPink,
  terminalColors.accentTeal,
] as const
const ALLOC_OTHER_COLOR = terminalColors.faint

interface AllocSlice {
  label: string
  usd: number
  percent: number
  color: string
}

/**
 * Aggregate REAL position value (`totalValueUsd`) by pair → top-N slices + an
 * "Other" bucket. Positions the feed gives no value for (undefined/0) are skipped
 * — never fabricated. Returns an empty slice list when nothing carries value.
 */
function buildAllocation(positions: PositionInfo[]): { slices: AllocSlice[]; total: number } {
  const byPair = new Map<string, number>()
  for (const p of positions) {
    const usd = p.totalValueUsd ?? 0
    if (usd <= 0) {
      continue
    }
    const label = `${p.currency0Amount.currency.symbol ?? '—'} / ${p.currency1Amount.currency.symbol ?? '—'}`
    byPair.set(label, (byPair.get(label) ?? 0) + usd)
  }
  const rows = [...byPair.entries()].map(([label, usd]) => ({ label, usd })).sort((a, b) => b.usd - a.usd)
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
    slices.push({ label: 'Other', usd: otherUsd, percent: (otherUsd / total) * 100, color: ALLOC_OTHER_COLOR })
  }
  return { slices, total }
}

/** Horizontal stacked value-by-pair bar + legend (real data / honest empty). */
function AllocationCard({
  allocation,
  loading,
  fiat,
}: {
  allocation: { slices: AllocSlice[]; total: number }
  loading: boolean
  fiat: (v: number | undefined) => string
}): JSX.Element {
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: terminalColors.ink }}>
          Allocation by pair
        </div>
        {!loading && allocation.total > 0 ? (
          <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: terminalColors.ink }}>
            {fiat(allocation.total)}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div style={{ height: 14, borderRadius: 999, background: terminalColors.line2 }} aria-busy="true" />
      ) : allocation.slices.length === 0 ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5, color: terminalColors.ink3Alt }}>
          No position value to break down yet. Allocation appears once your positions carry a USD value.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              height: 14,
              borderRadius: 999,
              overflow: 'hidden',
              background: terminalColors.panel2,
            }}
          >
            {allocation.slices.map((s) => (
              <div
                key={s.label}
                title={`${s.label} · ${s.percent.toFixed(1)}%`}
                style={{ width: `${s.percent}%`, background: s.color }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 14 }}>
            {allocation.slices.map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 12.5,
                    color: terminalColors.ink2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 160,
                  }}
                >
                  {s.label}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 12.5, color: terminalColors.ink }}>
                  {fiat(s.usd)}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.ink3Alt }}>
                  {s.percent.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------- row action button */

function RowActionButton({
  label,
  onClick,
  tone = 'neutral',
}: {
  label: string
  onClick: (e: React.MouseEvent) => void
  tone?: 'neutral' | 'green'
}): JSX.Element {
  const green = tone === 'green'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: SANS,
        fontSize: 12,
        fontWeight: 600,
        color: green ? terminalColors.greenDeep : terminalColors.ink2,
        background: green ? terminalColors.greenBg : terminalColors.bg,
        border: `1px solid ${green ? terminalColors.greenBorder : terminalColors.line}`,
        padding: '5px 12px',
        borderRadius: 9,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ card wrapper */

function Card({ children }: { children: React.ReactNode }): JSX.Element {
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
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ pair cell */

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
        Connect a wallet to see your open liquidity positions, their value, and uncollected fees.
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

/* ------------------------------------------------------------------ empty state */

function EmptyState({ onNewPosition }: { onNewPosition: () => void }): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        minHeight: 300,
        textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: terminalColors.ink }}>
        No positions yet
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13.5, color: terminalColors.ink2, maxWidth: 360, lineHeight: 1.5 }}>
        Add liquidity to start earning fees.
      </div>
      <button
        type="button"
        onClick={onNewPosition}
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
        New position
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ the screen */

export function PositionsScreen(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const address = account.address
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Live LP positions (real) — restricted to v2 + v3 (no v4 in HookSwap).
  const positionsResult = useWalletPositions({
    account: address ?? '',
    disabled: !address,
    protocolVersions: V2_V3_ONLY,
  })

  // Defensive belt-and-suspenders: exclude any v4 the feed might still return.
  const positions = useMemo(
    () => positionsResult.positions.filter((p) => p.version !== ProtocolVersion.V4),
    [positionsResult.positions],
  )

  const totalValue = useMemo(() => positions.reduce((sum, p) => sum + (p.totalValueUsd ?? 0), 0), [positions])
  const feesClaimable = useMemo(() => positions.reduce((sum, p) => sum + (p.uncollectedFeesUsd ?? 0), 0), [positions])
  const inRangeCount = useMemo(
    () => positions.filter((p) => p.status === PositionStatus.IN_RANGE).length,
    [positions],
  )
  const allocation = useMemo(() => buildAllocation(positions), [positions])

  const isLoading = positionsResult.isLoading && !positionsResult.hasData

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
        id: 'version',
        header: 'Version',
        width: 'minmax(72px,0.6fr)',
        align: 'left',
        cell: (p) => <VersionBadge version={p.version} />,
        sortValue: (p) => versionLabel(p.version),
      },
      {
        id: 'fee',
        header: 'Fee',
        width: 'minmax(64px,0.6fr)',
        align: 'right',
        mono: true,
        cell: (p) => feeTierLabel(p),
        cellColor: () => terminalColors.ink2,
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
      {
        id: 'actions',
        header: '',
        width: 'minmax(140px,1fr)',
        align: 'right',
        // "View" always opens the real position detail route (where add / collect /
        // remove all live); "Collect" appears only where the feed reports real
        // uncollected fees, and opens that same detail page (its collect surface).
        cell: (p) => (
          <span style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: 6, width: '100%' }}>
            {(p.uncollectedFeesUsd ?? 0) > 0 ? (
              <RowActionButton
                label="Collect"
                tone="green"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(getPositionUrl(p))
                }}
              />
            ) : null}
            <RowActionButton
              label="View"
              onClick={(e) => {
                e.stopPropagation()
                navigate(getPositionUrl(p))
              }}
            />
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [convertFiatAmountFormatted, navigate],
  )

  const onNewPosition = (): void => {
    void navigate('/terminal/pools/new')
  }

  /* Disconnected → connect empty state. */
  if (!address) {
    return (
      <div style={{ padding: '20px 24px 40px' }}>
        <Header address={undefined} onNewPosition={onNewPosition} showAction={false} />
        <ConnectState onConnect={() => accountDrawer.open()} />
      </div>
    )
  }

  const showEmpty = !isLoading && !positionsResult.error && positions.length === 0

  return (
    <div style={{ padding: '20px 24px 40px' }}>
      <Header address={address} onNewPosition={onNewPosition} showAction />

      {/* Stat tiles — real counts + totals over the returned positions. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <StatCard size="lg" label="Open positions" value={String(positions.length)} loading={isLoading} />
        <StatCard size="lg" label="Total value" value={fiat(totalValue)} loading={isLoading} />
        <StatCard
          size="lg"
          label="Fees claimable"
          value={fiat(feesClaimable)}
          valueColor={feesClaimable > 0 ? 'up' : 'ink'}
          loading={isLoading}
        />
        <StatCard size="lg" label="In range" value={`${inRangeCount} / ${positions.length}`} loading={isLoading} />
      </div>

      {/* Allocation by pair — real position value only (honest empty otherwise). */}
      {!showEmpty ? (
        <div style={{ marginBottom: 16 }}>
          <AllocationCard allocation={allocation} loading={isLoading} fiat={fiat} />
        </div>
      ) : null}

      <Card>
        {showEmpty ? (
          <EmptyState onNewPosition={onNewPosition} />
        ) : (
          /* Wide table scrolls inside its own container so column minima never
             widen the page at narrow content widths. */
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 760 }}>
              <DataTable<PositionInfo>
                columns={columns}
                rows={isLoading ? undefined : positions}
                rowKey={(p) => `${p.chainId}-${p.poolId}-${p.tokenId ?? p.currency0Amount.currency.symbol ?? ''}`}
                loading={isLoading}
                error={positionsResult.error ? 'Failed to load positions.' : undefined}
                onRetry={() => positionsResult.refetch()}
                emptyMessage="No positions."
                initialSort={{ columnId: 'value', direction: 'desc' }}
                skeletonRows={6}
                onRowClick={(p) => navigate(getPositionUrl(p))}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

/* --------------------------------------------------------------- sub-pieces */

function Header({
  address,
  onNewPosition,
  showAction,
}: {
  address: string | undefined
  onNewPosition: () => void
  showAction: boolean
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 18,
        flexWrap: 'wrap',
      }}
    >
      <div>
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
            Positions
          </h1>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 600,
              color: terminalColors.greenDeep,
              background: terminalColors.greenBg,
              border: `1px solid ${terminalColors.greenBorder}`,
              padding: '3px 8px',
              borderRadius: 999,
            }}
          >
            v2 · v3
          </span>
          {address ? (
            <span style={{ fontFamily: MONO, fontSize: 12, color: terminalColors.ink3Alt }}>
              {`${address.slice(0, 6)}…${address.slice(-4)}`}
            </span>
          ) : null}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink3Alt, marginTop: 6 }}>
          Your open liquidity positions and the fees they've earned.
        </div>
      </div>

      {showAction ? (
        <button
          type="button"
          onClick={onNewPosition}
          style={{
            fontFamily: SANS,
            fontSize: 13.5,
            fontWeight: 600,
            color: terminalColors.btnInk,
            background: terminalColors.brandGreen,
            border: 'none',
            padding: '10px 18px',
            borderRadius: 12,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          New position
        </button>
      ) : null}
    </div>
  )
}
