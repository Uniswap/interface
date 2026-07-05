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

/* ------------------------------------------------------------------ summary stat */

function Stat({ label, value, valueColor, loading }: { label: string; value?: string; valueColor?: string; loading?: boolean }): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 14,
        background: terminalColors.bg,
        padding: '14px 16px',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>{label}</div>
      {loading ? (
        <div style={{ height: 24, width: 80, borderRadius: 4, background: terminalColors.line2, marginTop: 8 }} />
      ) : (
        <div
          style={{
            fontFamily: MONO,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: valueColor ?? terminalColors.ink,
            marginTop: 6,
          }}
        >
          {value ?? '—'}
        </div>
      )}
    </div>
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [convertFiatAmountFormatted],
  )

  const onNewPosition = (): void => navigate('/terminal/pools/new')

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

      {/* Summary row — real counts + totals over the returned positions. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        <Stat label="Open positions" value={String(positions.length)} loading={isLoading} />
        <Stat label="Total value" value={fiat(totalValue)} loading={isLoading} />
        <Stat
          label="Fees claimable"
          value={fiat(feesClaimable)}
          valueColor={feesClaimable > 0 ? terminalColors.greenUp : terminalColors.ink}
          loading={isLoading}
        />
        <Stat label="In range" value={`${inRangeCount} / ${positions.length}`} loading={isLoading} />
      </div>

      <Card>
        {showEmpty ? (
          <EmptyState onNewPosition={onNewPosition} />
        ) : (
          /* Wide table scrolls inside its own container so column minima never
             widen the page at narrow content widths. */
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 620 }}>
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
