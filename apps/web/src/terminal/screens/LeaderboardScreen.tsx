/**
 * HookSwap Terminal — Trading Leaderboard.
 *
 * Ranks trader wallets on the launch chain (Robinhood, 4663) by native-denominated swap volume,
 * trade count, or distinct tokens traded, over a 24h / 7d / 30d / all-time window. Data comes from
 * the HookSwap data-api's `/v1/leaderboard` route (the swap indexer, attributed by tx.from — the real
 * trader EOA — with routers + pool intermediaries excluded). See `useLeaderboard`.
 *
 * DATA POLICY (no mock data — hard rule):
 *   • Every value is real, from the indexer. Rows arrive pre-ranked by the selected metric.
 *   • Native (ETH on Robinhood) volume + trades + tokens are shown NOW. USD is gated on the chain's
 *     WETH/stablecoin anchor pool: when `usdAnchored` is false the USD column shows "—" and an honest
 *     note explains USD ranking activates once the anchor is seeded — NEVER a fabricated dollar value.
 *   • Empty state is honest: Robinhood has ~no trades yet, so the board fills as swaps happen.
 *
 * Reuses the Terminal DataTable + StatCard + theme tokens (mirrors AnalyticsScreen / MarketsScreen).
 */
import { ReactNode, useMemo, useState } from 'react'
import { DataTable, DataTableColumn } from '~/terminal/components/DataTable'
import { StatCard } from '~/terminal/components/StatCard'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import {
  LeaderboardMetric,
  LeaderboardRow,
  LeaderboardWindow,
  useLeaderboard,
} from '~/terminal/screens/useLeaderboard'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/** Robinhood (4663) native currency symbol (see robinhood.ts nativeCurrency = ETH). */
const NATIVE_SYMBOL = 'ETH'

/* ---------------------------------------------------------------- controls */

const WINDOW_OPTIONS: ReadonlyArray<{ id: LeaderboardWindow; label: string }> = [
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: 'all', label: 'All' },
]

const METRIC_OPTIONS: ReadonlyArray<{ id: LeaderboardMetric; label: string }> = [
  { id: 'volume', label: 'Volume' },
  { id: 'trades', label: 'Trades' },
  { id: 'tokens', label: 'Tokens' },
]

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
    <div style={{ display: 'inline-flex', background: terminalColors.panel2, borderRadius: 999, padding: 3, gap: 2 }}>
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

/* --------------------------------------------------------------- helpers */

/** Truncate an address to `0x1234…abcd`. */
function shortenWallet(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

/** Native amount → compact string (e.g. 1.2345). Small values keep more precision. */
function formatNative(value: number): string {
  if (value === 0) {
    return '0'
  }
  if (value >= 1) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 4 })
  }
  return value.toLocaleString('en-US', { maximumSignificantDigits: 4 })
}

/** USD amount → `$1,234.56`. */
function formatUsd(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/* ------------------------------------------------------------------ screen */

export function LeaderboardScreen(): JSX.Element {
  const [window, setWindow] = useState<LeaderboardWindow>('7d')
  const [metric, setMetric] = useState<LeaderboardMetric>('volume')

  const query = useLeaderboard(window, metric)
  const rows = query.data?.rows
  const usdAnchored = query.data?.usdAnchored ?? false
  const isLoading = query.isLoading
  const errorMessage = query.isError ? 'Could not load the leaderboard. Retry.' : undefined

  // Honest aggregates of the returned (ranked, capped) rows.
  const summary = useMemo(() => {
    if (!rows) {
      return undefined
    }
    let volume = 0
    let trades = 0
    for (const r of rows) {
      volume += r.nativeVolume
      trades += r.trades
    }
    return { traders: rows.length, trades, volume }
  }, [rows])

  const columns: ReadonlyArray<DataTableColumn<LeaderboardRow>> = useMemo(
    () => [
      {
        id: 'rank',
        header: '#',
        width: '52px',
        align: 'left',
        mono: true,
        cell: (row) => String(row.rank),
        cellColor: () => terminalColors.ink3Alt,
        sortValue: (row) => row.rank,
      },
      {
        id: 'wallet',
        header: 'Trader',
        width: 'minmax(140px,1.4fr)',
        align: 'left',
        cell: (row) => (
          <span style={{ fontFamily: MONO, fontSize: 12.5, color: terminalColors.ink }}>{shortenWallet(row.wallet)}</span>
        ),
        sortValue: (row) => row.wallet,
      },
      {
        id: 'volume',
        header: `Volume (${NATIVE_SYMBOL})`,
        width: 'minmax(110px,1fr)',
        align: 'right',
        mono: true,
        cell: (row) => formatNative(row.nativeVolume),
        cellColor: () => terminalColors.ink,
        sortValue: (row) => row.nativeVolume,
      },
      {
        id: 'usd',
        header: 'USD',
        width: 'minmax(90px,0.8fr)',
        align: 'right',
        mono: true,
        cell: (row) => (row.usdVolume !== null ? formatUsd(row.usdVolume) : '—'),
        cellColor: (row) => (row.usdVolume !== null ? terminalColors.ink2 : terminalColors.faint),
        sortValue: (row) => row.usdVolume ?? 0,
      },
      {
        id: 'trades',
        header: 'Trades',
        width: 'minmax(72px,0.7fr)',
        align: 'right',
        mono: true,
        cell: (row) => String(row.trades),
        cellColor: () => terminalColors.ink2,
        sortValue: (row) => row.trades,
      },
      {
        id: 'tokens',
        header: 'Tokens',
        width: 'minmax(72px,0.7fr)',
        align: 'right',
        mono: true,
        cell: (row) => String(row.tokensTraded),
        cellColor: () => terminalColors.ink2,
        sortValue: (row) => row.tokensTraded,
      },
    ],
    [],
  )

  return (
    <div style={{ padding: '20px var(--tm-gutter) 40px' }}>
      {/* Header: title + window + metric */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 6,
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
          Leaderboard
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Segmented options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
          <Segmented options={WINDOW_OPTIONS} value={window} onChange={setWindow} />
        </div>
      </div>

      <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt, marginBottom: 18 }}>
        Top traders on Robinhood, ranked by {metric === 'volume' ? 'swap volume' : metric === 'trades' ? 'trade count' : 'distinct tokens traded'}. Attributed to the signing wallet (tx origin); routers and pool contracts excluded.
      </div>

      {/* Summary stat cards (honest aggregates of the ranked rows) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <StatCard label="Ranked traders" value={summary ? String(summary.traders) : undefined} loading={isLoading} />
        <StatCard label="Total trades" value={summary ? String(summary.trades) : undefined} loading={isLoading} />
        <StatCard
          label={`Total volume (${NATIVE_SYMBOL})`}
          value={summary ? formatNative(summary.volume) : undefined}
          loading={isLoading}
        />
      </div>

      {/* Table */}
      <div
        style={{
          border: `1px solid ${terminalColors.line}`,
          borderRadius: 14,
          background: terminalColors.bg,
          padding: 18,
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        <DataTable<LeaderboardRow>
          columns={columns}
          rows={isLoading ? undefined : rows}
          rowKey={(row) => row.wallet}
          loading={isLoading}
          error={errorMessage}
          onRetry={() => void query.refetch()}
          emptyMessage="No trading activity yet — the leaderboard fills as swaps happen."
          skeletonRows={8}
          minWidth={560}
        />
      </div>

      {/* USD-anchor gate note (honest — no fabricated USD ranking) */}
      {!usdAnchored ? (
        <NoteBanner>
          Ranked by native {NATIVE_SYMBOL} volume. USD ranking activates once the USD anchor pool
          (WETH/stablecoin) is seeded — until then USD figures show "—" and are never estimated.
        </NoteBanner>
      ) : null}
    </div>
  )
}

function NoteBanner({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div
      style={{
        marginTop: 14,
        fontFamily: SANS,
        fontSize: 11.5,
        lineHeight: 1.5,
        color: terminalColors.faint,
      }}
    >
      {children}
    </div>
  )
}
