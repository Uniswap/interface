/* oxlint-disable max-lines */
import { useSporeColors } from '@universe/mycelium'
import type { TFunction } from 'i18next'
import { LineStyle, type LineWidth } from 'lightweight-charts'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  MarginActivePosition,
  MarginPosition,
  MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { MARGIN_MARKETS_REFETCH_MS, type MarginMarket } from '~/constants/margin'
import { useMarginMarkets, type MarginMarketLive } from '~/features/margin/hooks/useMarginMarkets'
import {
  getMarginHealthStatus,
  isMarkStale,
  liqDistanceSignedPct,
  marginHealthFromLeverage,
  scaledE18ToNumber,
  usablePriceX18,
} from '~/features/margin/utils/marginFormat'
import {
  hasMarginPositionBasis,
  isMarginActivePosition,
  marginOpenedLeverage,
  marginPositionTokens,
  marginPositionVenue,
} from '~/features/margin/utils/marginPositionRow'
import { marginMarketDirection } from '~/features/margin/utils/marginTokenDisplay'
import { useDerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { useIsPlanInFlight } from '~/pages/Swap/Margin/hooks/useIsPlanInFlight'
import {
  marginPositionMark,
  marginUsdBasis,
  marginUsdBreakEvenPrice,
  type MarginUsdBasis,
} from '~/pages/Swap/Margin/marginUsdPnl'

const sameToken = ({ a, b }: { a: string; b: string }): boolean => a.toLowerCase() === b.toLowerCase()

// Base shape of one chart price line. Lives here (not in MarginPriceChartModel) so the model can
// depend on this module one-directionally — it imports shouldForceOverlayRebuild + the overlay types.
export interface MarginPriceLine {
  id: string
  price: number
  color: string
  title: string
  lineStyle: LineStyle
  // High-contrast right-axis tag (bg + text). Mirrors the base model's min/max price-line style.
  axisLabelColor: string
  axisLabelTextColor: string
  lineWidth?: LineWidth
  axisLabelVisible?: boolean
}

// The base PriceChartModel handles a chart-type change by silently removeSeries+recreate — every
// price line/primitive attached to the old series dies with it. True ⇔ a live series was replaced
// (first observation is a fresh mount, not a swap).
export function shouldForceOverlayRebuild({
  prevSeries,
  nextSeries,
}: {
  prevSeries: unknown
  nextSeries: unknown
}): boolean {
  return prevSeries !== undefined && prevSeries !== nextSeries
}

// Positions belonging to this exact market: same venue (absent ⇒ MORPHO), collateral/debt roles
// matched by address (case-insensitive), and an attributable cost basis. Reversed-role positions
// (the mirror pair) are excluded so a Morpho position never draws its lines on the Aave chart.
export function positionsForMarket({
  positions,
  market,
}: {
  positions: MarginPosition[]
  market: MarginMarket
}): MarginPosition[] {
  return positions.filter((p) => {
    const tokens = marginPositionTokens(p)
    return (
      (marginPositionVenue(p) ?? 'MORPHO') === market.venue &&
      sameToken({ a: tokens.collateralToken, b: market.collateral.address }) &&
      sameToken({ a: tokens.debtToken, b: market.debt.address }) &&
      hasMarginPositionBasis(p)
    )
  })
}

/**
 * Whether the chart draws the form's open preview: only when the form's market is the charted market
 * (same venue, not just the same pair) and no position is focused.
 */
export function showsMarginOpenPreview({
  previewMarket,
  market,
  focusedPosition,
}: {
  previewMarket: MarginMarket
  market: MarginMarket
  focusedPosition: MarginPosition | undefined
}): boolean {
  return previewMarket.key === market.key && focusedPosition === undefined
}

export type OverlayRole = 'mark' | 'entry' | 'liq' | 'breakEven' | 'previewEntry' | 'previewLiq'

export interface MarginOverlayLine extends MarginPriceLine {
  role: OverlayRole
  // Lower renders first when axis tags collide: liq 0 > entry 1 > previewLiq 2 > previewEntry 3 >
  // breakEven 4 > mark 5.
  priority: number
  // liq/previewLiq only — signed geometrically: negative when liq sits below the mark (a long must
  // fall), positive when above (a short must rise).
  distanceSignedPct?: number
  // Structured merge flag so tests/consumers never parse interpolated t() output.
  mergedLabel?: 'entry+be'
  // Reconcile-time dimming (plan in flight, stale mark); absent = full opacity.
  opacity?: number
}

export interface MarginChartOverlays {
  priceLines: MarginOverlayLine[]
  zone?: { edgePrice: number; side: 'below' | 'above'; emphasis: number } // emphasis 0..1
  autoscaleBounds?: { min: number; max: number }
  // Mark-LINE staleness: true after two missed markets polls. Injected by the wiring hook.
  markStale?: boolean
  // The venue the open quote actually routed to, for surfaces that key on it (the stats strip). Absent
  // before a quote resolves and while a bridged one is in flight — selection is amount- and
  // leverage-aware, so a placeholder quote's venue is provisional. Injected by the wiring hook.
  routedVenue?: MarginVenue
}

export type MarginChartColors = Record<
  | 'statusSuccess'
  | 'statusWarning'
  | 'statusCritical'
  | 'neutral1'
  | 'neutral2'
  | 'neutral3'
  | 'accent1'
  | 'surface1'
  | 'surface3Solid'
  | 'white'
  | 'black',
  string
>

export interface ComposeInput {
  market: MarginMarket
  live?: MarginMarketLive
  // The focused position, pre-filtered via positionsForMarket.
  position?: MarginPosition
  quote?: MarginQuoteResponse
  planInFlight: boolean
  paneHeightPx: number
  visiblePriceRange?: { min: number; max: number }
  // Mark-line dim signal. Generic here; its source is decided by the wiring hook. Default false.
  markStale?: boolean
  colors: MarginChartColors
  t: TFunction
  // The form's leverage as shown in its readout.
  formLeverage?: number
  // A leverage the form shows but no quote prices yet: mid-drag, or while its debounced quote is pending
  // or in flight (see unquotedLeverage).
  previewLeverage?: number
  // The form has a positive amount: with no quote to price it, previews fall back to a mark estimate.
  hasEnteredAmount?: boolean
  // The quote is the previous key's, bridged while the new one loads (react-query placeholder data).
  isQuoteBridged?: boolean
  // Latest candle close — a fallback mark for the preview estimate when the live market mark is absent
  // (e.g. a venue that can't quote). Keeps Entry/Liq on the chart instead of blanking them.
  markFallback?: number
  // Latest candle open; with markFallback (its close) it colors the mark line by the candle's direction.
  latestCandleOpen?: number
}

const PRIORITY: Record<OverlayRole, number> = {
  liq: 0,
  entry: 1,
  previewLiq: 2,
  previewEntry: 3,
  breakEven: 4,
  mark: 5,
}
const LABEL_COLLISION_PX = 14
const FROZEN_PREVIEW_OPACITY = 0.6
const STALE_MARK_OPACITY = 0.5
// Zone emphasis ramps 0→1 as |mark−liq|/mark falls from 10% to 0.
const ZONE_EMPHASIS_WINDOW = 0.1

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

function priceToYInRange({
  price,
  range,
  heightPx,
}: {
  price: number
  range: { min: number; max: number }
  heightPx: number
}): number {
  return ((range.max - price) / (range.max - range.min)) * heightPx
}

// Axis-label de-collision over the emitted lines. Two rules, both gated on a known visible range
// (no range → everything renders as emitted):
//  1. entry+breakEven within one label height collapse into the entry line (mergedLabel 'entry+be').
//  2. Tags claim axis space in priority order; a lower-priority tag within 14px of an already-shown
//     one is hidden. Emission-hidden tags (non-primary lines) never claim a slot.
export function applyLabelCollision({
  lines,
  range,
  heightPx,
}: {
  lines: MarginOverlayLine[]
  range?: { min: number; max: number }
  heightPx: number
}): MarginOverlayLine[] {
  if (!range || range.max <= range.min || heightPx <= 0) {
    return lines
  }
  const yOf = (price: number): number => priceToYInRange({ price, range, heightPx })

  let merged = lines
  const entry = lines.find((l) => l.role === 'entry' && l.axisLabelVisible !== false)
  const breakEven = lines.find((l) => l.role === 'breakEven' && l.axisLabelVisible !== false)
  if (entry && breakEven && Math.abs(yOf(entry.price) - yOf(breakEven.price)) < LABEL_COLLISION_PX) {
    merged = lines
      .filter((l) => l !== breakEven)
      .map((l) => (l === entry ? { ...l, mergedLabel: 'entry+be' as const } : l))
  }

  const shownYs: number[] = []
  const suppressed = new Set<MarginOverlayLine>()
  for (const line of [...merged].sort((a, b) => a.priority - b.priority)) {
    if (line.axisLabelVisible === false) {
      continue
    }
    const y = yOf(line.price)
    if (shownYs.some((shown) => Math.abs(shown - y) < LABEL_COLLISION_PX)) {
      suppressed.add(line)
    } else {
      shownYs.push(y)
    }
  }
  return merged.map((l) => (suppressed.has(l) ? { ...l, axisLabelVisible: false } : l))
}

const LINE_HIT_BAND_PX = 8

// One overlay line hit by the crosshair (T14b explainers). `price` is the RAW price of the hit line.
export interface NearOverlayHit {
  role: OverlayRole
  price: number
}

// Tooltip-facing payload: the hit plus whether the 300ms stationary dwell elapsed (the explainer
// line renders only then).
export type NearOverlay = NearOverlayHit & { dwellElapsed: boolean }

// Crosshair hit-test in pane coordinates (pure — the model injects a scale-disciplined converter).
// Lines hit within an 8px vertical band, nearest first with priority breaking exact ties. Null
// coordinates (no layout / off-screen) never match.
export function nearestOverlay({
  hover,
  lines,
  priceToY,
}: {
  hover: { x: number; y: number }
  lines: MarginOverlayLine[]
  priceToY: (price: number) => number | null
}): NearOverlayHit | undefined {
  let bestLine: { dy: number; line: MarginOverlayLine } | undefined
  for (const line of lines) {
    const y = priceToY(line.price)
    if (y === null) {
      continue
    }
    const dy = Math.abs(hover.y - y)
    if (dy > LINE_HIT_BAND_PX) {
      continue
    }
    if (!bestLine || dy < bestLine.dy || (dy === bestLine.dy && line.priority < bestLine.line.priority)) {
      bestLine = { dy, line }
    }
  }
  return bestLine ? { role: bestLine.line.role, price: bestLine.line.price } : undefined
}

// Mark = dashed line with an axis tag and no on-plot title, green while the latest candle is up and red while it's down.
function buildMarkLine({
  mark,
  open,
  close,
  colors,
  markStale,
}: {
  mark: number | undefined
  open: number | undefined
  close: number | undefined
  colors: MarginChartColors
  markStale: boolean
}): MarginOverlayLine[] {
  if (mark === undefined || mark <= 0) {
    return []
  }
  const color =
    open === undefined || close === undefined
      ? colors.neutral2
      : close >= open
        ? colors.statusSuccess
        : colors.statusCritical
  return [
    {
      id: 'mark',
      role: 'mark',
      priority: PRIORITY.mark,
      price: mark,
      color,
      title: '',
      lineStyle: LineStyle.Dashed,
      axisLabelColor: color,
      axisLabelTextColor: readableTextColor({ background: color, colors }),
      axisLabelVisible: true,
      ...(markStale ? { opacity: STALE_MARK_OPACITY } : {}),
    },
  ]
}

// "4x" / "2.5x" — one decimal, trailing .0 trimmed (JS number formatting drops it).
const formatLegendLeverage = (leverage: number): string => `${Math.round(leverage * 10) / 10}x`

// Undefined where the indexer never recorded a ratio, so the entry line states no leverage rather
// than a fabricated "0x".
function openedLeverageLabel(position: MarginActivePosition): string | undefined {
  const leverage = marginOpenedLeverage(position)
  return leverage === undefined ? undefined : formatLegendLeverage(leverage)
}

// Signed liq-distance label: one decimal, explicit "+" when non-negative (negatives carry their own
// minus). e.g. -12.5 → "-12.5%", 3 → "+3.0%".
const formatSignedPct = (pct: number): string => `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`

// Break-even: dotted neutral line with a VISIBLE but subdued (surface3Solid/neutral1) axis tag.
// The visible tag is REQUIRED so applyLabelCollision's
// entry+be merge rule can engage. Gated on a usable USD basis to solve against.
function buildBreakEvenLine({
  usdBasis,
  colors,
  t,
}: {
  usdBasis: MarginUsdBasis | undefined
  colors: MarginChartColors
  t: TFunction
}): MarginOverlayLine[] {
  if (!usdBasis) {
    return []
  }
  const price = marginUsdBreakEvenPrice({ basis: usdBasis })
  if (price === undefined) {
    return []
  }
  return [
    {
      id: 'breakEven',
      role: 'breakEven',
      priority: PRIORITY.breakEven,
      price,
      color: colors.neutral2,
      title: t('margin.chart.line.breakEven'),
      lineStyle: LineStyle.Dotted,
      axisLabelColor: colors.surface3Solid,
      axisLabelTextColor: colors.neutral1,
      axisLabelVisible: true,
    },
  ]
}

// Entry+liq for the focused position, labeled at full strength. The liq distance is measured against
// the position's own mark — the mark its liquidation price was computed against, in the same server
// read. A non-positive price is the absent sentinel (no at-open mark stamped, or no debt to liquidate)
// and draws nothing rather than a line pinned to the axis floor.
function buildPositionLines({
  position,
  colors,
  t,
}: {
  position: MarginPosition | undefined
  colors: MarginChartColors
  t: TFunction
}): MarginOverlayLine[] {
  if (!position || !isMarginActivePosition(position)) {
    return []
  }
  const lines: MarginOverlayLine[] = []
  const mark = marginPositionMark({ position })
  const entryPrice = scaledE18ToNumber(position.entryPrice)
  const liqPrice = scaledE18ToNumber(position.liquidationPrice)
  const liqDistance = mark !== undefined && liqPrice > 0 ? liqDistanceSignedPct({ liqPrice, mark }) : undefined
  if (entryPrice > 0) {
    lines.push({
      id: 'entry',
      role: 'entry',
      priority: PRIORITY.entry,
      price: entryPrice,
      color: colors.statusSuccess,
      title: t('margin.chart.line.entry', { leverage: openedLeverageLabel(position) ?? '—' }),
      lineStyle: LineStyle.Dashed,
      axisLabelColor: colors.statusSuccess,
      axisLabelTextColor: colors.white,
      lineWidth: 2,
    })
  }
  if (liqPrice > 0) {
    lines.push({
      id: 'liq',
      role: 'liq',
      priority: PRIORITY.liq,
      price: liqPrice,
      color: colors.statusCritical,
      title:
        liqDistance !== undefined && !Number.isNaN(liqDistance)
          ? t('margin.chart.line.liqDistance', { distance: formatSignedPct(liqDistance) })
          : t('margin.chart.line.liq'),
      lineStyle: LineStyle.Dashed,
      axisLabelColor: colors.statusCritical,
      axisLabelTextColor: colors.white,
      lineWidth: 2,
      ...(liqDistance !== undefined ? { distanceSignedPct: liqDistance } : {}),
    })
  }
  return lines
}

// Display leverage vs target: a quote's realized leverage can sit a hair off the requested one.
const LEVERAGE_MATCH_TOLERANCE = 0.05

/**
 * The leverage the preview line should be estimated at, if the current quote doesn't price it: the
 * form's leverage while its quote is stale, i.e. still debouncing (a drag in progress) or bridged from
 * the previous leverage while the new one is in flight. Without it the line sits at the old quote's
 * price for the whole drag, then jumps when the new quote lands.
 */
export function unquotedLeverage({
  leverage,
  quote,
  isQuoteStale,
}: {
  leverage: number
  quote: MarginQuoteResponse | undefined
  isQuoteStale: boolean
}): number | undefined {
  const quotedLeverage = Number(quote?.display.leverage)
  if (!isQuoteStale || !Number.isFinite(quotedLeverage)) {
    return undefined
  }
  return Math.abs(leverage - quotedLeverage) > LEVERAGE_MATCH_TOLERANCE ? leverage : undefined
}

// liq/entry over λ (long) or under λ (short), per the balance sheets marginHealthFromLeverage reads: a
// long carries LTV (L−1)/L, a short one turn higher, L/(L+1). Undefined where there is no debt.
function liqPriceFactor({ leverage, direction }: { leverage: number; direction: MarginDirection }): number | undefined {
  if (direction === MarginDirection.SHORT) {
    return leverage > 0 ? (leverage + 1) / leverage : undefined
  }
  return leverage > 1 ? (leverage - 1) / leverage : undefined
}

/**
 * Estimate of the liquidation price at `targetLeverage`, from the quote's at `quotedLeverage`.
 * Long liq = entry·f/λ and short liq = entry·λ·f (see liqPriceFactor), so the ratio of factors moves the
 * quoted price to a new leverage without knowing λ or entry. Undefined where either side carries no
 * debt; the caller keeps the quoted price.
 */
export function scaleLiqPriceToLeverage({
  liq,
  quotedLeverage,
  targetLeverage,
  direction,
}: {
  liq: number
  quotedLeverage: number
  targetLeverage: number
  direction: MarginDirection
}): number | undefined {
  const quotedFactor = liqPriceFactor({ leverage: quotedLeverage, direction })
  const targetFactor = liqPriceFactor({ leverage: targetLeverage, direction })
  if (quotedFactor === undefined || targetFactor === undefined) {
    return undefined
  }
  return (liq * targetFactor) / quotedFactor
}

/**
 * Liquidation price at `leverage` for a position opened at `entry`, with no quote to scale from — the
 * same balance-sheet model as scaleLiqPriceToLeverage, anchored on the market's LLTV instead. Undefined
 * when there is nothing to liquidate or an input is unusable.
 */
export function estimateLiqPrice({
  entry,
  leverage,
  lltvWad,
  direction,
}: {
  entry: number
  leverage: number
  lltvWad: string
  direction: MarginDirection
}): number | undefined {
  const usableLltv = usablePriceX18(lltvWad)
  const factor = liqPriceFactor({ leverage, direction })
  if (!(entry > 0) || usableLltv === undefined || factor === undefined) {
    return undefined
  }
  const lltv = scaledE18ToNumber(usableLltv)
  return direction === MarginDirection.SHORT ? entry * lltv * factor : (entry * factor) / lltv
}

// The leverage readout's health tier (marginLeverageTrackColor), resolved for the canvas.
export function leverageTierColor({
  leverage,
  lltvWad,
  direction,
  colors,
}: {
  leverage: number
  lltvWad: string
  direction: MarginDirection
  colors: MarginChartColors
}): string {
  const healthFactor = marginHealthFromLeverage({ leverage, lltvWad, direction })
  if (healthFactor === undefined) {
    return colors.neutral2
  }
  const { key } = getMarginHealthStatus(healthFactor)
  return key === 'healthy' ? colors.statusSuccess : key === 'caution' ? colors.statusWarning : colors.statusCritical
}

// WCAG 2 relative luminance: sRGB channel linearization, then the Rec. 709 channel weights.
const SRGB_CHANNEL_MAX = 255
const SRGB_LINEAR_THRESHOLD = 0.03928
const SRGB_LINEAR_SLOPE = 12.92
const SRGB_GAMMA_OFFSET = 0.055
const SRGB_GAMMA = 2.4
const LUMINANCE_WEIGHT_R = 0.2126
const LUMINANCE_WEIGHT_G = 0.7152
const LUMINANCE_WEIGHT_B = 0.0722
// WCAG contrast ratio: (lighter + flare) / (darker + flare), with white at luminance 1 and black at 0.
const CONTRAST_FLARE = 0.05
const WHITE_LUMINANCE = 1
const BLACK_LUMINANCE = 0

// Relative luminance of an `rgb(r, g, b)` / `#rrggbb` color; undefined when unparseable. Local because the
// shared helpers (ui's getContrastPassingTextColor, mycelium's getContrastTextClass) only return their own
// white-unless-contrast-below-3 decision, not a luminance or ratio, and the former takes hex only.
function relativeLuminance(color: string): number | undefined {
  const channels = color.startsWith('#')
    ? [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
    : color
        .slice(color.indexOf('(') + 1, color.indexOf(')'))
        .split(',')
        .slice(0, 3)
        .map(Number.parseFloat)
  if (channels.length < 3 || channels.some((c) => Number.isNaN(c))) {
    return undefined
  }
  const [r = 0, g = 0, b = 0] = channels.map((c) => {
    const v = c / SRGB_CHANNEL_MAX
    return v <= SRGB_LINEAR_THRESHOLD
      ? v / SRGB_LINEAR_SLOPE
      : ((v + SRGB_GAMMA_OFFSET) / (1 + SRGB_GAMMA_OFFSET)) ** SRGB_GAMMA
  })
  return LUMINANCE_WEIGHT_R * r + LUMINANCE_WEIGHT_G * g + LUMINANCE_WEIGHT_B * b
}

function contrastRatio({ lighter, darker }: { lighter: number; darker: number }): number {
  return (lighter + CONTRAST_FLARE) / (darker + CONTRAST_FLARE)
}

// Black or white, whichever contrasts more with `background`.
export function readableTextColor({ background, colors }: { background: string; colors: MarginChartColors }): string {
  const luminance = relativeLuminance(background)
  if (luminance === undefined) {
    return colors.white
  }
  const contrastWithBlack = contrastRatio({ lighter: luminance, darker: BLACK_LUMINANCE })
  const contrastWithWhite = contrastRatio({ lighter: WHITE_LUMINANCE, darker: luminance })
  return contrastWithBlack > contrastWithWhite ? colors.black : colors.white
}

// The quoted values when the quote prices a liquidation. Otherwise — no quote yet, a failed one, or
// one without a liq price — an estimate at the form's leverage from the quote's entry or the live mark,
// once the form has an amount: a missing quote must not hide a liq price the mark can still give.
function previewPrices({
  quote,
  mark,
  market,
  direction,
  formLeverage,
  previewLeverage,
  hasEnteredAmount,
  isQuoteBridged,
}: {
  quote: MarginQuoteResponse | undefined
  mark: number | undefined
  market: MarginMarket
  direction: MarginDirection
  formLeverage?: number
  previewLeverage?: number
  hasEnteredAmount: boolean
  isQuoteBridged: boolean
}): { entry?: number; liq?: number } {
  const quoteEntry = quote?.display.effectivePrice ? scaledE18ToNumber(quote.display.effectivePrice) : undefined
  const quotedLiqPrice = quote?.display.liquidationPrice ? scaledE18ToNumber(quote.display.liquidationPrice) : undefined
  const quotedLeverage = Number(quote?.display.leverage)
  // Bridged at the same leverage, the new key changed something else, such as the market the open is
  // quoted on, whose LLTV the old liq price does not reflect: estimate at the market's LLTV below instead.
  const isQuotedLiqCurrent = !isQuoteBridged || previewLeverage !== undefined
  if (quotedLiqPrice !== undefined && quotedLiqPrice > 0 && isQuotedLiqCurrent) {
    // Until a quote prices the form's leverage, the line follows an estimate scaled from the quote's own
    // (realized) leverage; the settled quote replaces it.
    const liq =
      (previewLeverage !== undefined && Number.isFinite(quotedLeverage)
        ? scaleLiqPriceToLeverage({ liq: quotedLiqPrice, quotedLeverage, targetLeverage: previewLeverage, direction })
        : undefined) ?? quotedLiqPrice
    return { entry: quoteEntry, liq }
  }
  if (!quote && !hasEnteredAmount) {
    return {}
  }
  const entry = [quoteEntry, mark].find((price) => price !== undefined && price > 0)
  if (entry === undefined) {
    return {}
  }
  const leverage = formLeverage ?? quotedLeverage
  return { entry, liq: estimateLiqPrice({ entry, leverage, lltvWad: market.lltvWad, direction }) }
}

// Preview entry: dotted neutral1 stroke with a neutral1 "Entry" tag (white on the dark theme). Preview
// liq: solid, in the leverage readout's tier color, with a "Liq. price" tag. Both tags show (the title
// pill beside the axis needs axisLabelVisible). While a plan is in flight the wiring hook pins the
// last pre-flight quote, so previews persist here and only dim.
function buildPreviewLines({
  quote,
  mark,
  planInFlight,
  colors,
  t,
  market,
  direction,
  formLeverage,
  previewLeverage,
  hasEnteredAmount,
  isQuoteBridged,
}: {
  quote: MarginQuoteResponse | undefined
  mark: number | undefined
  planInFlight: boolean
  colors: MarginChartColors
  t: TFunction
  market: MarginMarket
  direction: MarginDirection
  formLeverage?: number
  previewLeverage?: number
  hasEnteredAmount: boolean
  isQuoteBridged: boolean
}): MarginOverlayLine[] {
  const { entry, liq } = previewPrices({
    quote,
    mark,
    market,
    direction,
    formLeverage,
    previewLeverage,
    hasEnteredAmount,
    isQuoteBridged,
  })
  const lines: MarginOverlayLine[] = []
  const dim = planInFlight ? { opacity: FROZEN_PREVIEW_OPACITY } : {}
  if (entry !== undefined && entry > 0) {
    lines.push({
      id: 'previewEntry',
      role: 'previewEntry',
      priority: PRIORITY.previewEntry,
      price: entry,
      color: colors.neutral1,
      title: t('margin.chart.line.previewEntry'),
      lineStyle: LineStyle.Dotted,
      lineWidth: 1,
      axisLabelColor: colors.neutral1,
      axisLabelTextColor: colors.surface1,
      axisLabelVisible: true,
      ...dim,
    })
  }
  if (liq === undefined || !(liq > 0)) {
    return lines
  }
  // The quote's own oracle mark first — its liq price was computed against that mark, so the distance
  // stays self-consistent; then the live mark where the quote has none (no quote yet, or the '0'
  // unpriced sentinel), then the entry as a proxy.
  const quoteMark = quote?.display.oraclePrice ? scaledE18ToNumber(quote.display.oraclePrice) : undefined
  const previewMark = [quoteMark, mark, entry].find((price) => price !== undefined && price > 0)
  const distanceSignedPct =
    previewMark !== undefined ? liqDistanceSignedPct({ liqPrice: liq, mark: previewMark }) : undefined
  // Same tier, and so the same color, as the form's leverage readout.
  const tierLeverage = formLeverage ?? Number(quote?.display.leverage)
  const previewLiqColor = Number.isFinite(tierLeverage)
    ? leverageTierColor({ leverage: tierLeverage, lltvWad: market.lltvWad, direction, colors })
    : colors.statusCritical
  lines.push({
    id: 'previewLiq',
    role: 'previewLiq',
    priority: PRIORITY.previewLiq,
    price: liq,
    color: previewLiqColor,
    title: t('margin.chart.line.previewLiq'),
    lineStyle: LineStyle.Solid,
    lineWidth: 1,
    axisLabelColor: previewLiqColor,
    axisLabelTextColor: readableTextColor({ background: previewLiqColor, colors }),
    axisLabelVisible: true,
    ...(distanceSignedPct !== undefined ? { distanceSignedPct } : {}),
    ...dim,
  })
  return lines
}

function buildZone({
  primary,
  direction,
}: {
  primary: MarginPosition | undefined
  direction: MarginDirection
}): MarginChartOverlays['zone'] {
  if (!primary || !isMarginActivePosition(primary)) {
    return undefined
  }
  const liqPrice = scaledE18ToNumber(primary.liquidationPrice)
  if (liqPrice <= 0) {
    return undefined // debt-free: nothing to liquidate at
  }
  const mark = marginPositionMark({ position: primary })
  const emphasis =
    mark !== undefined ? clamp01((ZONE_EMPHASIS_WINDOW - Math.abs(mark - liqPrice) / mark) / ZONE_EMPHASIS_WINDOW) : 0
  return { edgePrice: liqPrice, side: direction === MarginDirection.SHORT ? 'above' : 'below', emphasis }
}

// Pure overlay composer: live market + focused position + OPEN quote → the chart's price lines, liq
// zone and autoscale bounds. The pane's model reconciles the output.
export function composeMarginChartOverlays(input: ComposeInput): MarginChartOverlays {
  const {
    market,
    live,
    position,
    quote,
    planInFlight,
    paneHeightPx,
    visiblePriceRange,
    colors,
    t,
    formLeverage,
    previewLeverage,
  } = input
  const direction: MarginDirection =
    market.direction ??
    marginMarketDirection({ collateralToken: market.collateral.address, debtToken: market.debt.address })
  const liveMark = live ? scaledE18ToNumber(live.markPriceX18) : undefined
  // Previews anchor on the live mark, else the latest candle close, so a failed or absent quote still
  // shows Entry/Liq rather than blanking them. A venue that can't quote reports a 0 live mark (present
  // but unpriced), so fall back on any non-positive value, not just a nullish one. The mark line uses
  // the same fallback so the current price always shows.
  const previewMark = [liveMark, input.markFallback].find((price) => price !== undefined && price > 0)
  const usdBasis = position && isMarginActivePosition(position) ? marginUsdBasis({ position, market }) : undefined

  const lines: MarginOverlayLine[] = [
    ...buildMarkLine({
      mark: previewMark,
      open: input.latestCandleOpen,
      close: input.markFallback,
      colors,
      markStale: input.markStale ?? false,
    }),
    ...buildPositionLines({ position, colors, t }),
    ...buildBreakEvenLine({ usdBasis, colors, t }),
    ...buildPreviewLines({
      quote,
      mark: previewMark,
      planInFlight,
      colors,
      t,
      market,
      direction,
      formLeverage,
      previewLeverage: planInFlight ? undefined : previewLeverage,
      hasEnteredAmount: input.hasEnteredAmount ?? false,
      isQuoteBridged: !planInFlight && (input.isQuoteBridged ?? false),
    }),
  ]

  const zone = buildZone({ primary: position, direction })

  // CONTRACT (T9): bounds span the PRE-merge line set — computed from `lines` BEFORE applyLabelCollision
  // can drop the merged BE line. Post-merge bounds would let a merge→shrink→rescale→unmerge loop form
  // through the visible-range feedback. Preview lines count too, including mid-drag: a leverage change
  // can push the preview liq well past the candles' range, so the chart rescales to keep it in view as
  // the thumb moves. On release the quote replaces the estimate and the chart re-fits once more.
  const boundPrices = lines.map((l) => l.price)
  if (zone) {
    boundPrices.push(zone.edgePrice)
  }
  const autoscaleBounds =
    boundPrices.length > 0 ? { min: Math.min(...boundPrices) * 0.98, max: Math.max(...boundPrices) * 1.02 } : undefined

  // applyLabelCollision drops the BE line and flags the surviving entry (mergedLabel 'entry+be') on
  // collision; give it the combined title so the break-even info isn't silently lost.
  const priceLines = applyLabelCollision({ lines, range: visiblePriceRange, heightPx: paneHeightPx }).map((line) =>
    line.mergedLabel === 'entry+be' ? { ...line, title: t('margin.chart.line.entryBe') } : line,
  )

  return { priceLines, zone, autoscaleBounds }
}

// Wiring hook: gathers live market data, the OPEN quote and plan state, and feeds the pure composer.
// The pane owns the visible-range state + height and passes them in (T9). The focused position comes
// in from the surface that holds it; the chart never fetches positions.
export function useMarginChartOverlays({
  market,
  previewMarket = market,
  focusedPosition,
  markFallback,
  latestCandleOpen,
  visiblePriceRange,
  paneHeightPx,
}: {
  market: MarginMarket
  previewMarket?: MarginMarket
  focusedPosition?: MarginPosition
  // Latest candle close, the preview estimate's fallback mark when the live market mark is absent.
  markFallback?: number
  latestCandleOpen?: number
  visiblePriceRange?: { min: number; max: number }
  paneHeightPx: number
}): MarginChartOverlays {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { getLive, dataUpdatedAt: marketsUpdatedAt } = useMarginMarkets()
  const previewInfo = useDerivedMarginInfo({ market: previewMarket })
  const showsPreview = showsMarginOpenPreview({ previewMarket, market, focusedPosition })
  const quote = showsPreview ? previewInfo.quote : undefined
  const isPlaceholderData = showsPreview && previewInfo.isPlaceholderData
  const isDebouncing = showsPreview && previewInfo.isDebouncing
  const hasEnteredAmount = showsPreview && previewInfo.hasEnteredAmount
  const routedVenue = isPlaceholderData ? undefined : quote?.legs[0]?.venue
  const planInFlight = useIsPlanInFlight()
  const leverage = useMarginFormStore((s) => s.leverage)
  // Pin the last pre-flight quote so previews persist (dimmed) while a plan executes instead of
  // vanishing when the form's quote refreshes or clears mid-execution.
  const frozenQuote = useRef<MarginQuoteResponse | undefined>(undefined)
  if (!planInFlight) {
    frozenQuote.current = quote
  }
  const colorBag: MarginChartColors = useMemo(
    () => ({
      statusSuccess: colors.statusSuccess.val,
      statusWarning: colors.statusWarning.val,
      statusCritical: colors.statusCritical.val,
      neutral1: colors.neutral1.val,
      neutral2: colors.neutral2.val,
      neutral3: colors.neutral3.val,
      accent1: colors.accent1.val,
      surface1: colors.surface1.val,
      surface3Solid: colors.surface3Solid.val,
      white: colors.white.val,
      black: colors.black.val,
    }),
    [colors],
  )
  const live = getLive(market.key)
  const position = useMemo(
    () => (focusedPosition ? positionsForMarket({ positions: [focusedPosition], market }).at(0) : undefined),
    [focusedPosition, market],
  )
  // Time-derived, computed each render (the boolean is a stable memo dep). The overlays memo already
  // re-runs on every markets poll, so a dim lands within ~one poll of its threshold.
  const markStale = isMarkStale({ updatedAt: marketsUpdatedAt, now: Date.now(), refetchMs: MARGIN_MARKETS_REFETCH_MS })
  return useMemo(
    () => ({
      ...composeMarginChartOverlays({
        market,
        live,
        position,
        quote: planInFlight ? frozenQuote.current : quote,
        planInFlight,
        paneHeightPx,
        visiblePriceRange,
        colors: colorBag,
        t,
        markStale,
        formLeverage: leverage,
        previewLeverage: unquotedLeverage({ leverage, quote, isQuoteStale: isDebouncing || isPlaceholderData }),
        hasEnteredAmount,
        isQuoteBridged: isPlaceholderData,
        markFallback,
        latestCandleOpen,
      }),
      markStale,
      routedVenue,
    }),
    [
      market,
      live,
      position,
      quote,
      routedVenue,
      planInFlight,
      paneHeightPx,
      visiblePriceRange,
      colorBag,
      t,
      leverage,
      isDebouncing,
      isPlaceholderData,
      hasEnteredAmount,
      markFallback,
      latestCandleOpen,
      markStale,
    ],
  )
}
