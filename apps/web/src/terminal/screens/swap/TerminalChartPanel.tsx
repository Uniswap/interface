/**
 * HookSwap Terminal — B2 Swap live price-chart panel.
 *
 * Self-contained, prop-driven replacement for the placeholder `ChartPanel` that
 * previously lived in `SwapScreen.tsx`. The panel chrome (pair header, timeframe
 * tab row, large chart area, right-side stat cells) is a pixel-for-pixel copy of
 * that placeholder — only the data is now LIVE.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Price series + spot price come from the interface's real token price-history
 *     stack (`useTokenPriceChartPanel` → GraphQL price history) rendered with the
 *     shared `PriceChartBody` (lightweight-charts). Real for backend-indexed chains
 *     (e.g. Mainnet); honest empty state ("awaiting pool data feed") for chains the
 *     hosted data API does not index — NO fabricated series is ever drawn.
 *   • 24h % change comes from `useTokenPriceChange`; 24h volume from
 *     `useTokenMarketStats().volume`. 24h high/low are derived from the price
 *     series ONLY on the 1D timeframe (otherwise "—" — never a 52-week value under
 *     a "24h" label).
 *
 * The component reads NO swap-form store and performs NO navigation — it is driven
 * purely by `inputCurrency` / `outputCurrency` props, so it is decoupled + reusable.
 */
import type { Currency } from '@uniswap/sdk-core'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useTokenMarketStats, useTokenPriceChange } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { TimePeriod, toHistoryDuration } from '~/appGraphql/data/util'
import { PriceChartBody } from '~/components/Charts/PriceChart'
import { PriceChartType } from '~/components/Charts/utils'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import type { TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display

/**
 * Timeframe tabs — visually identical pill row to the placeholder, now functional.
 * Each label maps to a REAL `TimePeriod` the price-history backend serves (the
 * hosted data API has no sub-hour granularity, so honest supported durations are
 * used rather than fabricated intraday buckets).
 */
const TIME_OPTIONS = [
  { label: '1H', period: TimePeriod.HOUR },
  { label: '1D', period: TimePeriod.DAY },
  { label: '1W', period: TimePeriod.WEEK },
  { label: '1M', period: TimePeriod.MONTH },
  { label: '1Y', period: TimePeriod.YEAR },
] as const

/* ------------------------------------------------------------- shared chrome */

function HeaderStat({
  label,
  value,
  valueColor,
  size = 14,
  weight,
}: {
  label: string
  value: string
  valueColor?: string
  /** Prototype: Price value is 15px; all other stats 14px. */
  size?: number
  /** Prototype: only Price is weight 600. */
  weight?: number
}): JSX.Element {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: terminalColors.ink3Alt, whiteSpace: 'nowrap' }}>{label}</div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: size,
          fontWeight: weight,
          color: valueColor ?? terminalColors.ink2,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  )
}

/** Right-side stat cluster — same five cells / order / styling as the placeholder. */
function StatsCluster({
  price,
  change,
  changeColor,
  high,
  low,
  vol,
}: {
  price: string
  change: string
  changeColor: string
  high: string
  low: string
  vol: string
}): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
      <HeaderStat label="Price" value={price} valueColor={terminalColors.ink} size={15} weight={600} />
      <HeaderStat label="24h" value={change} valueColor={changeColor} />
      <HeaderStat label="24h high" value={high} />
      <HeaderStat label="24h low" value={low} />
      <HeaderStat label="24h vol" value={vol} />
    </div>
  )
}

/** Input/output token toggle — mirrors SlideoutChartCard's toggle; only when both exist. */
function TokenToggle({
  inputCurrency,
  outputCurrency,
  selectedField,
  onSelectField,
}: {
  inputCurrency: Currency
  outputCurrency: Currency
  selectedField: CurrencyField
  onSelectField: (field: CurrencyField) => void
}): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 2, background: terminalColors.panel2, padding: 2, borderRadius: 7 }}>
      {([CurrencyField.INPUT, CurrencyField.OUTPUT] as const).map((field) => {
        const currency = field === CurrencyField.INPUT ? inputCurrency : outputCurrency
        const active = selectedField === field
        return (
          <button
            key={field}
            type="button"
            onClick={() => onSelectField(field)}
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              color: active ? terminalColors.ink : terminalColors.ink2,
              background: active ? terminalColors.bg : 'transparent',
              padding: '3px 8px',
              borderRadius: 5,
              border: 'none',
              cursor: 'pointer',
              boxShadow: active ? '0 1px 2px rgba(11,15,20,.06)' : undefined,
            }}
          >
            {currency.symbol ?? '—'}
          </button>
        )
      })}
    </div>
  )
}

/** Pair header left group: overlapped token logos + "IN / OUT" title + token toggle. */
function PairHeaderLeft({
  inputCurrency,
  outputCurrency,
  selectedField,
  onSelectField,
}: {
  inputCurrency: Maybe<Currency>
  outputCurrency: Maybe<Currency>
  selectedField: CurrencyField
  onSelectField: (field: CurrencyField) => void
}): JSX.Element {
  const inSym = inputCurrency?.symbol ?? '—'
  const outSym = outputCurrency?.symbol ?? '—'
  const showToggle = !!inputCurrency && !!outputCurrency
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ display: 'flex' }}>
        <CurrencyLogo currency={inputCurrency} size={28} />
        <span style={{ marginLeft: -9 }}>
          <CurrencyLogo currency={outputCurrency} size={28} />
        </span>
      </span>
      <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 17, color: terminalColors.ink }}>
        {inSym} / {outSym}
      </span>
      {showToggle && (
        <TokenToggle
          inputCurrency={inputCurrency}
          outputCurrency={outputCurrency}
          selectedField={selectedField}
          onSelectField={onSelectField}
        />
      )}
    </div>
  )
}

function TimeframeTabs({
  timePeriod,
  onChange,
}: {
  timePeriod: TimePeriod
  onChange: (period: TimePeriod) => void
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        padding: '9px 20px',
        borderBottom: `1px solid ${terminalColors.line2}`,
        background: terminalColors.bg,
      }}
    >
      {TIME_OPTIONS.map(({ label, period }) => {
        const active = period === timePeriod
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(period)}
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
            {label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Honest empty/loading chart state — the placeholder's grid scaffold + centered
 * message + optional corner spot badge. NO fabricated series is drawn; shown when
 * the price-history feed returns nothing (unindexed chain) or is still loading.
 */
function EmptyChartOverlay({ spotLabel, loading }: { spotLabel: string; loading: boolean }): JSX.Element {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent 0 59px,#F1F3F6 59px 60px), repeating-linear-gradient(90deg,transparent 0 79px,#F1F3F6 79px 80px)',
        }}
      />
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
          {loading ? 'Loading price history…' : 'Price history — awaiting pool data feed'}
        </span>
      </div>
      {spotLabel !== '—' && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 12,
            fontFamily: MONO,
            fontSize: 10.5,
            color: terminalColors.greenUp,
            background: terminalColors.greenBg,
            padding: '2px 5px',
            borderRadius: 4,
          }}
        >
          {spotLabel}
        </div>
      )}
    </>
  )
}

/** Outer panel frame + header row + timeframe tabs shared by the live + empty branches. */
function PanelShell({
  inputCurrency,
  outputCurrency,
  selectedField,
  onSelectField,
  timePeriod,
  onTimePeriodChange,
  stats,
  children,
}: {
  inputCurrency: Maybe<Currency>
  outputCurrency: Maybe<Currency>
  selectedField: CurrencyField
  onSelectField: (field: CurrencyField) => void
  timePeriod: TimePeriod
  onTimePeriodChange: (period: TimePeriod) => void
  stats: JSX.Element
  children: React.ReactNode
}): JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${terminalColors.line2}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '15px 20px',
          borderBottom: `1px solid ${terminalColors.line2}`,
          background: terminalColors.bg,
        }}
      >
        <PairHeaderLeft
          inputCurrency={inputCurrency}
          outputCurrency={outputCurrency}
          selectedField={selectedField}
          onSelectField={onSelectField}
        />
        {stats}
      </div>
      <TimeframeTabs timePeriod={timePeriod} onChange={onTimePeriodChange} />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------- live data body */

const EMPTY_STATS = { price: '—', change: '—', high: '—', low: '—', vol: '—' } as const

/**
 * Live branch — mounted ONLY when the charted currency exists, so the data hooks
 * (which require a non-null `Currency`) are always called unconditionally here.
 * Mirrors SlideoutChartCard's variables build + useTokenPriceChartPanel usage.
 */
function TerminalChartPanelBody({
  chartedCurrency,
  inputCurrency,
  outputCurrency,
  selectedField,
  onSelectField,
  timePeriod,
  onTimePeriodChange,
}: {
  chartedCurrency: Currency
  inputCurrency: Maybe<Currency>
  outputCurrency: Maybe<Currency>
  selectedField: CurrencyField
  onSelectField: (field: CurrencyField) => void
  timePeriod: TimePeriod
  onTimePeriodChange: (period: TimePeriod) => void
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const variables = useMemo((): TokenPriceChartQueryVariables => {
    const chain = toGraphQLChain(chartedCurrency.chainId as UniverseChainId)
    const address = chartedCurrency.isNative ? getNativeTokenDBAddress(chain) : chartedCurrency.address
    return { chain, address, duration: toHistoryDuration(timePeriod), multichain: false }
  }, [chartedCurrency, timePeriod])

  const { priceQuery, showInvalidSkeleton, stale } = useTokenPriceChartPanel({
    variables,
    priceChartType: PriceChartType.LINE,
    timePeriod,
    currency: chartedCurrency,
  })
  const { entries, loading } = priceQuery

  const chartedCurrencyId = useMemo(() => currencyId(chartedCurrency), [chartedCurrency])
  const change24h = useTokenPriceChange(chartedCurrencyId)
  const { volume } = useTokenMarketStats(chartedCurrencyId)

  // Chart area needs a concrete pixel height for lightweight-charts — measure the
  // flex region so PriceChartBody always receives a non-zero height.
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartHeight, setChartHeight] = useState(360)
  useLayoutEffect(() => {
    const el = chartRef.current
    if (!el) {
      return
    }
    const update = (): void => setChartHeight(Math.max(el.clientHeight, 1))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // --- Header stats (all REAL, honest "—" when unavailable) -----------------
  const spot = entries.at(-1)?.value
  const priceStr = spot === undefined ? '—' : convertFiatAmountFormatted(spot, NumberType.FiatTokenPrice)

  const changeStr = change24h === undefined ? '—' : `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`
  const changeColor =
    change24h === undefined ? terminalColors.ink2 : change24h >= 0 ? terminalColors.greenUp : terminalColors.redDown

  const volStr = volume === undefined ? '—' : convertFiatAmountFormatted(volume, NumberType.FiatTokenStats)

  // 24h high/low derived from the series ONLY on the 1D timeframe (honest — never a
  // 52-week figure under a "24h" label). Other timeframes render "—".
  let high24h: number | undefined
  let low24h: number | undefined
  if (timePeriod === TimePeriod.DAY && entries.length > 0) {
    high24h = entries.reduce((m, e) => Math.max(m, e.value), Number.NEGATIVE_INFINITY)
    low24h = entries.reduce((m, e) => Math.min(m, e.value), Number.POSITIVE_INFINITY)
  }
  const highStr =
    high24h === undefined || !Number.isFinite(high24h) ? '—' : convertFiatAmountFormatted(high24h, NumberType.FiatTokenPrice)
  const lowStr =
    low24h === undefined || !Number.isFinite(low24h) ? '—' : convertFiatAmountFormatted(low24h, NumberType.FiatTokenPrice)

  return (
    <PanelShell
      inputCurrency={inputCurrency}
      outputCurrency={outputCurrency}
      selectedField={selectedField}
      onSelectField={onSelectField}
      timePeriod={timePeriod}
      onTimePeriodChange={onTimePeriodChange}
      stats={
        <StatsCluster price={priceStr} change={changeStr} changeColor={changeColor} high={highStr} low={lowStr} vol={volStr} />
      }
    >
      <div ref={chartRef} style={{ position: 'relative', flex: 1, minHeight: 300, background: terminalColors.bgApp }}>
        {showInvalidSkeleton ? (
          <EmptyChartOverlay spotLabel={priceStr} loading={loading} />
        ) : (
          <PriceChartBody
            data={entries}
            height={chartHeight}
            type={PriceChartType.LINE}
            stale={stale}
            timePeriod={toHistoryDuration(timePeriod)}
            hideYAxis={false}
            hideXAxis={false}
            hideMinMaxLines
          />
        )}
      </div>
    </PanelShell>
  )
}

/* ---------------------------------------------------------------- component */

export function TerminalChartPanel({
  inputCurrency,
  outputCurrency,
}: {
  inputCurrency: Maybe<Currency>
  outputCurrency: Maybe<Currency>
}): JSX.Element {
  const [selectedField, setSelectedField] = useState<CurrencyField>(CurrencyField.OUTPUT)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)

  const chartedCurrency = selectedField === CurrencyField.INPUT ? inputCurrency : outputCurrency

  if (chartedCurrency) {
    return (
      <TerminalChartPanelBody
        chartedCurrency={chartedCurrency}
        inputCurrency={inputCurrency}
        outputCurrency={outputCurrency}
        selectedField={selectedField}
        onSelectField={setSelectedField}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
      />
    )
  }

  // No charted currency (charted side empty) — full chrome with honest "—" stats
  // and the empty chart scaffold. Data hooks are skipped (they require a Currency).
  return (
    <PanelShell
      inputCurrency={inputCurrency}
      outputCurrency={outputCurrency}
      selectedField={selectedField}
      onSelectField={setSelectedField}
      timePeriod={timePeriod}
      onTimePeriodChange={setTimePeriod}
      stats={
        <StatsCluster
          price={EMPTY_STATS.price}
          change={EMPTY_STATS.change}
          changeColor={terminalColors.greenUp}
          high={EMPTY_STATS.high}
          low={EMPTY_STATS.low}
          vol={EMPTY_STATS.vol}
        />
      }
    >
      <div style={{ position: 'relative', flex: 1, minHeight: 300, background: terminalColors.bgApp }}>
        <EmptyChartOverlay spotLabel="—" loading={false} />
      </div>
    </PanelShell>
  )
}
