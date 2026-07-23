import { GraphQLApi } from '@universe/api'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { TimePeriod } from '~/appGraphql/data/util'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType, DataQuality, PriceChartType } from '~/components/Charts/utils'
import {
  getCalculatedPricePercentChange,
  getDisplayedPricePercentChange,
  toStrictlyAscendingByTime,
  useTokenPriceChartData,
} from '~/hooks/useTokenPriceChartData'
import { act, renderHook } from '~/test-utils/render'

const { mockUseTokenPriceQuery, mockUseTokenPriceHistoryQuery } = vi.hoisted(() => {
  const mockUseTokenPriceQuery = vi.fn()
  const mockUseTokenPriceHistoryQuery = vi.fn()
  return { mockUseTokenPriceQuery, mockUseTokenPriceHistoryQuery }
})

vi.mock('@universe/api', async () => {
  const actual = await vi.importActual('@universe/api')
  return {
    ...actual,
    GraphQLApi: {
      ...(actual.GraphQLApi as Record<string, unknown>),
      useTokenPriceQuery: mockUseTokenPriceQuery,
      useTokenPriceHistoryQuery: mockUseTokenPriceHistoryQuery,
    },
  }
})

function priceHistoryEntry(timestamp: number, value: number) {
  return { timestamp, value }
}

const SUBGRAPH_PRICE_HISTORY = [priceHistoryEntry(1000, 10), priceHistoryEntry(2000, 11), priceHistoryEntry(3000, 12)]

const COINGECKO_PRICE_HISTORY = [priceHistoryEntry(1000, 20), priceHistoryEntry(2000, 21), priceHistoryEntry(3000, 22)]

const COINGECKO_PROJECT_PRICE_HISTORY = [
  priceHistoryEntry(1000, 30),
  priceHistoryEntry(2000, 31),
  priceHistoryEntry(3000, 32),
]

const SUBGRAPH_OHLC = [
  {
    timestamp: 1000,
    open: { value: 10 },
    high: { value: 11 },
    low: { value: 9 },
    close: { value: 10 },
  },
  {
    timestamp: 2000,
    open: { value: 10 },
    high: { value: 12 },
    low: { value: 10 },
    close: { value: 11 },
  },
  {
    timestamp: 3000,
    open: { value: 11 },
    high: { value: 13 },
    low: { value: 11 },
    close: { value: 12 },
  },
]

const BASE_VARIABLES = {
  chain: GraphQLApi.Chain.Ethereum,
  address: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
  duration: GraphQLApi.HistoryDuration.Year,
  multichain: false,
}

function makeSubgraphResult(priceHistory: typeof SUBGRAPH_PRICE_HISTORY, ohlc: typeof SUBGRAPH_OHLC | null = null) {
  return {
    data: { token: { market: { priceHistory, ohlc, price: { value: 12 } } } },
    loading: false,
    refetch: vi.fn().mockResolvedValue(undefined),
  }
}

function makeCoinGeckoResult(
  priceHistory: typeof COINGECKO_PRICE_HISTORY | [],
  projectPriceHistory: typeof COINGECKO_PROJECT_PRICE_HISTORY | [] = [],
) {
  return {
    data: {
      tokenProjects: [
        {
          tokens: [{ chain: GraphQLApi.Chain.Ethereum, market: { priceHistory } }],
          markets: projectPriceHistory.length ? [{ price: { value: 32 }, priceHistory: projectPriceHistory }] : [],
        },
      ],
    },
    loading: false,
  }
}

describe('useTokenPriceChartData', () => {
  beforeEach(() => {
    mockUseTokenPriceQuery.mockReturnValue(makeSubgraphResult(SUBGRAPH_PRICE_HISTORY))
    mockUseTokenPriceHistoryQuery.mockReturnValue(makeCoinGeckoResult(COINGECKO_PRICE_HISTORY))
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
  })

  it('uses CoinGecko price history when it returns data', () => {
    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables: BASE_VARIABLES,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    expect(result.current.chartType).toBe(ChartType.PRICE)
    expect(result.current.dataQuality).toBe(DataQuality.VALID)
    // CoinGecko entries start at value 20; subgraph starts at 10
    expect(result.current.entries[0].value).toBe(20)
  })

  it('falls back to subgraph when CoinGecko returns an empty array', () => {
    mockUseTokenPriceHistoryQuery.mockReturnValue(makeCoinGeckoResult([]))

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables: BASE_VARIABLES,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    expect(result.current.chartType).toBe(ChartType.PRICE)
    expect(result.current.dataQuality).toBe(DataQuality.VALID)
    // Subgraph entries start at value 10
    expect(result.current.entries[0].value).toBe(10)
  })

  it('returns INVALID data quality when both CoinGecko and subgraph return empty arrays', () => {
    mockUseTokenPriceHistoryQuery.mockReturnValue(makeCoinGeckoResult([]))
    mockUseTokenPriceQuery.mockReturnValue(makeSubgraphResult([]))

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables: BASE_VARIABLES,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    expect(result.current.dataQuality).toBe(DataQuality.INVALID)
    expect(result.current.entries).toHaveLength(0)
  })

  it('uses subgraph data for multichain tokens regardless of CoinGecko response', () => {
    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables: { ...BASE_VARIABLES, multichain: true },
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    // Subgraph entries start at value 10
    expect(result.current.entries[0].value).toBe(10)
  })

  it('uses project CoinGecko price history for multichain tokens when project market data is preferred', () => {
    mockUseTokenPriceHistoryQuery.mockReturnValue(
      makeCoinGeckoResult(COINGECKO_PRICE_HISTORY, COINGECKO_PROJECT_PRICE_HISTORY),
    )

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables: { ...BASE_VARIABLES, multichain: true },
        skip: false,
        priceChartType: PriceChartType.LINE,
        preferProjectMarketData: true,
      }),
    )

    // Project CoinGecko entries start at value 30; token-level entries start at 20; subgraph starts at 10
    expect(result.current.entries[0].value).toBe(30)
    expect(mockUseTokenPriceHistoryQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: false,
      }),
    )
  })

  it('disables candlesticks and uses project CoinGecko line history when project market data is preferred', () => {
    mockUseTokenPriceHistoryQuery.mockReturnValue(
      makeCoinGeckoResult(COINGECKO_PRICE_HISTORY, COINGECKO_PROJECT_PRICE_HISTORY),
    )
    mockUseTokenPriceQuery.mockReturnValue(makeSubgraphResult(SUBGRAPH_PRICE_HISTORY, SUBGRAPH_OHLC))

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables: { ...BASE_VARIABLES, multichain: true },
        skip: false,
        priceChartType: PriceChartType.CANDLESTICK,
        preferProjectMarketData: true,
      }),
    )

    expect(result.current.disableCandlestickUI).toBe(true)
    expect(result.current.entries[0].value).toBe(30)
    expect(mockUseTokenPriceHistoryQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: false,
      }),
    )
  })

  it('does not fall back to subgraph data while preferred project market history is loading', () => {
    mockUseTokenPriceHistoryQuery.mockReturnValue({ data: undefined, loading: true })
    mockUseTokenPriceQuery.mockReturnValue(makeSubgraphResult(SUBGRAPH_PRICE_HISTORY, SUBGRAPH_OHLC))

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables: { ...BASE_VARIABLES, multichain: true },
        skip: false,
        priceChartType: PriceChartType.LINE,
        preferProjectMarketData: true,
      }),
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.dataQuality).toBe(DataQuality.INVALID)
    expect(result.current.entries).toHaveLength(0)
  })

  it('falls back to subgraph data when preferred project market history is missing after loading', () => {
    mockUseTokenPriceHistoryQuery.mockReturnValue(makeCoinGeckoResult([], []))
    mockUseTokenPriceQuery.mockReturnValue(makeSubgraphResult(SUBGRAPH_PRICE_HISTORY, SUBGRAPH_OHLC))

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables: { ...BASE_VARIABLES, multichain: true },
        skip: false,
        priceChartType: PriceChartType.LINE,
        preferProjectMarketData: true,
      }),
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.dataQuality).toBe(DataQuality.VALID)
    expect(result.current.entries[0].value).toBe(9)
  })

  it('pauses price polling when tab is hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })

    renderHook(() =>
      useTokenPriceChartData({
        variables: BASE_VARIABLES,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    expect(mockUseTokenPriceQuery).toHaveBeenLastCalledWith(expect.objectContaining({ pollInterval: 0 }))
  })

  it('polls at the normal rate when tab is visible', () => {
    renderHook(() =>
      useTokenPriceChartData({
        variables: BASE_VARIABLES,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    expect(mockUseTokenPriceQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ pollInterval: PollingInterval.KindaFast }),
    )
  })

  it('fires an immediate refetch when the tab becomes visible after being hidden', async () => {
    const mockRefetch = vi.fn().mockResolvedValue(undefined)
    mockUseTokenPriceQuery.mockReturnValue({ ...makeSubgraphResult(SUBGRAPH_PRICE_HISTORY), refetch: mockRefetch })

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })

    renderHook(() =>
      useTokenPriceChartData({
        variables: BASE_VARIABLES,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    expect(mockRefetch).not.toHaveBeenCalled()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(mockRefetch).toHaveBeenCalledOnce()
  })

  it('does not refetch when skip is true and tab becomes visible', async () => {
    const mockRefetch = vi.fn().mockResolvedValue(undefined)
    mockUseTokenPriceQuery.mockReturnValue({ ...makeSubgraphResult(SUBGRAPH_PRICE_HISTORY), refetch: mockRefetch })

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })

    renderHook(() =>
      useTokenPriceChartData({
        variables: BASE_VARIABLES,
        skip: true,
        priceChartType: PriceChartType.LINE,
      }),
    )

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(mockRefetch).not.toHaveBeenCalled()
  })

  it('produces strictly ascending timestamps when CoinGecko returns a duplicate trailing timestamp', () => {
    // Upstream CoinGecko history can end with two points at the same second. lightweight-charts
    // requires strictly-ascending times; a zero delta breaks curved-line interpolation and paints
    // a spurious diagonal line/wedge across the chart.
    mockUseTokenPriceHistoryQuery.mockReturnValue(
      makeCoinGeckoResult([
        priceHistoryEntry(1000, 20),
        priceHistoryEntry(2000, 21),
        priceHistoryEntry(3000, 22),
        priceHistoryEntry(3000, 22),
      ]),
    )

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables: BASE_VARIABLES,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    const times = result.current.entries.map((entry) => entry.time)
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThan(times[i - 1])
    }
  })
})

function point(time: number, close: number): PriceChartData {
  return { time: time as PriceChartData['time'], value: close, open: close, high: close, low: close, close }
}

describe('getCalculatedPricePercentChange', () => {
  it('returns undefined for empty entries', () => {
    expect(getCalculatedPricePercentChange([])).toBeUndefined()
  })

  it('returns undefined when open close is zero', () => {
    expect(getCalculatedPricePercentChange([point(1, 0), point(2, 1), point(3, 2)])).toBeUndefined()
  })

  it('returns percent change from first to last close', () => {
    expect(getCalculatedPricePercentChange([point(1, 100), point(2, 110), point(3, 150)])).toBe(50)
  })
})

describe('getDisplayedPricePercentChange', () => {
  it('uses 24h change for DAY period', () => {
    expect(
      getDisplayedPricePercentChange({
        timePeriod: TimePeriod.DAY,
        priceChange24h: 5,
        entries: [point(1, 100), point(2, 200)],
      }),
    ).toBe(5)
  })

  it('uses calculated change for non-DAY periods', () => {
    expect(
      getDisplayedPricePercentChange({
        timePeriod: TimePeriod.WEEK,
        priceChange24h: 99,
        entries: [point(1, 100), point(2, 150), point(3, 400)],
      }),
    ).toBe(300)
  })
})

describe('toStrictlyAscendingByTime', () => {
  it('collapses duplicate timestamps, keeping the latest value', () => {
    const result = toStrictlyAscendingByTime([point(1000, 10), point(2000, 11), point(3000, 12), point(3000, 13)])
    expect(result.map((entry) => entry.time)).toEqual([1000, 2000, 3000])
    expect(result[result.length - 1].value).toBe(13)
  })

  it('drops out-of-order timestamps', () => {
    const result = toStrictlyAscendingByTime([point(1000, 10), point(3000, 12), point(2000, 11)])
    expect(result.map((entry) => entry.time)).toEqual([1000, 3000])
  })

  it('leaves already-ascending data untouched', () => {
    const entries = [point(1000, 10), point(2000, 11), point(3000, 12)]
    expect(toStrictlyAscendingByTime(entries)).toEqual(entries)
  })
})
