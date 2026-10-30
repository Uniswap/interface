import type { TFunction } from 'i18next'
import { LineStyle, type UTCTimestamp } from 'lightweight-charts'
import { opacify } from 'ui/src/theme'
import type {
  MarginActivePosition,
  MarginPositionLeg,
  MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import type { MarginMarket } from '~/constants/margin'
import { DEFAULT_MARGIN_CHART_PREFS } from '~/pages/Swap/Margin/chart/marginChartPrefsStore'
import {
  applyLabelCollision,
  composeMarginChartOverlays,
  nearestOverlay,
  positionsForMarket,
  shouldForceOverlayRebuild,
  snapToCandleTime,
  type ComposeInput,
  type MarginChartColors,
  type MarginOverlayLine,
} from '~/pages/Swap/Margin/chart/useMarginChartOverlays'
import type { MarginMarketLive } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { isMarkStale } from '~/pages/Swap/Margin/marginFormat'

const mockT = ((key: string) => key) as TFunction
const ts = (n: number): UTCTimestamp => n as UTCTimestamp

// Exact X18 wire strings (1e18-scaled decimals) without float drift.
const X18 = (n: number): string => (BigInt(Math.round(n * 1e6)) * 10n ** 12n).toString()
// Raw integer token units at a leg's decimals (whole-number fixtures).
const raw = (whole: number, decimals: number): string => (BigInt(whole) * 10n ** BigInt(decimals)).toString()

const COLORS: MarginChartColors = {
  statusSuccess: '#00ff00',
  statusCritical: '#ff0000',
  neutral1: '#111111',
  neutral2: '#222222',
  neutral3: '#333333',
  accent1: '#aa00aa',
  surface1: '#0d0d0d',
  surface3Solid: '#444444',
  white: '#ffffff',
}

// Lowercased (vs the market's checksummed) addresses keep positionsForMarket's case-insensitive
// matching under test.
const EXPOSURE_TOKEN = { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', chainId: MARGIN_CHAIN_ID, decimals: 18 }
const COUNTER_TOKEN = { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId: MARGIN_CHAIN_ID, decimals: 6 }

const mkMarket = (over?: Partial<MarginMarket>): MarginMarket => ({
  key: 'weth-usdc-morpho',
  asset: 'ETH',
  name: 'Ethereum',
  displaySymbol: 'ETH',
  collateral: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
  debt: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  venue: 'MORPHO',
  lltvWad: X18(0.86),
  shouldUseNativeEquity: true,
  ...over,
})

const mkLeg = (over?: Partial<MarginPositionLeg>): MarginPositionLeg => ({
  venue: 'MORPHO',
  subId: '1',
  account: '0xacc',
  debt: '0',
  ...over,
})

// LONG position fixture, ACTIVE status. entryPrice/openedAt double as the attribution sentinel: '0'
// means unattributable.
const mkPos = (over?: Partial<MarginActivePosition>): MarginActivePosition => ({
  positionId: 'pos-1',
  direction: MarginDirection.LONG,
  exposureToken: EXPOSURE_TOKEN,
  counterToken: COUNTER_TOKEN,
  size: '0',
  entryPrice: X18(1800),
  openedAt: '100',
  legs: [mkLeg()],
  isTradable: true,
  status: 'ACTIVE',
  equity: '0',
  oraclePrice: X18(2000),
  liquidationPrice: X18(1500),
  buffer: X18(0.25),
  healthFactor: X18(2),
  maxWithdrawable: '0',
  notionalUsd: '10000',
  openedLeverage: '4',
  ...over,
})

// Position with real economics (LONG): 2 WETH size (= collateral leg), 1786 USDC debt, $1700 basis,
// entry 1712. The basis is deliberately NOT equity × entry (1 × 1712), so a regression onto the token
// basis fails. Break-even = (1700+1786)/2 = 1743; PnL at mark 2000 = 2·2000 − 1786 − 1700 = +514
// (30.24%). Accrued 50 USDC, borrow rate 4% (400bps).
const mkEconPos = (over?: Partial<MarginActivePosition>): MarginActivePosition =>
  mkPos({
    size: raw(2, 18),
    legs: [mkLeg({ debt: raw(1786, 6) })],
    accruedInterest: raw(50, 6),
    borrowRate: X18(0.04),
    costBasisUsd: raw(1700, 6),
    entryPrice: X18(1712),
    openedLeverage: '2',
    ...over,
  })

const mkLive = (over?: Partial<MarginMarketLive>): MarginMarketLive => ({
  availableBorrowLiquidity: '0',
  markPriceX18: X18(2000),
  lltvWad: X18(0.86),
  ...over,
})

const mkQuote = (over?: Partial<MarginQuoteResponse>): MarginQuoteResponse => ({
  requestId: 'q',
  action: 'open',
  chainId: MARGIN_CHAIN_ID,
  swapper: '0xswapper',
  direction: MarginDirection.LONG,
  exposureToken: EXPOSURE_TOKEN,
  counterToken: COUNTER_TOKEN,
  legs: [],
  deadlineSuggestion: '0',
  ...over,
  display: {
    effectivePrice: X18(2010),
    liquidationPrice: X18(1600),
    ...over?.display,
  },
})

const mkInput = (over?: Partial<ComposeInput>): ComposeInput => ({
  market: mkMarket(),
  live: mkLive(),
  positions: [mkPos()],
  prefs: DEFAULT_MARGIN_CHART_PREFS,
  planInFlight: false,
  paneHeightPx: 480,
  candleTimes: [],
  colors: COLORS,
  t: mockT,
  ...over,
})

const mkLine = (
  over: Partial<MarginOverlayLine> & Pick<MarginOverlayLine, 'id' | 'role' | 'priority' | 'price'>,
): MarginOverlayLine => ({
  color: '#ffffff',
  title: '',
  lineStyle: LineStyle.Dashed,
  axisLabelColor: '#ffffff',
  axisLabelTextColor: '#000000',
  ...over,
})

describe('positionsForMarket', () => {
  it('keeps only same-venue role-matched positions with an attributable basis', () => {
    const positions = [
      mkPos({}), // ✓
      mkPos({ legs: [mkLeg({ venue: 'AAVE_V3' })] }), // ✗ other venue
      mkPos({ legs: [] }), // ✓ absent leg → MORPHO
      mkPos({ entryPrice: '0', openedAt: '0' }), // ✗ no attributable basis
      mkPos({ direction: MarginDirection.SHORT }), // ✗ reversed venue roles (same pair, opposite direction)
    ]
    expect(positionsForMarket({ positions, market: mkMarket() })).toHaveLength(2)
  })
})

describe('shouldForceOverlayRebuild', () => {
  it('returns false on the first call (prev undefined)', () => {
    expect(shouldForceOverlayRebuild({ prevSeries: undefined, nextSeries: {} })).toBe(false)
  })

  it('returns false when the series reference is unchanged', () => {
    const series = {}
    expect(shouldForceOverlayRebuild({ prevSeries: series, nextSeries: series })).toBe(false)
  })

  it('returns true when the series reference changed', () => {
    expect(shouldForceOverlayRebuild({ prevSeries: {}, nextSeries: {} })).toBe(true)
  })
})

describe('snapToCandleTime', () => {
  const candleTimes = [100, 200, 300, 400].map(ts)

  it('returns the exact candle time on a direct match', () => {
    expect(snapToCandleTime({ time: 300, candleTimes })).toBe(300)
  })

  it('floors to the greatest candle at or below a between-candles event', () => {
    expect(snapToCandleTime({ time: 350, candleTimes })).toBe(300)
    expect(snapToCandleTime({ time: 250, candleTimes })).toBe(200)
  })

  it('snaps an event after the whole series to the last candle', () => {
    expect(snapToCandleTime({ time: 9999, candleTimes })).toBe(400)
  })

  it('drops (undefined) an event before the first candle', () => {
    expect(snapToCandleTime({ time: 50, candleTimes })).toBeUndefined()
  })

  it('drops (undefined) when there are no candles', () => {
    expect(snapToCandleTime({ time: 300, candleTimes: [] })).toBeUndefined()
  })
})

describe('composeMarginChartOverlays', () => {
  it('puts the liq zone below for LONG and above for SHORT', () => {
    const long = composeMarginChartOverlays(mkInput())
    expect(long.zone).toMatchObject({ side: 'below', edgePrice: 1500 })

    const short = composeMarginChartOverlays(
      mkInput({
        market: mkMarket({ direction: MarginDirection.SHORT }),
        positions: [mkPos({ direction: MarginDirection.SHORT, liquidationPrice: X18(2500) })],
      }),
    )
    expect(short.zone).toMatchObject({ side: 'above', edgePrice: 2500 })

    const noZone = composeMarginChartOverlays(mkInput({ prefs: { ...DEFAULT_MARGIN_CHART_PREFS, liqZone: false } }))
    expect(noZone.zone).toBeUndefined()
  })

  it('picks the primary by largest notionalUsd, most recent openedAt on ties', () => {
    const small = mkPos({ notionalUsd: '5000', entryPrice: X18(1700) })
    const big = mkPos({ notionalUsd: '50000', entryPrice: X18(1900) })
    const out = composeMarginChartOverlays(mkInput({ positions: [small, big] }))
    expect(out.priceLines.find((l) => l.id === 'entry')?.price).toBe(1900)

    const older = mkPos({ openedAt: '100', entryPrice: X18(1600) })
    const newer = mkPos({ openedAt: '200', entryPrice: X18(1650) })
    const tie = composeMarginChartOverlays(mkInput({ positions: [older, newer] }))
    expect(tie.priceLines.find((l) => l.id === 'entry')?.price).toBe(1650)

    // Absent notional coerces to 0, so any sized position beats it regardless of recency.
    const noNotional = mkPos({ notionalUsd: undefined, openedAt: '900' })
    const tiny = mkPos({ notionalUsd: '1', openedAt: '50', entryPrice: X18(1650) })
    const zero = composeMarginChartOverlays(mkInput({ positions: [noNotional, tiny] }))
    expect(zero.priceLines.find((l) => l.id === 'entry')?.price).toBe(1650)
  })

  it('renders non-primary positions as dimmed lines only', () => {
    const primary = mkPos({ notionalUsd: '50000' })
    const secondary = mkPos({
      notionalUsd: '100',
      legs: [mkLeg({ subId: '7' })],
      liquidationPrice: X18(1200),
      entryPrice: X18(1900),
    })
    const out = composeMarginChartOverlays(mkInput({ positions: [primary, secondary] }))

    const entries = out.priceLines.filter((l) => l.role === 'entry')
    const liqs = out.priceLines.filter((l) => l.role === 'liq')
    expect(entries).toHaveLength(2)
    expect(liqs).toHaveLength(2)

    const ghostEntry = entries.find((l) => l.price === 1900)
    expect(ghostEntry?.color).toBe('#00ff0073') // opacify(45, statusSuccess)
    expect(ghostEntry?.axisLabelVisible).toBe(false)
    const ghostLiq = liqs.find((l) => l.price === 1200)
    expect(ghostLiq?.color).toBe('#ff000073')
    expect(ghostLiq?.axisLabelVisible).toBe(false)

    // Non-primary lines are position-scoped by subId; the primary keeps the bare ids. Unique ids feed
    // the hover hit-test (which scopes primary-only tooltip explainers to the bare 'entry'/'liq') and
    // the reconcile key — the render path itself has no id-keyed dedup.
    expect(ghostEntry?.id).toBe('entry-7')
    expect(ghostLiq?.id).toBe('liq-7')
    expect(entries.find((l) => l.id === 'entry')?.price).toBe(1800)
    expect(liqs.find((l) => l.id === 'liq')?.price).toBe(1500)
    expect(new Set(out.priceLines.map((l) => l.id)).size).toBe(out.priceLines.length)

    // Zone + legend key off the primary only; markers stay empty here (no candle times to snap to).
    expect(out.zone?.edgePrice).toBe(1500)
    expect(out.legend).toBeDefined()
    expect(out.markers).toEqual([])
  })

  it('draws every position line but confines zone/BE/markers/legend to the primary', () => {
    // Primary carries real economics (finite break-even) + a snappable open; the smaller secondary
    // contributes only its two dimmed, position-scoped lines — no second BE, marker, zone or legend.
    const primary = mkEconPos({ notionalUsd: '50000' })
    const secondary = mkPos({
      notionalUsd: '100',
      legs: [mkLeg({ subId: '3' })],
      liquidationPrice: X18(1300),
      entryPrice: X18(1950),
      openedAt: '100',
    })
    const out = composeMarginChartOverlays(
      mkInput({ positions: [primary, secondary], candleTimes: [90, 100, 110].map(ts) }),
    )

    expect(out.priceLines.filter((l) => l.role === 'entry')).toHaveLength(2)
    expect(out.priceLines.filter((l) => l.role === 'liq')).toHaveLength(2)
    // Primary-only overlays: exactly one break-even line, one open marker (primary entry/time), legend, zone.
    expect(out.priceLines.filter((l) => l.role === 'breakEven')).toHaveLength(1)
    expect(out.markers).toEqual([{ time: 100, price: 1712, kind: 'open' }])
    expect(out.zone?.edgePrice).toBe(1500)
    expect(out.legend?.leverage).toBe('2x')
    // The secondary's lines exist under scoped ids and never claim an axis tag.
    expect(out.priceLines.find((l) => l.id === 'entry-3')?.axisLabelVisible).toBe(false)
    expect(out.priceLines.find((l) => l.id === 'liq-3')?.axisLabelVisible).toBe(false)
    expect(new Set(out.priceLines.map((l) => l.id)).size).toBe(out.priceLines.length)
  })

  it('mirrors the pane styling for mark/entry/liq lines', () => {
    const out = composeMarginChartOverlays(mkInput())
    expect(out.priceLines.find((l) => l.role === 'mark')).toMatchObject({
      id: 'mark',
      priority: 5,
      price: 2000,
      color: '#222222',
      lineStyle: LineStyle.Dashed,
      axisLabelColor: '#444444',
      axisLabelTextColor: '#111111',
      axisLabelVisible: false,
    })
    expect(out.priceLines.find((l) => l.id === 'entry')).toMatchObject({
      role: 'entry',
      priority: 1,
      price: 1800,
      color: '#00ff00',
      lineStyle: LineStyle.Dashed,
      axisLabelColor: '#00ff00',
      axisLabelTextColor: '#ffffff',
      lineWidth: 2,
    })
    expect(out.priceLines.find((l) => l.id === 'liq')).toMatchObject({
      role: 'liq',
      priority: 0,
      price: 1500,
      color: '#ff0000',
      lineStyle: LineStyle.Dashed,
      axisLabelColor: '#ff0000',
      axisLabelTextColor: '#ffffff',
      lineWidth: 2,
    })
  })

  it('emits preview lines only with an OPEN quote liq price and the previewLines pref', () => {
    const isPreview = (l: MarginOverlayLine): boolean => l.role === 'previewEntry' || l.role === 'previewLiq'

    const none = composeMarginChartOverlays(mkInput())
    expect(none.priceLines.some(isPreview)).toBe(false)

    const withQuote = composeMarginChartOverlays(mkInput({ quote: mkQuote() }))
    expect(withQuote.priceLines.find((l) => l.role === 'previewLiq')).toMatchObject({ price: 1600, priority: 2 })
    expect(withQuote.priceLines.find((l) => l.role === 'previewEntry')).toMatchObject({ price: 2010, priority: 3 })

    // A quote with no liq price (risk block not yet loaded) renders nothing.
    const noLiq = composeMarginChartOverlays(mkInput({ quote: mkQuote({ display: { liquidationPrice: undefined } }) }))
    expect(noLiq.priceLines.some(isPreview)).toBe(false)

    const off = composeMarginChartOverlays(
      mkInput({ quote: mkQuote(), prefs: { ...DEFAULT_MARGIN_CHART_PREFS, previewLines: false } }),
    )
    expect(off.priceLines.some(isPreview)).toBe(false)
  })

  it('keeps previews during plan flight, dimmed at 0.6 opacity', () => {
    const inFlight = composeMarginChartOverlays(mkInput({ quote: mkQuote(), planInFlight: true }))
    const previewLiq = inFlight.priceLines.find((l) => l.role === 'previewLiq')
    const previewEntry = inFlight.priceLines.find((l) => l.role === 'previewEntry')
    expect(previewLiq?.price).toBe(1600)
    expect(previewLiq?.opacity).toBe(0.6)
    expect(previewEntry?.price).toBe(2010)
    expect(previewEntry?.opacity).toBe(0.6)

    const idle = composeMarginChartOverlays(mkInput({ quote: mkQuote() }))
    expect(idle.priceLines.find((l) => l.role === 'previewLiq')?.opacity).toBeUndefined()
    expect(idle.priceLines.find((l) => l.role === 'previewEntry')?.opacity).toBeUndefined()
  })

  it('dims the mark line to 0.5 opacity when the mark is stale', () => {
    expect(composeMarginChartOverlays(mkInput()).priceLines.find((l) => l.role === 'mark')?.opacity).toBeUndefined()
    expect(
      composeMarginChartOverlays(mkInput({ markStale: true })).priceLines.find((l) => l.role === 'mark')?.opacity,
    ).toBe(0.5)
  })

  it('styles preview lines and wires the distance-annotated liq title', () => {
    const out = composeMarginChartOverlays(mkInput({ quote: mkQuote() }))

    // preview-entry: accent1, dotted, axis tag hidden.
    expect(out.priceLines.find((l) => l.role === 'previewEntry')).toMatchObject({
      color: COLORS.accent1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
      title: 'margin.chart.line.previewEntry',
    })

    // preview-liq: statusCritical at 60% alpha, dotted, axis tag hidden.
    expect(out.priceLines.find((l) => l.role === 'previewLiq')).toMatchObject({
      color: opacify(60, COLORS.statusCritical),
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
      title: 'margin.chart.line.previewLiq',
    })

    // Primary liq line title uses the distance key when a mark yields a distance (passthrough t → key).
    expect(out.priceLines.find((l) => l.id === 'liq')?.title).toBe('margin.chart.line.liqDistance')
  })

  it('falls back to the plain liq title when no mark yields a distance', () => {
    const out = composeMarginChartOverlays(mkInput({ positions: [mkPos({ oraclePrice: '0' })] }))
    const liq = out.priceLines.find((l) => l.id === 'liq')
    expect(liq?.distanceSignedPct).toBeUndefined()
    expect(liq?.title).toBe('margin.chart.line.liq')
  })

  it('measures each liq distance against ITS OWN position mark, not the markets poll', () => {
    // The markets poll is up to 90s behind the per-request oracle read the position row carries, and the
    // liq price was computed against the latter — so pairing it with the live mark reports a distance
    // neither read agrees with. liq 1500 vs the position mark 1600 is −6.25%, vs the live 2000 is −25%.
    const out = composeMarginChartOverlays(
      mkInput({ positions: [mkPos({ oraclePrice: X18(1600) })], live: mkLive({ markPriceX18: X18(2000) }) }),
    )
    expect(out.priceLines.find((l) => l.id === 'liq')?.distanceSignedPct).toBeCloseTo(-6.25, 8)
    // The "Current" line stays market-scoped.
    expect(out.priceLines.find((l) => l.role === 'mark')?.price).toBe(2000)
  })

  it('draws no entry or liq line at a non-positive price', () => {
    const noEntry = composeMarginChartOverlays(mkInput({ positions: [mkPos({ entryPrice: '0' })] }))
    expect(noEntry.priceLines.some((l) => l.role === 'entry')).toBe(false)
    expect(noEntry.priceLines.some((l) => l.role === 'liq')).toBe(true)

    // Debt-free: the backend reports liq 0, and a zone edge at 0 is not a zone.
    const noLiq = composeMarginChartOverlays(mkInput({ positions: [mkPos({ liquidationPrice: '0' })] }))
    expect(noLiq.priceLines.some((l) => l.role === 'liq')).toBe(false)
    expect(noLiq.priceLines.some((l) => l.role === 'entry')).toBe(true)
    expect(noLiq.zone).toBeUndefined()
  })

  it('signs liq distance geometrically: a long reads negative, a short positive', () => {
    // LONG: mark 2000, liq 1500 → price must FALL 25%.
    const long = composeMarginChartOverlays(mkInput())
    expect(long.priceLines.find((l) => l.id === 'liq')?.distanceSignedPct).toBeCloseTo(-25, 8)

    // SHORT: mark 2000, liq 2500 → price must RISE 25%.
    const short = composeMarginChartOverlays(
      mkInput({
        market: mkMarket({ direction: MarginDirection.SHORT }),
        positions: [mkPos({ liquidationPrice: X18(2500) })],
      }),
    )
    expect(short.priceLines.find((l) => l.id === 'liq')?.distanceSignedPct).toBeCloseTo(25, 8)

    // The quote's own mark wins, so the preview distance matches the liq price it was computed against.
    const quoteMarked = composeMarginChartOverlays(
      mkInput({ live: undefined, quote: mkQuote({ display: { oraclePrice: X18(1800) } }) }),
    )
    expect(quoteMarked.priceLines.find((l) => l.role === 'previewLiq')?.distanceSignedPct).toBeCloseTo(
      ((1600 - 1800) / 1800) * 100,
      8,
    )

    // …else the live mark…
    const withMark = composeMarginChartOverlays(mkInput({ quote: mkQuote() }))
    expect(withMark.priceLines.find((l) => l.role === 'previewLiq')?.distanceSignedPct).toBeCloseTo(-20, 8)

    // …else the quote entry as a proxy.
    const proxied = composeMarginChartOverlays(mkInput({ live: undefined, quote: mkQuote() }))
    expect(proxied.priceLines.find((l) => l.role === 'previewLiq')?.distanceSignedPct).toBeCloseTo(
      ((1600 - 2010) / 2010) * 100,
      8,
    )
  })

  it('suppresses the lower-priority axis tag within 14px; higher priority wins', () => {
    // Range 1000..3000 over 480px → 0.24px per price unit; 14px ↔ ~58 price units.
    const range = { min: 1000, max: 3000 }
    const near = [mkPos({ liquidationPrice: X18(1500), entryPrice: X18(1520) })]

    const out = composeMarginChartOverlays(mkInput({ positions: near, visiblePriceRange: range }))
    expect(out.priceLines.find((l) => l.id === 'liq')?.axisLabelVisible).not.toBe(false)
    expect(out.priceLines.find((l) => l.id === 'entry')?.axisLabelVisible).toBe(false)

    // Without a visible range, suppression is skipped entirely.
    const noRange = composeMarginChartOverlays(mkInput({ positions: near }))
    expect(noRange.priceLines.find((l) => l.id === 'entry')?.axisLabelVisible).not.toBe(false)

    // Emission-hidden tags never claim a slot: a hidden ghost liq (priority 0) 10 price units from
    // the primary entry must not suppress the entry's tag.
    const ghost = mkPos({
      notionalUsd: '1',
      legs: [mkLeg({ subId: '9' })],
      liquidationPrice: X18(1810),
      entryPrice: X18(900),
    })
    const withGhost = composeMarginChartOverlays(mkInput({ positions: [mkPos(), ghost], visiblePriceRange: range }))
    expect(withGhost.priceLines.find((l) => l.id === 'entry')?.axisLabelVisible).not.toBe(false)
  })

  it('merges entry and breakEven labels within 14px, dropping the BE line', () => {
    const entry = mkLine({ id: 'entry', role: 'entry', priority: 1, price: 1800 })
    const be = mkLine({ id: 'breakEven', role: 'breakEven', priority: 4, price: 1810 })

    const merged = applyLabelCollision({ lines: [entry, be], range: { min: 1000, max: 3000 }, heightPx: 480 })
    expect(merged.some((l) => l.role === 'breakEven')).toBe(false)
    expect(merged.find((l) => l.role === 'entry')?.mergedLabel).toBe('entry+be')

    const farBe = mkLine({ id: 'breakEven', role: 'breakEven', priority: 4, price: 2500 })
    const apart = applyLabelCollision({ lines: [entry, farBe], range: { min: 1000, max: 3000 }, heightPx: 480 })
    expect(apart.some((l) => l.role === 'breakEven')).toBe(true)
    expect(apart.find((l) => l.role === 'entry')?.mergedLabel).toBeUndefined()

    // No range → no merge either.
    const unranged = applyLabelCollision({ lines: [entry, be], range: undefined, heightPx: 480 })
    expect(unranged.some((l) => l.role === 'breakEven')).toBe(true)
  })

  it('pads autoscale bounds ±2% around all line prices and the zone edge', () => {
    // Lines: mark 2000, entry 1800, liq 1500 (zone edge 1500).
    const out = composeMarginChartOverlays(mkInput())
    expect(out.autoscaleBounds?.min).toBeCloseTo(1500 * 0.98, 8)
    expect(out.autoscaleBounds?.max).toBeCloseTo(2000 * 1.02, 8)

    const empty = composeMarginChartOverlays(mkInput({ live: undefined, positions: [] }))
    expect(empty.priceLines).toHaveLength(0)
    expect(empty.autoscaleBounds).toBeUndefined()
  })

  it('ramps zone emphasis from 0 to 1 inside the 10% liq-distance window', () => {
    const emphasisAt = (liq: number): number | undefined =>
      composeMarginChartOverlays(mkInput({ positions: [mkPos({ liquidationPrice: X18(liq) })] })).zone?.emphasis
    expect(emphasisAt(1700)).toBe(0) // 15% away — outside the window
    expect(emphasisAt(1800)).toBeCloseTo(0, 8) // exactly 10%
    expect(emphasisAt(1900)).toBeCloseTo(0.5, 8) // 5%
    expect(emphasisAt(1990)).toBeCloseTo(0.95, 8)
    expect(emphasisAt(2000)).toBeCloseTo(1, 8) // at the mark
  })

  it('showPosition=false strips all position-derived output', () => {
    const hidden = composeMarginChartOverlays(
      mkInput({ quote: mkQuote(), prefs: { ...DEFAULT_MARGIN_CHART_PREFS, showPosition: false } }),
    )
    expect(hidden.priceLines.some((l) => l.role === 'entry' || l.role === 'liq')).toBe(false)
    expect(hidden.zone).toBeUndefined()
    expect(hidden.legend).toBeUndefined()
    expect(hidden.markers).toEqual([])
    // Mark + previews are not position-derived.
    expect(hidden.priceLines.some((l) => l.role === 'mark')).toBe(true)
    expect(hidden.priceLines.some((l) => l.role === 'previewLiq')).toBe(true)

    const noChip = composeMarginChartOverlays(mkInput({ prefs: { ...DEFAULT_MARGIN_CHART_PREFS, summaryChip: false } }))
    expect(noChip.legend).toBeUndefined()

    // Legend leverage keeps one decimal, trimming a trailing .0.
    const fractional = composeMarginChartOverlays(mkInput({ positions: [mkPos({ openedLeverage: '2.5' })] }))
    expect(fractional.legend?.leverage).toBe('2.5x')
  })

  it('states no leverage where the indexer recorded no open-time ratio', () => {
    // mockT drops options, so the entry line's interpolated value needs a t that keeps them.
    const withOpts = ((key: string, opts?: { leverage?: string }) =>
      `${key}|${opts?.leverage ?? ''}`) as unknown as TFunction
    const entryTitle = (out: ReturnType<typeof composeMarginChartOverlays>): string | undefined =>
      out.priceLines.find((line) => line.id === 'entry')?.title

    // '0' is what the indexer stamps when it never recorded a ratio, and it is not nullish — a
    // `?? '0'` fallback sails past it and labels the position a real "0x".
    for (const openedLeverage of ['0', undefined]) {
      const out = composeMarginChartOverlays(mkInput({ positions: [mkPos({ openedLeverage })], t: withOpts }))
      expect(out.legend?.leverage).toBeUndefined()
      expect(out.primaryLeverage).toBeUndefined()
      expect(entryTitle(out)).toBe('margin.chart.line.entry|—')
    }

    const known = composeMarginChartOverlays(mkInput({ positions: [mkPos({ openedLeverage: '3' })], t: withOpts }))
    expect(known.legend?.leverage).toBe('3x')
    expect(known.primaryLeverage).toBe('3x')
    expect(entryTitle(known)).toBe('margin.chart.line.entry|3x')
  })

  it('emits a dotted neutral break-even line with a visible, subdued axis tag', () => {
    const out = composeMarginChartOverlays(mkInput({ positions: [mkEconPos()] }))
    expect(out.priceLines.find((l) => l.role === 'breakEven')).toMatchObject({
      id: 'breakEven',
      priority: 4,
      price: 1743,
      color: COLORS.neutral2,
      lineStyle: LineStyle.Dotted,
      axisLabelColor: COLORS.surface3Solid,
      axisLabelTextColor: COLORS.neutral1,
      axisLabelVisible: true,
      title: 'margin.chart.line.breakEven',
    })
  })

  it('gates the break-even line on the pref, a primary econ, and a finite break-even', () => {
    const off = composeMarginChartOverlays(
      mkInput({ positions: [mkEconPos()], prefs: { ...DEFAULT_MARGIN_CHART_PREFS, breakEven: false } }),
    )
    expect(off.priceLines.some((l) => l.role === 'breakEven')).toBe(false)

    // No primary (showPosition off) → nothing to solve against → no line.
    const noPos = composeMarginChartOverlays(
      mkInput({ positions: [mkEconPos()], prefs: { ...DEFAULT_MARGIN_CHART_PREFS, showPosition: false } }),
    )
    expect(noPos.priceLines.some((l) => l.role === 'breakEven')).toBe(false)

    // No server basis (not yet valued) → no line, but every other position line stays.
    const unvalued = composeMarginChartOverlays(mkInput({ positions: [mkEconPos({ costBasisUsd: undefined })] }))
    expect(unvalued.priceLines.some((l) => l.role === 'breakEven')).toBe(false)
    expect(unvalued.priceLines.some((l) => l.role === 'entry')).toBe(true)

    // Nothing left to sell → no break-even, other lines stay.
    const emptied = composeMarginChartOverlays(mkInput({ positions: [mkEconPos({ size: '0' })] }))
    expect(emptied.priceLines.some((l) => l.role === 'breakEven')).toBe(false)
    expect(emptied.priceLines.some((l) => l.role === 'entry')).toBe(true)
  })

  it('fills legend net-PnL, accrued USD, and the raw live-interest ticker inputs from econ', () => {
    const out = composeMarginChartOverlays(mkInput({ positions: [mkEconPos()] }))
    expect(out.legend?.pnlUsd).toBeCloseTo(514, 6)
    expect(out.legend?.pnlPct).toBeCloseTo(30.2353, 4)
    expect(out.legend?.pnlFloored).toBe(false)
    expect(out.legend?.accruedUsd).toBeCloseTo(50, 6)
    expect(out.legend?.ticker).toEqual({
      normalizedAccrued: 50,
      normalizedDebt: 1786,
      apyBps: 400,
      direction: MarginDirection.LONG,
      mark: 2000,
    })
  })

  it('coerces the ticker apyBps: position rate wins, else the live number, else 0', () => {
    const fromPos = composeMarginChartOverlays(mkInput({ positions: [mkEconPos({ borrowRate: X18(0.0512) })] }))
    expect(fromPos.legend?.ticker?.apyBps).toBe(512)

    const fromLive = composeMarginChartOverlays(
      mkInput({ positions: [mkEconPos({ borrowRate: undefined })], live: mkLive({ borrowApyBps: 350 }) }),
    )
    expect(fromLive.legend?.ticker?.apyBps).toBe(350)

    const neither = composeMarginChartOverlays(
      mkInput({ positions: [mkEconPos({ borrowRate: undefined })], live: mkLive({ borrowApyBps: undefined }) }),
    )
    expect(neither.legend?.ticker?.apyBps).toBe(0)
  })

  it('SHORT accrued rides the mark; ticker carries direction + mark for the chip', () => {
    const shortPos = mkEconPos({
      direction: MarginDirection.SHORT,
      size: raw(1, 18), // SHORT: exposure leg (size) is the debt leg — 1 WETH
      legs: [mkLeg({ debt: raw(1, 18) })],
      accruedInterest: raw(1, 15), // 0.001 WETH debt units
      costBasisUsd: raw(1800, 6),
      entryPrice: X18(1800),
      openedLeverage: '2',
    })
    const out = composeMarginChartOverlays(
      mkInput({
        market: mkMarket({
          direction: MarginDirection.SHORT,
          collateral: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
          debt: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
        }),
        positions: [shortPos],
      }),
    )
    // accrued 0.001 WETH × mark 2000 = 2 USD.
    expect(out.legend?.accruedUsd).toBeCloseTo(2, 6)
    expect(out.legend?.ticker).toMatchObject({ direction: MarginDirection.SHORT, mark: 2000, normalizedDebt: 1 })
  })

  it('computes autoscale bounds from the PRE-merge line set (merged BE still widens bounds)', () => {
    // entry 1740 and break-even 1743 collapse (merge drops the BE line) yet the highest price is BE.
    // Pre-merge bounds must still span 1743 — guards against a merge→shrink→rescale→unmerge loop.
    const pos = mkEconPos({ entryPrice: X18(1740) })
    const out = composeMarginChartOverlays(
      mkInput({
        positions: [pos],
        live: mkLive({ markPriceX18: X18(1700) }),
        visiblePriceRange: { min: 1000, max: 3000 },
      }),
    )
    // Merge fired: BE line dropped, entry carries the merged label.
    expect(out.priceLines.some((l) => l.role === 'breakEven')).toBe(false)
    expect(out.priceLines.find((l) => l.role === 'entry')?.mergedLabel).toBe('entry+be')
    // The surviving entry line renders the combined Entry·BE title (passthrough t → key).
    expect(out.priceLines.find((l) => l.role === 'entry')?.title).toBe('margin.chart.line.entryBe')
    // Bounds span the (dropped) break-even price, not the surviving entry price.
    expect(out.autoscaleBounds?.max).toBeCloseTo(1743 * 1.02, 6)
  })

  it('breaks primacy ties without NaN when notionalUsd is malformed', () => {
    const malformed = mkPos({ notionalUsd: 'not-a-number', entryPrice: X18(1700) })
    const valid = mkPos({ notionalUsd: '5000', entryPrice: X18(1900) })
    const out = composeMarginChartOverlays(mkInput({ positions: [malformed, valid] }))
    // Malformed notional coerces to 0, so the sized position wins deterministically.
    expect(out.priceLines.find((l) => l.id === 'entry')?.price).toBe(1900)
  })

  it('still emits the zone (emphasis 0) when positions exist but there is no live mark', () => {
    const out = composeMarginChartOverlays(mkInput({ live: undefined }))
    expect(out.zone).toMatchObject({ edgePrice: 1500, side: 'below', emphasis: 0 })
  })

  it('still draws the preview line but drops the distance when no mark is available', () => {
    const out = composeMarginChartOverlays(
      mkInput({ live: undefined, quote: mkQuote({ display: { effectivePrice: undefined } }) }),
    )
    const previewLiq = out.priceLines.find((l) => l.role === 'previewLiq')
    expect(previewLiq?.price).toBe(1600)
    expect(previewLiq?.distanceSignedPct).toBeUndefined()
  })

  it('emits an open marker for the primary at the snapped entry candle (price = entry)', () => {
    // default: openedAt 100, entryPrice 1800. Exact-match candle at 100.
    const out = composeMarginChartOverlays(mkInput({ candleTimes: [90, 100, 110].map(ts) }))
    expect(out.markers).toEqual([{ time: 100, price: 1800, kind: 'open' }])
  })

  it('floors the open marker to the candle at or before openedAt', () => {
    // openedAt 100 falls between candles 80 and 95 → floors to 95.
    const out = composeMarginChartOverlays(mkInput({ candleTimes: [80, 95].map(ts) }))
    expect(out.markers).toEqual([{ time: 95, price: 1800, kind: 'open' }])
  })

  it('drops the open marker when the position predates the visible series', () => {
    // openedAt 100 is before the first candle (200) → marker dropped.
    const out = composeMarginChartOverlays(mkInput({ candleTimes: [200, 300].map(ts) }))
    expect(out.markers).toEqual([])
  })

  it('emits decrease markers at exit price, skipping decreases missing exitPrice', () => {
    const withDecreases = mkPos({
      decreases: [
        { debtRepaid: raw(500, 6), collateralSold: raw(1, 17), exitPrice: X18(1900), timestamp: '250', txHash: '0xd1' },
        // collateralSold 0 → exitPrice absent → skipped.
        { debtRepaid: raw(100, 6), collateralSold: '0', timestamp: '350', txHash: '0xd2' },
      ],
    })
    const out = composeMarginChartOverlays(
      mkInput({ positions: [withDecreases], candleTimes: [100, 200, 300, 400].map(ts) }),
    )
    expect(out.markers).toEqual([
      { time: 100, price: 1800, kind: 'open' }, // openedAt 100
      { time: 200, price: 1900, kind: 'decrease' }, // timestamp 250 → floor 200
    ])
  })

  it('emits markers for the primary position only', () => {
    const primary = mkPos({ notionalUsd: '50000', openedAt: '100', entryPrice: X18(1800) })
    const secondary = mkPos({
      notionalUsd: '100',
      legs: [mkLeg({ subId: '7' })],
      openedAt: '200',
      entryPrice: X18(1500),
    })
    const out = composeMarginChartOverlays(
      mkInput({ positions: [primary, secondary], candleTimes: [100, 200].map(ts) }),
    )
    expect(out.markers).toEqual([{ time: 100, price: 1800, kind: 'open' }])
  })

  it('emits no markers when the markers pref is off', () => {
    const out = composeMarginChartOverlays(
      mkInput({ candleTimes: [100, 200].map(ts), prefs: { ...DEFAULT_MARGIN_CHART_PREFS, markers: false } }),
    )
    expect(out.markers).toEqual([])
  })

  it('exposes primary sizes, the USD basis and formatted open leverage for the hover tooltip', () => {
    const out = composeMarginChartOverlays(mkInput({ positions: [mkEconPos()] }))
    expect(out.econ).toEqual({
      collateral: 2,
      collateralAtOpen: 0, // mkEconPos leaves collateralAtOpen at mkPos's default '0'
      debt: 1786,
      direction: MarginDirection.LONG,
    })
    expect(out.usdBasis).toEqual({ direction: MarginDirection.LONG, collateral: 2, debt: 1786, costBasisUsd: 1700 })
    expect(out.primaryLeverage).toBe('2x')
  })

  it('keeps the identity chip and accrued interest when the server cannot value the position yet', () => {
    const out = composeMarginChartOverlays(mkInput({ positions: [mkEconPos({ costBasisUsd: undefined })] }))
    expect(out.usdBasis).toBeUndefined()
    expect(out.legend?.pnlUsd).toBeUndefined()
    expect(out.legend?.pnlPct).toBeUndefined()
    expect(out.legend).toMatchObject({ pair: 'ETH / USDC', leverage: '2x', accruedUsd: 50 })
  })

  it('suppresses the PnL for an untradable pair, whose direction is a guess', () => {
    const out = composeMarginChartOverlays(mkInput({ positions: [mkEconPos({ isTradable: false })] }))
    expect(out.usdBasis).toBeUndefined()
    expect(out.legend?.pnlUsd).toBeUndefined()
  })

  it('flags a PnL percent sitting on its floor so the chip can say "at least"', () => {
    // 2 WETH against 1786 USDC of debt at a mark of 800: equity −186 against a 1700 basis, so −110.9%.
    const out = composeMarginChartOverlays(mkInput({ positions: [mkEconPos({ oraclePrice: X18(800) })] }))
    expect(out.legend?.pnlUsd).toBeCloseTo(-1886, 6)
    expect(out.legend?.pnlPct).toBe(-100)
    expect(out.legend?.pnlFloored).toBe(true)
  })

  it('formats the entry-line leverage with one decimal (matching the legend), not rounded', () => {
    // formatMaxLeverage rounds 2.5→"3x"; the entry line must use the legend's one-decimal "2.5x".
    // Passthrough t drops interpolation options, so capture them with a spy.
    const calls: Array<{ key: string; opts?: Record<string, unknown> }> = []
    const spyT = ((key: string, opts?: Record<string, unknown>) => {
      calls.push({ key, opts })
      return key
    }) as unknown as TFunction
    composeMarginChartOverlays(mkInput({ positions: [mkPos({ openedLeverage: '2.5' })], t: spyT }))
    expect(calls.find((c) => c.key === 'margin.chart.line.entry')?.opts).toEqual({ leverage: '2.5x' })
  })

  it('omits econ + leverage when positions are hidden or absent', () => {
    const hidden = composeMarginChartOverlays(
      mkInput({ positions: [mkEconPos()], prefs: { ...DEFAULT_MARGIN_CHART_PREFS, showPosition: false } }),
    )
    expect(hidden.econ).toBeUndefined()
    expect(hidden.primaryLeverage).toBeUndefined()

    const none = composeMarginChartOverlays(mkInput({ positions: [] }))
    expect(none.econ).toBeUndefined()
    expect(none.primaryLeverage).toBeUndefined()
  })
})

describe('isMarkStale', () => {
  const refetchMs = 60_000
  it('false before the first successful fetch (updatedAt 0)', () =>
    expect(isMarkStale({ updatedAt: 0, now: 1_000_000, refetchMs })).toBe(false))
  it('false within 2 poll intervals', () =>
    expect(isMarkStale({ updatedAt: 1_000_000, now: 1_000_000 + 119_000, refetchMs })).toBe(false))
  it('true past 2 poll intervals', () =>
    expect(isMarkStale({ updatedAt: 1_000_000, now: 1_000_000 + 121_000, refetchMs })).toBe(true))
})

describe('nearestOverlay', () => {
  // Identity-ish converters: y = price, x = time. The pure function only compares pixel distances,
  // so plain linear maps keep the fixtures readable.
  const priceToY = (price: number): number | null => price
  const timeToX = (time: UTCTimestamp): number | null => time

  const liq = mkLine({ id: 'liq', role: 'liq', priority: 0, price: 100 })
  const mark = mkLine({ id: 'mark', role: 'mark', priority: 5, price: 120 })

  it('returns the nearest line within the 8px band', () => {
    const hit = nearestOverlay({ hover: { x: 0, y: 106 }, lines: [liq, mark], markers: [], priceToY, timeToX })
    expect(hit).toEqual({ role: 'liq', price: 100, id: 'liq' })
  })

  it('returns undefined when nothing is within range', () => {
    expect(nearestOverlay({ hover: { x: 0, y: 109 }, lines: [liq], markers: [], priceToY, timeToX })).toBeUndefined()
  })

  it('breaks exact-distance ties by priority order', () => {
    const breakEven = mkLine({ id: 'breakEven', role: 'breakEven', priority: 4, price: 100 })
    const entry = mkLine({ id: 'entry', role: 'entry', priority: 1, price: 108 })
    // y=104 is exactly 4px from both — entry (priority 1) beats breakEven (priority 4).
    const hit = nearestOverlay({
      hover: { x: 0, y: 104 },
      lines: [breakEven, entry],
      markers: [],
      priceToY,
      timeToX,
    })
    expect(hit).toEqual({ role: 'entry', price: 108, id: 'entry' })
  })

  it('markers beat lines and carry their raw fields', () => {
    const markers = [{ time: ts(50), price: 104, kind: 'open' as const }]
    // Marker at (50,104) is 6px from the hover; the liq line is only 4px below — marker still wins.
    const hit = nearestOverlay({ hover: { x: 44, y: 104 }, lines: [liq], markers, priceToY, timeToX })
    expect(hit).toEqual({ role: 'marker', price: 104, marker: { kind: 'open', time: 50, price: 104 } })
  })

  it('ignores markers outside the 10px radius', () => {
    const markers = [{ time: ts(50), price: 104, kind: 'open' as const }]
    const hit = nearestOverlay({ hover: { x: 30, y: 104 }, lines: [liq], markers, priceToY, timeToX })
    expect(hit).toEqual({ role: 'liq', price: 100, id: 'liq' })
  })

  it('picks the nearest of several markers', () => {
    const markers = [
      { time: ts(50), price: 104, kind: 'open' as const },
      { time: ts(58), price: 104, kind: 'decrease' as const },
    ]
    const hit = nearestOverlay({ hover: { x: 56, y: 104 }, lines: [], markers, priceToY, timeToX })
    expect(hit?.marker?.kind).toBe('decrease')
  })

  it('falls back to the zone fill when inside it and on no line', () => {
    const zone = { edgePrice: 100, side: 'below' as const, emphasis: 0.5 }
    // Screen y grows downward: y=115 is inside the below-zone but past the liq line's 8px band.
    const hit = nearestOverlay({ hover: { x: 0, y: 115 }, lines: [liq], markers: [], zone, priceToY, timeToX })
    expect(hit).toEqual({ role: 'zone', price: 100 })
  })

  it('prefers a line hit over the zone fill', () => {
    const zone = { edgePrice: 100, side: 'below' as const, emphasis: 0 }
    const hit = nearestOverlay({ hover: { x: 0, y: 104 }, lines: [liq], markers: [], zone, priceToY, timeToX })
    expect(hit).toEqual({ role: 'liq', price: 100, id: 'liq' })
  })

  it("respects the zone side ('above' zones need the hover above the edge)", () => {
    const zone = { edgePrice: 100, side: 'above' as const, emphasis: 0 }
    expect(nearestOverlay({ hover: { x: 0, y: 120 }, lines: [], markers: [], zone, priceToY, timeToX })).toBeUndefined()
    expect(nearestOverlay({ hover: { x: 0, y: 80 }, lines: [], markers: [], zone, priceToY, timeToX })).toEqual({
      role: 'zone',
      price: 100,
    })
  })

  it('skips overlays whose coordinates resolve to null', () => {
    const nullY = (): number | null => null
    const hit = nearestOverlay({
      hover: { x: 0, y: 100 },
      lines: [liq],
      markers: [{ time: ts(0), price: 100, kind: 'open' }],
      zone: { edgePrice: 100, side: 'below', emphasis: 0 },
      priceToY: nullY,
      timeToX,
    })
    expect(hit).toBeUndefined()
  })

  it('threads the hit line id through (primary and ghost)', () => {
    const primaryEntry = mkLine({ id: 'entry', role: 'entry', priority: 1, price: 100 })
    const ghostEntry = mkLine({ id: 'entry-2', role: 'entry', priority: 1, price: 100 })
    expect(nearestOverlay({ hover: { x: 0, y: 100 }, lines: [primaryEntry], markers: [], priceToY, timeToX })?.id).toBe(
      'entry',
    )
    expect(nearestOverlay({ hover: { x: 0, y: 100 }, lines: [ghostEntry], markers: [], priceToY, timeToX })?.id).toBe(
      'entry-2',
    )
  })
})
