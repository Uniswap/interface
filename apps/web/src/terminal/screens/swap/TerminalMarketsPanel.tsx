/**
 * HookSwap Terminal — B2 Swap left "Markets" panel (LIVE token list).
 *
 * Replaces the static `MarketListPanel` placeholder in `SwapScreen.tsx`. Same
 * 238px panel chrome, same `1.3fr 1fr 60px` grid, same theme tokens — now filled
 * with REAL rows from the interface's Explore token list (`useListTokens`) instead
 * of skeleton bars. Each row: token logo + symbol (+ name), the live USD price and
 * 24h % change, and a mini price-history sparkline. Clicking a row hands a real
 * sdk-core `Currency` back to the swap ticket as the output token.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Rows join the app's real `useListTokens(chainId)` feed — the same list that
 *     powers `/explore`. Price / 24h change / sparkline come straight from each
 *     token's `stats`. Loading renders honest skeleton rows; a chain the backend
 *     doesn't index comes back empty → honest "No markets" state; query failure →
 *     honest error line. NO fabricated rows, prices, or sparklines ever.
 */
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { gqlToCurrency } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import type { UseListTokensOptions } from '~/features/Explore/state/listTokens/types'
import { multichainTokenToDisplayToken } from '~/features/Explore/state/listTokens/utils/multichainTokenToDisplayToken'
import { SparklineCell, type TrendDirection } from '~/terminal/components/SparklineCell'
import { terminalColors, terminalFonts, terminalTokenGradients } from '~/terminal/theme/tokens'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display

/** Shared panel grid — MUST match the SwapScreen placeholder (PAIR / PRICE / spark). */
const GRID = '1.3fr 1fr 60px'

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5, 6, 7]

/** Signed percent, 2 decimals: 2.4 → "+2.40%", -3.4 → "-3.40%". */
function formatSignedPct(value: number): string {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}%`
}

/* --------------------------------------------------------------- row model */

interface MarketRow {
  key: string
  currency: Currency
  id: string
  symbol: string
  /** Secondary line under the symbol (token name, or "/USD" fallback). */
  secondary: string
  logoUrl: string | undefined
  price: number | undefined
  change1d: number | undefined
  /** 1d price-history closes, oldest → newest (drives the sparkline). */
  sparkline: number[] | undefined
}

/**
 * Convert a `MultichainToken` → real sdk-core `Currency` via the app's existing
 * helpers: `multichainTokenToDisplayToken` (picks the deployment on `chainId`) →
 * `gqlToCurrency` (native-aware: returns `nativeOnChain` for native placeholders,
 * else a `Token`). Returns undefined when the token has no deployment on `chainId`.
 */
function toRow(token: MultichainToken, chainId: UniverseChainId): MarketRow | undefined {
  const display = multichainTokenToDisplayToken({ mcToken: token, exploreChainId: chainId })
  if (!display) {
    return undefined
  }
  const currency = gqlToCurrency(display)
  if (!currency) {
    return undefined
  }
  const id = currencyId(currency)
  const stats = token.stats
  const history = stats?.priceHistory1d
  return {
    key: token.multichainId || id,
    currency,
    id,
    symbol: token.symbol || currency.symbol || '—',
    secondary: token.name || '/USD',
    logoUrl: token.logoUrl || undefined,
    price: stats?.price,
    change1d: stats?.priceChange1d,
    sparkline: history && history.length > 0 ? history.map((point) => point.value) : undefined,
  }
}

/* --------------------------------------------------------------- token logo */

/**
 * Real token logo from `MultichainToken.logoUrl`, with the prototype's gradient
 * placeholder circle as a fallback. Mirrors `TerminalTokenLogo` in SwapScreen but
 * takes a raw URL (we have `logoUrl` directly, not a `CurrencyInfo`).
 */
function MarketTokenLogo({ url, size }: { url: string | undefined; size: number }): JSX.Element {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: url
          ? `${terminalColors.panel} center/cover no-repeat url(${JSON.stringify(url)})`
          : terminalTokenGradients.eth,
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  )
}

/* ------------------------------------------------------------------- row */

function MarketRowView({
  row,
  active,
  onSelect,
}: {
  row: MarketRow
  active: boolean
  onSelect: () => void
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const priceText =
    row.price !== undefined && row.price > 0 ? convertFiatAmountFormatted(row.price, NumberType.FiatTokenPrice) : '—'

  const hasChange = row.change1d !== undefined
  const changeColor = !hasChange
    ? terminalColors.faint
    : (row.change1d as number) >= 0
      ? terminalColors.greenUp
      : terminalColors.redDown

  // Spark direction by last vs first close (green when last ≥ first).
  let sparkDirection: TrendDirection | undefined
  if (row.sparkline && row.sparkline.length >= 2) {
    const series = row.sparkline
    sparkDirection = series[series.length - 1] >= series[0] ? 'up' : 'down'
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        gap: 6,
        alignItems: 'center',
        padding: '11px 12px',
        borderBottom: `1px solid ${terminalColors.line3}`,
        borderLeft: `2px solid ${active ? terminalColors.brandGreen : 'transparent'}`,
        background: active ? terminalColors.panel2Alt : 'transparent',
        cursor: 'pointer',
      }}
    >
      {/* PAIR: logo + symbol + secondary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <MarketTokenLogo url={row.logoUrl} size={20} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 12.5,
              color: terminalColors.ink,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.symbol}
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9.5,
              color: terminalColors.ink3Alt,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.secondary}
          </span>
        </div>
      </div>

      {/* PRICE (right): price over 24h % change */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end', minWidth: 0 }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11.5,
            color: priceText === '—' ? terminalColors.faint : terminalColors.ink,
            whiteSpace: 'nowrap',
          }}
        >
          {priceText}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: changeColor, whiteSpace: 'nowrap' }}>
          {hasChange ? formatSignedPct(row.change1d as number) : '—'}
        </span>
      </div>

      {/* Sparkline (60px trailing cell) — blank when no series (never fabricated). */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {sparkDirection ? (
          <SparklineCell data={row.sparkline as number[]} direction={sparkDirection} width={52} height={22} strokeWidth={2} />
        ) : (
          <span style={{ width: 52, height: 22, display: 'inline-block' }} />
        )}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- panel */

const LIST_OPTIONS: UseListTokensOptions = {
  sortMethod: TokenSortMethod.VOLUME,
  sortAscending: false,
}

export function TerminalMarketsPanel({
  chainId,
  activeCurrency,
  onSelectCurrency,
}: {
  chainId: UniverseChainId
  activeCurrency: Maybe<Currency>
  onSelectCurrency: (currency: Currency) => void
}): JSX.Element {
  const { topTokens, isLoading, isError } = useListTokens(chainId, LIST_OPTIONS)

  const rows = useMemo<MarketRow[]>(() => {
    const out: MarketRow[] = []
    for (const token of topTokens) {
      const row = toRow(token, chainId)
      if (row) {
        out.push(row)
      }
    }
    return out
  }, [topTokens, chainId])

  const activeId = activeCurrency ? currencyId(activeCurrency) : undefined
  const showSkeleton = isLoading && rows.length === 0

  return (
    <div
      style={{
        width: 238,
        flexShrink: 0,
        borderRight: `1px solid ${terminalColors.line2}`,
        background: terminalColors.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header: "Markets" + live count */}
      <div
        style={{
          padding: '13px 14px',
          borderBottom: `1px solid ${terminalColors.line2}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 13.5, color: terminalColors.ink }}>Markets</span>
        <span
          style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.ink3Alt }}
          aria-busy={isLoading || undefined}
        >
          {isLoading && topTokens.length === 0 ? '—' : topTokens.length}
        </span>
      </div>

      {/* Column header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          gap: 6,
          padding: '8px 12px',
          fontFamily: MONO,
          fontSize: 10,
          color: terminalColors.ink3Alt,
          borderBottom: `1px solid ${terminalColors.line3}`,
        }}
      >
        <span>PAIR</span>
        <span style={{ textAlign: 'right' }}>PRICE</span>
        <span />
      </div>

      {/* Body: skeleton while loading, then live rows / honest empty / error */}
      <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {showSkeleton ? (
          SKELETON_ROWS.map((i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: 6,
                alignItems: 'center',
                padding: '11px 12px',
                borderBottom: `1px solid ${terminalColors.line3}`,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ height: 9, width: 58, borderRadius: 3, background: terminalColors.line2 }} />
                <span style={{ height: 8, width: 34, borderRadius: 3, background: terminalColors.line3 }} />
              </div>
              <span
                style={{ height: 9, width: 46, borderRadius: 3, background: terminalColors.line2, justifySelf: 'end' }}
              />
              <span style={{ height: 14, width: 52, borderRadius: 3, background: terminalColors.line3 }} />
            </div>
          ))
        ) : rows.length > 0 ? (
          rows.map((row) => (
            <MarketRowView
              key={row.key}
              row={row}
              active={activeId !== undefined && row.id === activeId}
              onSelect={() => onSelectCurrency(row.currency)}
            />
          ))
        ) : (
          <div
            style={{
              padding: '22px 14px',
              fontFamily: terminalFonts.sans,
              fontSize: 11.5,
              lineHeight: 1.5,
              color: terminalColors.ink3Alt,
              textAlign: 'center',
            }}
          >
            {isError
              ? 'Markets unavailable right now.'
              : 'No markets on this network yet.'}
          </div>
        )}
      </div>
    </div>
  )
}
