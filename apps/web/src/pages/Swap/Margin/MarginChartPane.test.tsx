import { act, fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { DataQuality, PriceChartType } from '~/components/Charts/utils'
import type { MarginMarket } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { DEFAULT_MARGIN_CHART_PREFS, useMarginChartPrefs } from '~/pages/Swap/Margin/chart/marginChartPrefsStore'
import { useMarginChartData, type MarginChartData } from '~/pages/Swap/Margin/chart/useMarginChartData'
import { useMarginChartOverlays, type MarginChartOverlays } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'
import { useMarginVolume } from '~/pages/Swap/Margin/chart/useMarginVolume'
import { MAX_VERTICAL_ZOOM_STEP } from '~/pages/Swap/Margin/chart/verticalZoom'
import { setMarginChartHoveredCandle } from '~/pages/Swap/Margin/hooks/useMarginChartHoveredCandle'
import { MARGIN_VOLUME_PANE_HEIGHT } from '~/pages/Swap/Margin/marginChartLayout'
import { MarginChartPane } from '~/pages/Swap/Margin/MarginChartPane'
import { render } from '~/test-utils/render'

// The pane's own data hook — the state machine under test is driven entirely by its return.
// Keep the module's pure helpers (volatileLeg) real.
vi.mock('~/pages/Swap/Margin/chart/useMarginChartData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/chart/useMarginChartData')>()),
  useMarginChartData: vi.fn(),
}))

// Project MouseoverTooltip's text into a data attribute so the "unavailable" wiring is assertable
// without the hover/portal machinery. MarginChartStyleToggle is the pane's only consumer.
vi.mock('~/components/Tooltip', () => ({
  MouseoverTooltip: ({ text, children }: { text: ReactNode; children: ReactNode }) => (
    <div data-testid="mouseover-tooltip" data-tooltip-text={String(text)}>
      {children}
    </div>
  ),
}))

// Give the pane a valid market without hitting the markets query. getPairMarket returns the static
// default so priceLines/stats can read collateral/debt; getLive undefined keeps stats minimal.
// mockMarketsUnresolved/mockMarketsError let one describe block force the lookup to miss entirely,
// exercising the pane's own gate and MarginStatsStrip's independent guard together.
// mockPairMarkets/mockLiveByKey let the venue-keying block hand the pair more than one venue, each
// with its own live numbers — that is the only way to tell which market the strip resolved.
const { mockMarketsUnresolved, mockMarketsError, mockMarketsRefetch, mockPairMarkets, mockLiveByKey } = vi.hoisted(
  () => ({
    mockMarketsUnresolved: { current: false },
    mockMarketsError: { current: undefined as unknown },
    mockMarketsRefetch: vi.fn(),
    mockPairMarkets: { current: undefined as unknown[] | undefined },
    mockLiveByKey: { current: new Map<string, unknown>() },
  }),
)
vi.mock('~/features/margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => {
    // The stats strip maxes the headline leverage over the pair's allowed venues.
    const pairMarkets = mockMarketsUnresolved.current ? [] : (mockPairMarkets.current ?? [getDefaultMarginMarket()])
    return {
      groups: [],
      markets: [],
      getPairMarket: () => (mockMarketsUnresolved.current ? undefined : getDefaultMarginMarket()),
      getPairMarkets: () => pairMarkets,
      getLive: (key: string) => mockLiveByKey.current.get(key),
      isLoading: false,
      isFetching: false,
      error: mockMarketsError.current,
      refetch: mockMarketsRefetch,
    }
  },
}))

// Currency-info resolution drags in the data-API/token dependency web; the header needs it only for
// logo art. Empty map → SplitLogo falls back to symbol art, so the state-machine tests stay hermetic.
vi.mock('~/features/margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map(),
}))

// pairKey + venue-exclusion selectors without the form-store provider; mutable so tests can switch pairs.
const pairKeyRef = vi.hoisted(() => ({ current: 'test-pair' }))
vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { pairKey: string; excludedVenues: [] }) => unknown) =>
    selector({ pairKey: pairKeyRef.current, excludedVenues: [] }),
}))

// The pane consumes composed overlays through this hook, whose real implementation drags in the
// account/positions/quote/plan dependency web. Spread the real module so pure exports (composer,
// positionsForMarket, types) pass through and only the wiring hook is stubbed.
vi.mock('~/pages/Swap/Margin/chart/useMarginChartOverlays', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/chart/useMarginChartOverlays')>()),
  useMarginChartOverlays: vi.fn(() => ({ priceLines: [], markers: [] })),
}))

// Volume overlay data hook (spec F15): decoupled here so the state-machine test never touches the
// historical-volumes query. Default OFF → the pane threads empty bars into the chart params.
vi.mock('~/pages/Swap/Margin/chart/useMarginVolume', () => ({
  useMarginVolume: vi.fn(() => ({ volumeBars: [] })),
}))

// jsdom has no layout, so give the pane a non-zero width — otherwise showChart can never become
// true and the ok/stale branch would never mount the chart.
vi.mock('@visx/responsive', () => ({
  useParentSize: () => ({ parentRef: { current: null }, width: 800, height: 480 }),
}))

// The real Chart mounts lightweight-charts on a canvas (and hosts the StaleBanner). Swap it for a
// prop-recording stub so the state machine renders headlessly and `stale` wiring is assertable.
vi.mock('~/components/Charts/ChartModel', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/components/Charts/ChartModel')>()
  return {
    ...actual,
    Chart: ({
      params,
      height,
    }: {
      params: { stale?: boolean; type?: string; verticalZoomStep?: number; volumeBars?: unknown[] }
      height?: number
    }) => (
      <div
        data-testid="margin-chart-mock"
        data-stale={String(Boolean(params.stale))}
        data-type={String(params.type)}
        data-vzoom={String(params.verticalZoomStep)}
        data-volume-bars={String(params.volumeBars?.length ?? 0)}
        data-height={String(height)}
      />
    ),
  }
})

const refetch = vi.fn()

function candle(): PriceChartData {
  return { time: 1_700_000_000 as PriceChartData['time'], value: 100, open: 100, high: 100, low: 100, close: 100 }
}

function chartData(overrides: Partial<MarginChartData>): MarginChartData {
  return {
    candles: [],
    quality: DataQuality.VALID,
    candlesUnavailable: false,
    stats24h: {},
    loading: false,
    error: undefined,
    refetch,
    ...overrides,
  }
}

function mockChart(data: MarginChartData): void {
  vi.mocked(useMarginChartData).mockReturnValue(data)
}

function mockOverlays(overlays: MarginChartOverlays): void {
  vi.mocked(useMarginChartOverlays).mockReturnValue(overlays)
}

describe('MarginChartPane state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no overlay output (each legend test opts in explicitly).
    mockOverlays({ priceLines: [], markers: [] })
  })

  it('renders the chart settings gear in the timeframe row', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane />)

    expect(screen.getByTestId(TestID.MarginChartSettingsGear)).toBeInTheDocument()
  })

  it('renders the split logo leading the pair identity', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane />)

    expect(screen.getByTestId('input-currency-logo-container')).toBeInTheDocument()
    expect(screen.getByTestId('output-currency-logo-container')).toBeInTheDocument()
  })

  it('shows the skeleton while candles are loading (no empty/error flash)', () => {
    mockChart(chartData({ candles: [], loading: true }))
    render(<MarginChartPane />)

    expect(screen.getByTestId(TestID.MarginChartSkeleton)).toBeInTheDocument()
    expect(screen.queryByTestId('margin-chart-mock')).not.toBeInTheDocument()
    expect(screen.queryByText('No price history yet')).not.toBeInTheDocument()
  })

  it('shows the error view with a retry that calls refetch when there are no candles', () => {
    mockChart(chartData({ candles: [], loading: false, error: new Error('boom') }))
    const { container } = render(<MarginChartPane />)

    expect(container.querySelector('[data-testid="chart-error-view"]')).toBeTruthy()
    const retry = screen.getByText('Retry')
    expect(retry).toBeInTheDocument()

    fireEvent.click(retry)
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows the empty copy once settled with no candles', () => {
    mockChart(chartData({ candles: [], loading: false }))
    render(<MarginChartPane />)

    expect(screen.getByText('No price history yet')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.MarginChartSkeleton)).not.toBeInTheDocument()
    expect(screen.queryByTestId('margin-chart-mock')).not.toBeInTheDocument()
  })

  it('mounts the chart with stale=true when data quality is STALE', () => {
    mockChart(chartData({ candles: [candle()], loading: false, quality: DataQuality.STALE }))
    render(<MarginChartPane />)

    const chart = screen.getByTestId('margin-chart-mock')
    expect(chart).toHaveAttribute('data-stale', 'true')
  })

  it('shows the empty copy for INVALID quality even when candles are present', () => {
    mockChart(chartData({ candles: [candle()], loading: false, quality: DataQuality.INVALID }))
    render(<MarginChartPane />)

    expect(screen.getByText('No price history yet')).toBeInTheDocument()
    expect(screen.queryByTestId('margin-chart-mock')).not.toBeInTheDocument()
  })

  it('renders the legend chip with PnL, live interest and venue when a legend is present', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    mockOverlays({
      priceLines: [],
      markers: [],
      positionsDataUpdatedAt: Date.now(),
      legend: {
        pair: 'ETH / USDC',
        leverage: '2x',
        venue: 'MORPHO',
        pnlUsd: 514,
        pnlPct: 30.24,
        accruedUsd: 50,
        ticker: {
          normalizedAccrued: 50,
          normalizedDebt: 1786,
          apyBps: 400,
          direction: MarginDirection.LONG,
          mark: 2000,
        },
      },
    })
    render(<MarginChartPane />)

    expect(screen.getByTestId(TestID.MarginChartLegendChip)).toBeInTheDocument()
    expect(screen.getByText('ETH / USDC 2x')).toBeInTheDocument()
    expect(screen.getByText(/PnL/)).toHaveTextContent('514')
    expect(screen.getByText(/Interest/)).toHaveTextContent('50')
    expect(screen.getByText('Morpho')).toBeInTheDocument()
  })

  it('omits the amount segments when a legend carries no PnL or interest', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    mockOverlays({
      priceLines: [],
      markers: [],
      legend: { pair: 'ETH / USDC', leverage: '2x', venue: 'MORPHO' },
    })
    render(<MarginChartPane />)

    expect(screen.getByTestId(TestID.MarginChartLegendChip)).toBeInTheDocument()
    expect(screen.queryByText(/PnL/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Interest/)).not.toBeInTheDocument()
  })

  // The chip's figures are computed at the POSITION's mark, so its cue tracks the positions poll —
  // a stale markets poll dims the mark line instead.
  it('renders the stale dot on the legend chip when its figures are stale', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    mockOverlays({
      priceLines: [],
      markers: [],
      figuresStale: true,
      legend: { pair: 'ETH / USDC', leverage: '2x', venue: 'MORPHO' },
    })
    render(<MarginChartPane />)

    expect(screen.getByTestId(TestID.MarginChartLegendStaleDot)).toBeInTheDocument()
  })

  it('omits the stale dot when the mark is fresh', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    mockOverlays({
      priceLines: [],
      markers: [],
      legend: { pair: 'ETH / USDC', leverage: '2x', venue: 'MORPHO' },
    })
    render(<MarginChartPane />)

    expect(screen.getByTestId(TestID.MarginChartLegendChip)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.MarginChartLegendStaleDot)).not.toBeInTheDocument()
  })

  it('reflects a fresh legend.accruedUsd at render when not ticking (no stale trap)', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    mockOverlays({
      priceLines: [],
      markers: [],
      legend: {
        pair: 'ETH / USDC',
        leverage: '2x',
        venue: 'MORPHO',
        accruedUsd: 50,
        ticker: {
          normalizedAccrued: 50,
          normalizedDebt: 1786,
          apyBps: 400,
          direction: MarginDirection.LONG,
          mark: 2000,
        },
      },
    })
    const { rerender } = render(<MarginChartPane />)
    expect(screen.getByText(/Interest/)).toHaveTextContent('50')

    mockOverlays({
      priceLines: [],
      markers: [],
      legend: {
        pair: 'ETH / USDC',
        leverage: '2x',
        venue: 'MORPHO',
        accruedUsd: 80,
        ticker: {
          normalizedAccrued: 80,
          normalizedDebt: 1786,
          apyBps: 400,
          direction: MarginDirection.LONG,
          mark: 2000,
        },
      },
    })
    rerender(<MarginChartPane />)
    expect(screen.getByText(/Interest/)).toHaveTextContent('80')
  })
})

describe('MarginChartPane time windows, OHLC legend and volume pane', () => {
  const up = { ...candle(), open: 100, high: 112, low: 98, close: 110 }
  const down = { ...candle(), time: 1_700_003_600 as PriceChartData['time'], open: 110, high: 111, low: 95, close: 96 }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOverlays({ priceLines: [], markers: [] })
    useMarginChartPrefs.setState(DEFAULT_MARGIN_CHART_PREFS)
  })

  afterEach(() => {
    act(() => setMarginChartHoveredCandle(undefined))
    vi.mocked(useMarginVolume).mockImplementation(() => ({ volumeBars: [] }))
  })

  it('offers 4H/1D/1W/1M/1Y, opens on 1D, and refetches for the picked window', () => {
    mockChart(chartData({ candles: [up], loading: false }))
    render(<MarginChartPane />)

    for (const label of ['4H', '1D', '1W', '1M', '1Y']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(vi.mocked(useMarginChartData)).toHaveBeenLastCalledWith(expect.objectContaining({ timeWindow: '1D' }))
    expect(vi.mocked(useMarginVolume)).toHaveBeenLastCalledWith(expect.objectContaining({ timeWindow: '1D' }))

    fireEvent.click(screen.getByText('1M'))

    expect(vi.mocked(useMarginChartData)).toHaveBeenLastCalledWith(expect.objectContaining({ timeWindow: '1M' }))
    expect(vi.mocked(useMarginVolume)).toHaveBeenLastCalledWith(expect.objectContaining({ timeWindow: '1M' }))
  })

  it('reads the latest candle in the OHLC legend, then follows the crosshair', () => {
    mockChart(chartData({ candles: [up, down], loading: false }))
    render(<MarginChartPane />)

    const legend = screen.getByTestId(TestID.MarginChartOhlcLegend)
    expect(legend).toHaveTextContent('O$110.00H$111.00L$95.00C$96.00')

    act(() => setMarginChartHoveredCandle(up))
    expect(legend).toHaveTextContent('O$100.00H$112.00L$98.00C$110.00')

    act(() => setMarginChartHoveredCandle(undefined))
    expect(legend).toHaveTextContent('C$96.00')
  })

  it('keeps the volume pane off by default', () => {
    mockChart(chartData({ candles: [up], loading: false }))
    render(<MarginChartPane />)

    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-volume-bars', '0')
    // The chart fills the box the layout gives it; overlays space their labels over all of it.
    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-height', '100%')
    expect(vi.mocked(useMarginChartOverlays).mock.lastCall?.[0].paneHeightPx).toBe(480)
  })

  it('carves the volume pane out of the same box when the overlay is on', () => {
    useMarginChartPrefs.setState({ volume: true })
    vi.mocked(useMarginVolume).mockImplementation(() => ({
      volumeBars: [{ time: up.time, value: 1_000 }],
    }))
    mockChart(chartData({ candles: [up], loading: false }))
    render(<MarginChartPane />)

    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-volume-bars', '1')
    // Same box, not a taller one: the price pane gives up the volume pane's height.
    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-height', '100%')
    expect(vi.mocked(useMarginChartOverlays).mock.lastCall?.[0].paneHeightPx).toBe(480 - MARGIN_VOLUME_PANE_HEIGHT)
  })
})

describe('MarginChartPane chart-style toggle (spec F14)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOverlays({ priceLines: [], markers: [] })
    // The pane consumes the real persisted prefs store — reset to defaults (chartStyle: 'candles').
    useMarginChartPrefs.setState(DEFAULT_MARGIN_CHART_PREFS)
  })

  it('renders both line and candle style options', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane />)

    expect(screen.getByTestId(TestID.MarginChartStyleLine)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.MarginChartStyleCandles)).toBeInTheDocument()
  })

  it('defaults to candlesticks and flips to line on click, persisting the pref', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane />)

    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-type', PriceChartType.CANDLESTICK)

    fireEvent.click(screen.getByTestId(TestID.MarginChartStyleLine))

    expect(useMarginChartPrefs.getState().chartStyle).toBe('line')
    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-type', PriceChartType.LINE)
  })

  it('flips to candlesticks on click when candles are available', () => {
    useMarginChartPrefs.setState({ chartStyle: 'line' })
    mockChart(chartData({ candles: [candle()], loading: false, candlesUnavailable: false }))
    render(<MarginChartPane />)

    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-type', PriceChartType.LINE)

    fireEvent.click(screen.getByTestId(TestID.MarginChartStyleCandles))

    expect(useMarginChartPrefs.getState().chartStyle).toBe('candles')
    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-type', PriceChartType.CANDLESTICK)
  })

  it('forces line rendering when candlesUnavailable even if the pref is candles', () => {
    useMarginChartPrefs.setState({ chartStyle: 'candles' })
    mockChart(chartData({ candles: [candle()], loading: false, candlesUnavailable: true }))
    render(<MarginChartPane />)

    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-type', PriceChartType.LINE)
  })

  it('ignores clicks on the disabled candle option when candlesUnavailable (pref unchanged)', () => {
    useMarginChartPrefs.setState({ chartStyle: 'line' })
    mockChart(chartData({ candles: [candle()], loading: false, candlesUnavailable: true }))
    render(<MarginChartPane />)

    fireEvent.click(screen.getByTestId(TestID.MarginChartStyleCandles))

    expect(useMarginChartPrefs.getState().chartStyle).toBe('line')
    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-type', PriceChartType.LINE)
  })

  it('renders the candle option dimmed and wired to the unavailable tooltip when candlesUnavailable', () => {
    mockChart(chartData({ candles: [candle()], loading: false, candlesUnavailable: true }))
    render(<MarginChartPane />)

    const candleOption = screen.getByTestId(TestID.MarginChartStyleCandles)
    // Tamagui doesn't surface the option's raw `cursor: not-allowed` inline style in jsdom, so assert
    // the disabled button that drives the dim/not-allowed presentation instead.
    expect(candleOption.closest('button')).toHaveAttribute('aria-disabled', 'true')

    const tooltip = candleOption.closest('[data-testid="mouseover-tooltip"]')
    expect(tooltip).not.toBeNull()
    expect(tooltip).toHaveAttribute('data-tooltip-text', 'Candlesticks aren’t available for this market yet')
  })

  it('renders the candle option enabled and untooltipped when candles are available', () => {
    mockChart(chartData({ candles: [candle()], loading: false, candlesUnavailable: false }))
    render(<MarginChartPane />)

    const candleOption = screen.getByTestId(TestID.MarginChartStyleCandles)
    expect(candleOption.closest('button')).not.toHaveAttribute('aria-disabled', 'true')
    expect(candleOption.closest('[data-testid="mouseover-tooltip"]')).toBeNull()
  })
})

describe('MarginChartPane vertical zoom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMarginChartPrefs.setState(DEFAULT_MARGIN_CHART_PREFS)
    pairKeyRef.current = 'test-pair'
    // Overlay bounds present → there is headroom to zoom away.
    mockOverlays({ priceLines: [], markers: [], autoscaleBounds: { min: 1500, max: 3250 } })
  })

  it('renders the zoom pill in the control row at the default step, with out/reset disabled', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane />)

    expect(screen.getByTestId(TestID.MarginChartZoomOut)).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId(TestID.MarginChartZoomReset)).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId(TestID.MarginChartZoomIn)).not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-vzoom', '0')
  })

  // The mobile chart sheet: pinch zooms there, and the pill would push the controls past a phone's width.
  it('drops the zoom pill in the compact pane, keeping the time-window and style controls', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane compact />)

    expect(screen.queryByTestId(TestID.MarginChartZoomIn)).not.toBeInTheDocument()
    expect(screen.getByTestId(TestID.MarginChartStyleLine)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.MarginChartSettingsGear)).toBeInTheDocument()
  })

  it('steps the chart zoom param up to the cap (zoom-in disabling there) and back down', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane />)

    for (let presses = 1; presses <= MAX_VERTICAL_ZOOM_STEP + 1; presses++) {
      fireEvent.click(screen.getByTestId(TestID.MarginChartZoomIn))
      expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute(
        'data-vzoom',
        String(Math.min(presses, MAX_VERTICAL_ZOOM_STEP)),
      )
    }
    expect(screen.getByTestId(TestID.MarginChartZoomIn)).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(screen.getByTestId(TestID.MarginChartZoomOut))
    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-vzoom', String(MAX_VERTICAL_ZOOM_STEP - 1))
  })

  it('resets zoom to the default view when the market changes', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    const { rerender } = render(<MarginChartPane />)

    fireEvent.click(screen.getByTestId(TestID.MarginChartZoomIn))
    fireEvent.click(screen.getByTestId(TestID.MarginChartZoomIn))
    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-vzoom', '2')

    pairKeyRef.current = 'other-pair'
    rerender(<MarginChartPane />)

    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-vzoom', '0')
  })

  it('reset returns to the default fit-all view', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane />)

    fireEvent.click(screen.getByTestId(TestID.MarginChartZoomIn))
    fireEvent.click(screen.getByTestId(TestID.MarginChartZoomIn))
    fireEvent.click(screen.getByTestId(TestID.MarginChartZoomReset))

    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-vzoom', '0')
  })

  it('zoom-out and reset are no-ops at the default step', () => {
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane />)

    fireEvent.click(screen.getByTestId(TestID.MarginChartZoomOut))
    fireEvent.click(screen.getByTestId(TestID.MarginChartZoomReset))

    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-vzoom', '0')
  })

  it('does not zoom in when overlays provide no autoscale bounds (already candle-fit)', () => {
    mockOverlays({ priceLines: [], markers: [] })
    mockChart(chartData({ candles: [candle()], loading: false }))
    render(<MarginChartPane />)

    expect(screen.getByTestId(TestID.MarginChartZoomIn)).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(screen.getByTestId(TestID.MarginChartZoomIn))

    expect(screen.getByTestId('margin-chart-mock')).toHaveAttribute('data-vzoom', '0')
  })
})

describe('MarginChartPane when the market cannot be resolved', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOverlays({ priceLines: [], markers: [] })
    mockMarketsUnresolved.current = true
    mockMarketsError.current = new Error('boom')
  })

  afterEach(() => {
    mockMarketsUnresolved.current = false
    mockMarketsError.current = undefined
  })

  // Regression: with an empty market list and a failed query, each independently-guarded surface
  // must render its own error/empty testID rather than merely not throwing — MarginStatsStrip and
  // the pane's own gate resolve the market separately and must not silently agree on "nothing".
  it('renders the stats-strip empty state and the pane-level error state, each independently', () => {
    render(<MarginChartPane />)

    // MarginStatsStrip: undefined market always reads as margin.market.empty, regardless of error.
    expect(screen.getByText('No markets available')).toBeInTheDocument()
    // The pane's own gate: error + no cached markets renders MarginFormMarketsState's error testID.
    const errorBox = screen.getByTestId(TestID.MarginMarketsError)
    const retryButton = errorBox.querySelector('button')
    expect(retryButton).toBeTruthy()
    fireEvent.click(retryButton!)
    expect(mockMarketsRefetch).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('margin-chart-mock')).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.MarginChartSkeleton)).not.toBeInTheDocument()
  })
})

// The strip's venue-level numbers (borrow APY, liquidity, LLTV) belong to ONE venue. Before a quote
// exists the pair group is all that is known, so it stays on the pair's first market; once the quote
// names the venue it actually routed to, the strip has to follow it or it advertises terms the
// position will not get.
describe('MarginStatsStrip venue keying', () => {
  const MORPHO = getDefaultMarginMarket()
  const AAVE: MarginMarket = { ...MORPHO, key: 'weth-usdc-AAVE_V3', venue: 'AAVE_V3', maxLeverage: 3 }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOverlays({ priceLines: [], markers: [] })
    mockChart(chartData({ candles: [candle()] }))
    mockPairMarkets.current = [MORPHO, AAVE]
    mockLiveByKey.current = new Map([
      [MORPHO.key, { borrowApyBps: 420, availableBorrowLiquidity: '0', markPriceX18: '0', lltvWad: MORPHO.lltvWad }],
      [
        AAVE.key,
        { borrowApyBps: 510, availableBorrowLiquidity: '0', markPriceX18: '0', lltvWad: '770000000000000000' },
      ],
    ])
  })

  afterEach(() => {
    mockPairMarkets.current = undefined
    mockLiveByKey.current = new Map()
  })

  it('keys the pair group before a quote names a venue', () => {
    render(<MarginChartPane />)

    expect(screen.getByText('Borrow APY 4.20%')).toBeInTheDocument()
    expect(screen.getByText('LLTV 86% · Max 5x')).toBeInTheDocument()
  })

  it('keys the quoted venue once the quote has one', () => {
    mockOverlays({ priceLines: [], markers: [], routedVenue: 'AAVE_V3' })
    render(<MarginChartPane />)

    expect(screen.getByText('Borrow APY 5.10%')).toBeInTheDocument()
    // The LLTV follows the routed venue; the ceiling still maxes over every allowed venue, since the
    // slider it has to agree with is not venue-pinned either.
    expect(screen.getByText('LLTV 77% · Max 5x')).toBeInTheDocument()
  })

  // A venue the pair no longer offers (a stale quote across a market switch) must not blank the strip.
  it('falls back to the pair group when the quoted venue is not one of its markets', () => {
    mockOverlays({ priceLines: [], markers: [], routedVenue: 'AAVE_V4' })
    render(<MarginChartPane />)

    expect(screen.getByText('Borrow APY 4.20%')).toBeInTheDocument()
  })
})
