import type { TFunction } from 'i18next'
import { LineStyle } from 'lightweight-charts'
import type {
  MarginActivePosition,
  MarginPositionLeg,
  MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import type { MarginMarket } from '~/constants/margin'
import type { MarginMarketLive } from '~/features/margin/hooks/useMarginMarkets'
import { isMarkStale } from '~/features/margin/utils/marginFormat'
import {
  applyLabelCollision,
  composeMarginChartOverlays,
  leverageTierColor,
  nearestOverlay,
  positionsForMarket,
  estimateLiqPrice,
  readableTextColor,
  scaleLiqPriceToLeverage,
  showsMarginOpenPreview,
  shouldForceOverlayRebuild,
  unquotedLeverage,
  type ComposeInput,
  type MarginChartColors,
  type MarginOverlayLine,
} from '~/pages/Swap/Margin/chart/useMarginChartOverlays'

const mockT = ((key: string) => key) as TFunction

// Exact X18 wire strings (1e18-scaled decimals) without float drift.
const X18 = (n: number): string => (BigInt(Math.round(n * 1e6)) * 10n ** 12n).toString()
// Raw integer token units at a leg's decimals (whole-number fixtures).
const raw = (whole: number, decimals: number): string => (BigInt(whole) * 10n ** BigInt(decimals)).toString()

const COLORS: MarginChartColors = {
  statusSuccess: '#00ff00',
  statusWarning: '#ffaa00',
  statusCritical: '#ff0000',
  neutral1: '#111111',
  neutral2: '#222222',
  neutral3: '#333333',
  accent1: '#aa00aa',
  surface1: '#0d0d0d',
  surface3Solid: '#444444',
  white: '#ffffff',
  black: '#000000',
}

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

// LONG position fixture, ACTIVE status. Mark 2000 (oraclePrice), entry 1800, liq 1500.
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

// Position with real economics (LONG): 2 WETH size, 1786 USDC debt, $1700 basis.
// Break-even = (1700+1786)/2 = 1743.
const mkEconPos = (over?: Partial<MarginActivePosition>): MarginActivePosition =>
  mkPos({
    size: raw(2, 18),
    legs: [mkLeg({ debt: raw(1786, 6) })],
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
  planInFlight: false,
  paneHeightPx: 480,
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

describe('positionsForMarket', () => {
  it('keeps only same-venue role-matched positions with an attributable basis', () => {
    const market = mkMarket()
    const keep = mkPos({ positionId: 'keep' })
    const otherVenue = mkPos({ positionId: 'aave', legs: [mkLeg({ venue: 'AAVE_V3' })] })
    const mirrored = mkPos({ positionId: 'mirror', exposureToken: COUNTER_TOKEN, counterToken: EXPOSURE_TOKEN })
    const noBasis = mkPos({ positionId: 'nobasis', entryPrice: '0' })
    expect(
      positionsForMarket({ positions: [keep, otherVenue, mirrored, noBasis], market }).map((p) => p.positionId),
    ).toEqual(['keep'])
  })
})

describe('composeMarginChartOverlays focused position', () => {
  it('draws no position lines or zone without a focused position', () => {
    const out = composeMarginChartOverlays(mkInput())
    expect(out.priceLines.map((l) => l.role)).toEqual(['mark'])
    expect(out.zone).toBeUndefined()
  })

  it('draws the focused position’s entry and liq lines', () => {
    const out = composeMarginChartOverlays(mkInput({ position: mkPos() }))
    expect(out.priceLines.find((l) => l.id === 'entry')).toMatchObject({
      role: 'entry',
      priority: 1,
      price: 1800,
      color: '#00ff00',
      lineStyle: LineStyle.Dashed,
      axisLabelTextColor: '#ffffff',
      lineWidth: 2,
      title: 'margin.chart.line.entry',
    })
    expect(out.priceLines.find((l) => l.id === 'liq')).toMatchObject({
      role: 'liq',
      priority: 0,
      price: 1500,
      color: '#ff0000',
      lineStyle: LineStyle.Dashed,
      lineWidth: 2,
      title: 'margin.chart.line.liqDistance',
    })
    // Measured against the position's own mark (2000): −25%.
    expect(out.priceLines.find((l) => l.id === 'liq')?.distanceSignedPct).toBeCloseTo(-25, 8)
  })

  it('shades the liquidation zone below a long and above a short, and fits it in the bounds', () => {
    const long = composeMarginChartOverlays(mkInput({ position: mkPos() }))
    expect(long.zone).toMatchObject({ edgePrice: 1500, side: 'below' })
    expect(long.autoscaleBounds?.min).toBeCloseTo(1500 * 0.98, 8)

    const short = composeMarginChartOverlays(
      mkInput({
        market: mkMarket({ direction: MarginDirection.SHORT }),
        position: mkPos({ liquidationPrice: X18(2500) }),
      }),
    )
    expect(short.zone).toMatchObject({ edgePrice: 2500, side: 'above' })
  })

  it('draws a dotted break-even line with a visible, subdued axis tag', () => {
    const out = composeMarginChartOverlays(mkInput({ position: mkEconPos() }))
    expect(out.priceLines.find((l) => l.role === 'breakEven')).toMatchObject({
      price: 1743,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: 'margin.chart.line.breakEven',
    })
  })

  it('draws no entry or liq line at a non-positive price', () => {
    const noLiq = composeMarginChartOverlays(mkInput({ position: mkPos({ liquidationPrice: '0' }) }))
    expect(noLiq.priceLines.some((l) => l.role === 'liq')).toBe(false)
    expect(noLiq.priceLines.some((l) => l.role === 'entry')).toBe(true)
    expect(noLiq.zone).toBeUndefined()
  })

  it('merges entry and breakEven labels within 14px, dropping the BE line', () => {
    const entry = mkLine({ id: 'entry', role: 'entry', priority: 1, price: 1800 })
    const be = mkLine({ id: 'breakEven', role: 'breakEven', priority: 4, price: 1810 })

    const merged = applyLabelCollision({ lines: [entry, be], range: { min: 1000, max: 3000 }, heightPx: 480 })
    expect(merged.some((l) => l.role === 'breakEven')).toBe(false)
    expect(merged.find((l) => l.role === 'entry')?.mergedLabel).toBe('entry+be')
  })
})

describe('composeMarginChartOverlays', () => {
  it('draws the market mark line, dashed and tagged, neutral without a candle', () => {
    const out = composeMarginChartOverlays(mkInput())
    expect(out.priceLines).toHaveLength(1)
    expect(out.priceLines[0]).toMatchObject({
      id: 'mark',
      role: 'mark',
      priority: 5,
      price: 2000,
      color: COLORS.neutral2,
      lineStyle: LineStyle.Dashed,
      axisLabelColor: COLORS.neutral2,
      axisLabelTextColor: readableTextColor({ background: COLORS.neutral2, colors: COLORS }),
      axisLabelVisible: true,
    })
  })

  it.each([
    { name: 'green on an up candle', open: 1990, close: 2005, color: COLORS.statusSuccess },
    { name: 'green on a flat candle', open: 2005, close: 2005, color: COLORS.statusSuccess },
    { name: 'red on a down candle', open: 2010, close: 1995, color: COLORS.statusCritical },
  ])('colors the mark line $name', ({ open, close, color }) => {
    const mark = composeMarginChartOverlays(mkInput({ markFallback: close, latestCandleOpen: open })).priceLines.find(
      (l) => l.role === 'mark',
    )
    expect(mark).toMatchObject({ color, axisLabelColor: color })
  })

  it('draws the mark line at the latest close when the live mark is absent', () => {
    const mark = composeMarginChartOverlays(
      mkInput({ live: undefined, markFallback: 1980, latestCandleOpen: 1990 }),
    ).priceLines.find((l) => l.role === 'mark')
    expect(mark).toMatchObject({ price: 1980, color: COLORS.statusCritical })
  })

  it('emits preview lines only with an OPEN quote', () => {
    const isPreview = (l: MarginOverlayLine): boolean => l.role === 'previewEntry' || l.role === 'previewLiq'

    expect(composeMarginChartOverlays(mkInput()).priceLines.some(isPreview)).toBe(false)

    const withQuote = composeMarginChartOverlays(mkInput({ quote: mkQuote() }))
    expect(withQuote.priceLines.find((l) => l.role === 'previewLiq')).toMatchObject({ price: 1600, priority: 2 })
    expect(withQuote.priceLines.find((l) => l.role === 'previewEntry')).toMatchObject({ price: 2010, priority: 3 })

    // A quote with no liq price (risk block not yet loaded) keeps its entry and estimates the liq from it
    // at the form's leverage: 2010·(2/3)/0.86.
    const noLiq = composeMarginChartOverlays(
      mkInput({ quote: mkQuote({ display: { liquidationPrice: undefined } }), formLeverage: 3 }),
    )
    expect(noLiq.priceLines.find((l) => l.role === 'previewEntry')?.price).toBe(2010)
    expect(noLiq.priceLines.find((l) => l.role === 'previewLiq')?.price).toBeCloseTo((2010 * (2 / 3)) / 0.86, 6)
  })

  // A venue switch at the same leverage bridges the previous market's quote while the new one loads. Its
  // liq price reflects the old market's LLTV, so the line is estimated at the market's own LLTV until the
  // replacement quote lands: 2010·(2/3)/0.86 at 3×.
  it("estimates a bridged quote's liq line at the market's LLTV when leverage is unchanged", () => {
    const previewLiq = (out: ReturnType<typeof composeMarginChartOverlays>): MarginOverlayLine | undefined =>
      out.priceLines.find((l) => l.role === 'previewLiq')

    const bridged = composeMarginChartOverlays(mkInput({ quote: mkQuote(), isQuoteBridged: true, formLeverage: 3 }))
    expect(previewLiq(bridged)?.price).toBeCloseTo((2010 * (2 / 3)) / 0.86, 6)
    expect(bridged.priceLines.find((l) => l.role === 'previewEntry')?.price).toBe(2010)

    const settled = composeMarginChartOverlays(mkInput({ quote: mkQuote(), isQuoteBridged: false }))
    expect(previewLiq(settled)?.price).toBe(1600)

    // A leverage move still scales the bridged quote's line, so a drag keeps its estimate.
    const dragged = composeMarginChartOverlays(mkInput({ quote: mkQuote(), isQuoteBridged: true, previewLeverage: 3 }))
    expect(previewLiq(dragged)).toBeDefined()

    // The plan-in-flight quote is pinned, not bridged.
    const inFlight = composeMarginChartOverlays(mkInput({ quote: mkQuote(), isQuoteBridged: true, planInFlight: true }))
    expect(previewLiq(inFlight)?.price).toBe(1600)
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

  it('styles the preview lines', () => {
    const out = composeMarginChartOverlays(mkInput({ quote: mkQuote() }))

    // preview-entry: dotted neutral1 stroke, labeled neutral1 axis tag with surface1 text.
    expect(out.priceLines.find((l) => l.role === 'previewEntry')).toMatchObject({
      color: COLORS.neutral1,
      lineStyle: LineStyle.Dotted,
      lineWidth: 1,
      axisLabelColor: COLORS.neutral1,
      axisLabelTextColor: COLORS.surface1,
      axisLabelVisible: true,
      title: 'margin.chart.line.previewEntry',
    })

    // preview-liq: solid, labeled tag in the line's color; with no leverage known it falls back to
    // statusCritical, and the tag text takes whichever of black/white contrasts more with it.
    expect(out.priceLines.find((l) => l.role === 'previewLiq')).toMatchObject({
      color: COLORS.statusCritical,
      lineStyle: LineStyle.Solid,
      lineWidth: 1,
      axisLabelColor: COLORS.statusCritical,
      axisLabelTextColor: readableTextColor({ background: COLORS.statusCritical, colors: COLORS }),
      axisLabelVisible: true,
      title: 'margin.chart.line.previewLiq',
    })
  })

  it('measures the preview liq distance against the quote mark, else the live mark, else the entry', () => {
    const quoteMarked = composeMarginChartOverlays(
      mkInput({ live: undefined, quote: mkQuote({ display: { oraclePrice: X18(1800) } }) }),
    )
    expect(quoteMarked.priceLines.find((l) => l.role === 'previewLiq')?.distanceSignedPct).toBeCloseTo(
      ((1600 - 1800) / 1800) * 100,
      8,
    )

    const withMark = composeMarginChartOverlays(mkInput({ quote: mkQuote() }))
    expect(withMark.priceLines.find((l) => l.role === 'previewLiq')?.distanceSignedPct).toBeCloseTo(-20, 8)

    const proxied = composeMarginChartOverlays(mkInput({ live: undefined, quote: mkQuote() }))
    expect(proxied.priceLines.find((l) => l.role === 'previewLiq')?.distanceSignedPct).toBeCloseTo(
      ((1600 - 2010) / 2010) * 100,
      8,
    )
  })

  it('suppresses the lower-priority axis tag within 14px; higher priority wins', () => {
    // Range 1000..3000 over 480px → 0.24px per price unit; 14px ↔ ~58 price units.
    const range = { min: 1000, max: 3000 }
    const near = mkQuote({ display: { liquidationPrice: X18(1500), effectivePrice: X18(1520) } })

    const out = composeMarginChartOverlays(mkInput({ quote: near, visiblePriceRange: range }))
    expect(out.priceLines.find((l) => l.role === 'previewLiq')?.axisLabelVisible).not.toBe(false)
    expect(out.priceLines.find((l) => l.role === 'previewEntry')?.axisLabelVisible).toBe(false)

    // Without a visible range, suppression is skipped entirely.
    const noRange = composeMarginChartOverlays(mkInput({ quote: near }))
    expect(noRange.priceLines.find((l) => l.role === 'previewEntry')?.axisLabelVisible).not.toBe(false)
  })

  it('pads autoscale bounds ±2% around all line prices', () => {
    const out = composeMarginChartOverlays(mkInput({ quote: mkQuote() }))
    expect(out.autoscaleBounds?.min).toBeCloseTo(1600 * 0.98, 8)
    expect(out.autoscaleBounds?.max).toBeCloseTo(2010 * 1.02, 8)

    const empty = composeMarginChartOverlays(mkInput({ live: undefined }))
    expect(empty.priceLines).toHaveLength(0)
    expect(empty.autoscaleBounds).toBeUndefined()
  })
})

describe('estimateLiqPrice', () => {
  const lltvWad = X18(0.8)

  // Long: entry·((L−1)/L)/λ = 2000·(2/3)/0.8.
  it('puts a long liq below entry', () => {
    expect(estimateLiqPrice({ entry: 2000, leverage: 3, lltvWad, direction: MarginDirection.LONG })).toBeCloseTo(
      1666.6667,
      3,
    )
  })

  // Short: entry·λ·(L+1)/L = 2000·0.8·4/3.
  it('puts a short liq above entry', () => {
    expect(estimateLiqPrice({ entry: 2000, leverage: 3, lltvWad, direction: MarginDirection.SHORT })).toBeCloseTo(
      2133.3333,
      3,
    )
  })

  it.each([
    { entry: 2000, leverage: 1, lltvWad },
    { entry: 0, leverage: 3, lltvWad },
    { entry: 2000, leverage: 3, lltvWad: '0' },
    { entry: 2000, leverage: Number.NaN, lltvWad },
  ])('has no estimate without debt or usable inputs (%o)', (input) => {
    expect(estimateLiqPrice({ ...input, direction: MarginDirection.LONG })).toBeUndefined()
  })
})

describe('readableTextColor', () => {
  it('picks black on a light background and white on a dark one', () => {
    expect(readableTextColor({ background: 'rgb(34, 197, 94)', colors: COLORS })).toBe(COLORS.black)
    expect(readableTextColor({ background: '#0d0d0d', colors: COLORS })).toBe(COLORS.white)
    expect(readableTextColor({ background: 'not-a-color', colors: COLORS })).toBe(COLORS.white)
  })
})

describe('composeMarginChartOverlays preview without a quote', () => {
  // live mark 2000 (mkLive), LLTV 0.86 (mkMarket): long liq at 3x = 2000·(2/3)/0.86.
  const estimatedAt3 = (2000 * (2 / 3)) / 0.86
  const preview = (over: Partial<ComposeInput>): MarginOverlayLine[] =>
    composeMarginChartOverlays(mkInput({ quote: undefined, ...over })).priceLines.filter(
      (l) => l.role === 'previewEntry' || l.role === 'previewLiq',
    )

  it('estimates entry at the mark and liq at the form leverage once an amount is entered', () => {
    const lines = preview({ hasEnteredAmount: true, formLeverage: 3 })
    expect(lines.find((l) => l.role === 'previewEntry')?.price).toBe(2000)
    expect(lines.find((l) => l.role === 'previewLiq')).toMatchObject({
      price: expect.closeTo(estimatedAt3, 6),
      title: 'margin.chart.line.previewLiq',
      axisLabelVisible: true,
    })
  })

  it('follows the unquoted leverage mid-drag', () => {
    const lines = preview({ hasEnteredAmount: true, formLeverage: 5, previewLeverage: 5 })
    expect(lines.find((l) => l.role === 'previewLiq')?.price).toBeCloseTo((2000 * (4 / 5)) / 0.86, 6)
  })

  it('takes the quoted value once a quote exists', () => {
    const quote = mkQuote({ display: { liquidationPrice: X18(1600), effectivePrice: X18(2010), leverage: '3' } })
    const lines = preview({ hasEnteredAmount: true, formLeverage: 3, quote })
    expect(lines.find((l) => l.role === 'previewLiq')?.price).toBe(1600)
    expect(lines.find((l) => l.role === 'previewEntry')?.price).toBe(2010)
  })

  it('draws nothing before an amount is entered', () => {
    expect(preview({ formLeverage: 3 })).toEqual([])
  })

  it('draws nothing without a mark to estimate from', () => {
    expect(preview({ hasEnteredAmount: true, formLeverage: 3, live: undefined })).toEqual([])
  })

  // A venue that can't quote reports a 0 live mark (present but unpriced); the candle close keeps
  // Entry/Liq on the chart. A nullish-only fallback would keep the 0 and blank the lines.
  it('falls back to the candle close when the live mark is zero', () => {
    const lines = preview({
      hasEnteredAmount: true,
      formLeverage: 3,
      live: mkLive({ markPriceX18: X18(0) }),
      markFallback: 2000,
    })
    expect(lines.find((l) => l.role === 'previewEntry')?.price).toBe(2000)
    expect(lines.find((l) => l.role === 'previewLiq')?.price).toBeCloseTo(estimatedAt3, 6)
  })

  // No live mark and no candle fallback: nothing to anchor the estimate, so draw nothing.
  it('draws nothing when neither the live mark nor a candle fallback is usable', () => {
    expect(preview({ hasEnteredAmount: true, formLeverage: 3, live: mkLive({ markPriceX18: X18(0) }) })).toEqual([])
  })

  it('keeps the entry but draws no liq line when the leverage carries no debt', () => {
    const lines = preview({ hasEnteredAmount: true, formLeverage: 1 })
    expect(lines.map((l) => l.role)).toEqual(['previewEntry'])
  })

  it('counts the settled estimate in the autoscale bounds', () => {
    const out = composeMarginChartOverlays(mkInput({ quote: undefined, hasEnteredAmount: true, formLeverage: 3 }))
    expect(out.autoscaleBounds?.min).toBeCloseTo(estimatedAt3 * 0.98, 6)
  })
})

describe('scaleLiqPriceToLeverage', () => {
  it('is the identity at the quoted leverage', () => {
    expect(
      scaleLiqPriceToLeverage({ liq: 1600, quotedLeverage: 3, targetLeverage: 3, direction: MarginDirection.LONG }),
    ).toBeCloseTo(1600, 8)
  })

  // ratio = ((L'−1)/L' · L) / (L−1); 3x → 4x is (0.75 · 3) / 2 = 1.125.
  it('moves a long liq toward the mark as leverage rises', () => {
    expect(
      scaleLiqPriceToLeverage({ liq: 1600, quotedLeverage: 3, targetLeverage: 4, direction: MarginDirection.LONG }),
    ).toBeCloseTo(1800, 8)
  })

  // Short factor (L+1)/L: 3x → 4x is (5/4) / (4/3) = 15/16.
  it('moves a short liq down toward the mark as leverage rises', () => {
    expect(
      scaleLiqPriceToLeverage({ liq: 2700, quotedLeverage: 3, targetLeverage: 4, direction: MarginDirection.SHORT }),
    ).toBeCloseTo(2531.25, 8)
  })

  // Same model as the no-quote estimate, so a line scaled from a quote and one estimated from the mark
  // agree at the same leverage.
  it.each([MarginDirection.LONG, MarginDirection.SHORT] as const)('agrees with estimateLiqPrice (%s)', (direction) => {
    const lltvWad = X18(0.86)
    const at3 = estimateLiqPrice({ entry: 2000, leverage: 3, lltvWad, direction })
    const at5 = estimateLiqPrice({ entry: 2000, leverage: 5, lltvWad, direction })
    expect(at3).toBeDefined()
    expect(scaleLiqPriceToLeverage({ liq: at3 ?? 0, quotedLeverage: 3, targetLeverage: 5, direction })).toBeCloseTo(
      at5 ?? 0,
      8,
    )
  })

  it.each([
    { quotedLeverage: 1, targetLeverage: 3 },
    { quotedLeverage: 3, targetLeverage: 1 },
    { quotedLeverage: Number.NaN, targetLeverage: 3 },
  ])('has no estimate at or below 1x (%o)', ({ quotedLeverage, targetLeverage }) => {
    expect(
      scaleLiqPriceToLeverage({ liq: 1600, quotedLeverage, targetLeverage, direction: MarginDirection.LONG }),
    ).toBeUndefined()
  })
})

describe('leverageTierColor', () => {
  const lltvWad = X18(0.86)
  // Long HF = LLTV·L/(L−1): 2x → 1.72, 4x → 1.15, 6x → 1.03.
  it.each([
    { leverage: 2, color: COLORS.statusSuccess },
    { leverage: 4, color: COLORS.statusWarning },
    { leverage: 6, color: COLORS.statusCritical },
  ])('maps $leverage x to the readout tier', ({ leverage, color }) => {
    expect(leverageTierColor({ leverage, lltvWad, direction: MarginDirection.LONG, colors: COLORS })).toBe(color)
  })

  it('reads neutral, not healthy, on an unknown LLTV', () => {
    expect(leverageTierColor({ leverage: 2, lltvWad: '0', direction: MarginDirection.LONG, colors: COLORS })).toBe(
      COLORS.neutral2,
    )
  })
})

describe('composeMarginChartOverlays preview liq while dragging', () => {
  const quote = mkQuote({ display: { liquidationPrice: X18(1600), leverage: '3' } })
  const previewLiq = (over: Partial<ComposeInput>): MarginOverlayLine | undefined =>
    composeMarginChartOverlays(mkInput({ quote, ...over })).priceLines.find((l) => l.role === 'previewLiq')

  it('sits at the quoted price, in the committed leverage tier, at rest', () => {
    expect(previewLiq({ formLeverage: 3 })).toMatchObject({ price: 1600, color: COLORS.statusSuccess })
  })

  it('follows the unquoted leverage and takes its tier color mid-drag', () => {
    expect(previewLiq({ formLeverage: 4, previewLeverage: 4 })).toMatchObject({
      price: expect.closeTo(1800, 6),
      color: COLORS.statusWarning,
    })
  })

  it('holds the frozen quote price while a plan is in flight', () => {
    expect(previewLiq({ formLeverage: 4, previewLeverage: 4, planInFlight: true })?.price).toBe(1600)
  })

  it('keeps the quoted price when the quote carries no leverage', () => {
    const bare = mkQuote({ display: { liquidationPrice: X18(1600) } })
    expect(previewLiq({ quote: bare, formLeverage: 4, previewLeverage: 4 })?.price).toBe(1600)
  })
})

describe('preview lines and autoscale', () => {
  const quote = mkQuote({ display: { liquidationPrice: X18(100), effectivePrice: X18(5000), leverage: '3' } })

  // The preview liq/entry count toward the bounds, including mid-drag: a leverage change can push the
  // preview liq well past the candles' range, so the chart rescales to keep the line in view as the
  // thumb moves — the point of the live preview.
  it('includes the preview lines in the bounds', () => {
    const out = composeMarginChartOverlays(mkInput({ quote }))
    expect(out.priceLines.some((l) => l.role === 'previewLiq')).toBe(true)
    expect(out.autoscaleBounds?.min).toBeCloseTo(100 * 0.98, 8)
    expect(out.autoscaleBounds?.max).toBeCloseTo(5000 * 1.02, 8)
  })
})

describe('unquotedLeverage', () => {
  const quote = mkQuote({ display: { liquidationPrice: X18(1600), leverage: '2' } })

  // Mid-drag the slider has already written leverage, but the quote is still debouncing on the old one.
  it('is the form leverage while the quote is stale and prices another', () => {
    expect(unquotedLeverage({ leverage: 3.5, quote, isQuoteStale: true })).toBe(3.5)
  })

  it('defers to the quote once it prices the form leverage, or is current', () => {
    expect(unquotedLeverage({ leverage: 2.02, quote, isQuoteStale: true })).toBeUndefined()
    expect(unquotedLeverage({ leverage: 4, quote, isQuoteStale: false })).toBeUndefined()
  })

  it('has nothing to scale from without a quoted leverage', () => {
    expect(unquotedLeverage({ leverage: 4, quote: undefined, isQuoteStale: true })).toBeUndefined()
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
  // Identity converter: y = price. The pure function only compares pixel distances.
  const priceToY = (price: number): number | null => price

  const previewLiq = mkLine({ id: 'previewLiq', role: 'previewLiq', priority: 2, price: 100 })
  const mark = mkLine({ id: 'mark', role: 'mark', priority: 5, price: 120 })

  it('returns the nearest line within the 8px band', () => {
    const hit = nearestOverlay({ hover: { x: 0, y: 106 }, lines: [previewLiq, mark], priceToY })
    expect(hit).toEqual({ role: 'previewLiq', price: 100 })
  })

  it('returns undefined when nothing is within range', () => {
    expect(nearestOverlay({ hover: { x: 0, y: 109 }, lines: [previewLiq], priceToY })).toBeUndefined()
  })

  it('breaks exact-distance ties by priority order', () => {
    const previewEntry = mkLine({ id: 'previewEntry', role: 'previewEntry', priority: 3, price: 108 })
    const markLow = mkLine({ id: 'mark', role: 'mark', priority: 5, price: 100 })
    // y=104 is exactly 4px from both — previewEntry (priority 3) beats mark (priority 5).
    const hit = nearestOverlay({ hover: { x: 0, y: 104 }, lines: [markLow, previewEntry], priceToY })
    expect(hit).toEqual({ role: 'previewEntry', price: 108 })
  })

  it('skips lines whose coordinates resolve to null', () => {
    const nullY = (): number | null => null
    expect(nearestOverlay({ hover: { x: 0, y: 100 }, lines: [previewLiq], priceToY: nullY })).toBeUndefined()
  })
})

describe('showsMarginOpenPreview', () => {
  const market = mkMarket()

  it('draws the preview when the form charts this market and nothing is focused', () => {
    expect(showsMarginOpenPreview({ previewMarket: market, market, focusedPosition: undefined })).toBe(true)
  })

  it('skips it while a position is focused', () => {
    expect(showsMarginOpenPreview({ previewMarket: market, market, focusedPosition: mkPos() })).toBe(false)
  })

  it('skips it for another venue on the same pair', () => {
    expect(
      showsMarginOpenPreview({
        previewMarket: mkMarket({ key: 'weth-usdc-aave', venue: 'AAVE_V3' }),
        market,
        focusedPosition: undefined,
      }),
    ).toBe(false)
  })
})
