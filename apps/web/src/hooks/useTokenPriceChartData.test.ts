import { GetTokenHistoryOHLCResponse, GetTokenHistoryPriceResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { MAX_DISPLAYABLE_PRICE_AGE_MS } from '@universe/prices'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { currentTimeInSeconds, ONE_MINUTE_MS } from 'utilities/src/time/time'
import { TimePeriod } from '~/data/util'
import {
  getCalculatedPricePercentChange,
  getDisplayedPricePercentChange,
  mergeCandlesToGrid,
  toStrictlyAscendingByTime,
  useTokenPriceChartData,
} from '~/hooks/useTokenPriceChartData'
import { renderHook, waitFor } from '~/test-utils/render'
import { ChartType, DataQuality, type PriceChartData, PriceChartType } from '~/utils/charts'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getTokenHistoryOHLC: vi.fn(), getTokenHistoryPrice: vi.fn() },
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()),
  useTokenSpotPrice: vi.fn(),
}))

const mockClient = vi.mocked(dataApiServiceClientV2)
const mockUseTokenSpotPrice = vi.mocked(useTokenSpotPrice)

const BASE_VARIABLES = {
  chainId: UniverseChainId.Mainnet,
  address: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
  duration: HistoryDuration.Year,
  multichain: false,
}

const SPOT_PRICE = 42

/** Recent timestamps (unix seconds) so `checkDataQuality` doesn't read the fixtures as stale. */
const NOW_SECONDS = currentTimeInSeconds()
const T = [NOW_SECONDS - 3000, NOW_SECONDS - 2000, NOW_SECONDS - 1000]

const PRICE_POINTS = [
  { timestamp: BigInt(T[0]), priceUsd: 10 },
  { timestamp: BigInt(T[1]), priceUsd: 11 },
  { timestamp: BigInt(T[2]), priceUsd: 12 },
]

const candle = (timestamp: number, close: number) => ({
  timestamp: BigInt(timestamp),
  openUsd: close,
  highUsd: close,
  lowUsd: close,
  closeUsd: close,
})

const OHLC_CANDLES = [candle(T[0], 20), candle(T[1], 21), candle(T[2], 22)]
const ZERO_OHLC_CANDLES = [candle(T[0], 0), candle(T[1], 0), candle(T[2], 0)]

// The test QueryClient is shared, so each test uses a unique token to isolate the real query keys.
let tokenIndex = 0
let variables = BASE_VARIABLES

function mockRestResponses({
  candles = OHLC_CANDLES,
  points = PRICE_POINTS,
}: {
  candles?: typeof OHLC_CANDLES
  points?: typeof PRICE_POINTS
} = {}): void {
  mockClient.getTokenHistoryOHLC.mockResolvedValue(new GetTokenHistoryOHLCResponse({ candles }))
  mockClient.getTokenHistoryPrice.mockResolvedValue(new GetTokenHistoryPriceResponse({ points }))
}

/**
 * The hook appends the live spot price to the end of the series (`appendLiveSpotPriceEntry`), either
 * as a new trailing point or coalesced into the last backend point depending on the series'
 * granularity. This asserts what holds either way.
 */
function expectSeriesWithLiveSpot({
  entries,
  backendValues,
  spotPrice,
}: {
  entries: PriceChartData[]
  backendValues: number[]
  spotPrice: number
}): void {
  expect(entries.length).toBeGreaterThanOrEqual(backendValues.length)
  expect(entries.length).toBeLessThanOrEqual(backendValues.length + 1)

  const retained = entries.slice(0, -1)
  expect(retained.map((entry) => entry.value)).toEqual(backendValues.slice(0, retained.length))
  expect(entries[entries.length - 1].value).toBe(spotPrice)
}

describe('useTokenPriceChartData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenIndex += 1
    variables = { ...BASE_VARIABLES, address: `0x${String(tokenIndex).padStart(40, '0')}` }
    mockUseTokenSpotPrice.mockReturnValue(SPOT_PRICE)
    mockRestResponses()
  })

  it('renders the REST price history for line charts', async () => {
    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.chartType).toBe(ChartType.PRICE)
    expect(result.current.dataQuality).toBe(DataQuality.VALID)
    expect(result.current.disableCandlestickUI).toBe(false)
    expectSeriesWithLiveSpot({
      entries: result.current.entries,
      backendValues: [10, 11, 12],
      spotPrice: SPOT_PRICE,
    })
    expect(mockClient.getTokenHistoryOHLC).not.toHaveBeenCalled()
  })

  it('renders the REST OHLC candles for candlestick charts', async () => {
    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables,
        skip: false,
        priceChartType: PriceChartType.CANDLESTICK,
      }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expectSeriesWithLiveSpot({
      entries: result.current.entries,
      backendValues: [20, 21, 22],
      spotPrice: SPOT_PRICE,
    })
    expect(mockClient.getTokenHistoryPrice).not.toHaveBeenCalled()
  })

  it('falls back to price history and disables the candlestick UI on an all-zero OHLC series', async () => {
    mockRestResponses({ candles: ZERO_OHLC_CANDLES })

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables,
        skip: false,
        priceChartType: PriceChartType.CANDLESTICK,
      }),
    )

    await waitFor(() => expect(result.current.disableCandlestickUI).toBe(true))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expectSeriesWithLiveSpot({
      entries: result.current.entries,
      backendValues: [10, 11, 12],
      spotPrice: SPOT_PRICE,
    })
  })

  it('returns INVALID data quality when REST returns no points', async () => {
    mockRestResponses({ points: [] })
    mockUseTokenSpotPrice.mockReturnValue(undefined)

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.dataQuality).toBe(DataQuality.INVALID)
    expect(result.current.entries).toHaveLength(0)
  })

  it('disables both REST queries when skipped', () => {
    renderHook(() =>
      useTokenPriceChartData({
        variables,
        skip: true,
        priceChartType: PriceChartType.LINE,
      }),
    )

    expect(mockClient.getTokenHistoryOHLC).not.toHaveBeenCalled()
    expect(mockClient.getTokenHistoryPrice).not.toHaveBeenCalled()
  })

  it('prefers the caller-supplied current price over its own spot-price fallback', async () => {
    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables,
        skip: false,
        priceChartType: PriceChartType.LINE,
        currentPriceOverride: 999,
      }),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.entries[result.current.entries.length - 1].value).toBe(999)
    // With an override there is nothing for the fallback query to provide, so it stays skipped.
    expect(mockUseTokenSpotPrice).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ skip: true }))
  })

  it.each([PriceChartType.LINE, PriceChartType.CANDLESTICK])(
    'shows a skeleton instead of an aged cached %s series while it refetches',
    async (priceChartType) => {
      const renderChart = () => renderHook(() => useTokenPriceChartData({ variables, skip: false, priceChartType }))
      const firstVisit = renderChart()
      await waitFor(() => expect(firstVisit.result.current.loading).toBe(false))
      firstVisit.unmount()

      const now = Date.now()
      const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now + MAX_DISPLAYABLE_PRICE_AGE_MS + ONE_MINUTE_MS)
      onTestFinished(() => dateNowSpy.mockRestore())
      let resolveRefetch = (): void => {}
      const refetch = new Promise<void>((resolve) => {
        resolveRefetch = resolve
      })
      mockClient.getTokenHistoryPrice.mockReturnValue(
        refetch.then(() => new GetTokenHistoryPriceResponse({ points: PRICE_POINTS })),
      )
      mockClient.getTokenHistoryOHLC.mockReturnValue(
        refetch.then(() => new GetTokenHistoryOHLCResponse({ candles: OHLC_CANDLES })),
      )
      const endpoint =
        priceChartType === PriceChartType.LINE ? mockClient.getTokenHistoryPrice : mockClient.getTokenHistoryOHLC

      const { result } = renderChart()
      await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(2))
      expect(result.current).toMatchObject({ entries: [], loading: true, dataQuality: DataQuality.INVALID })

      resolveRefetch()
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.entries.length).toBeGreaterThan(0)
    },
  )

  it('produces strictly ascending timestamps when REST returns a duplicate trailing timestamp', async () => {
    // Upstream price history can end with two points at the same second. lightweight-charts
    // requires strictly-ascending times; a zero delta breaks curved-line interpolation and paints
    // a spurious diagonal line/wedge across the chart.
    mockRestResponses({ points: [...PRICE_POINTS, { timestamp: BigInt(T[2]), priceUsd: 12 }] })

    const { result } = renderHook(() =>
      useTokenPriceChartData({
        variables,
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    await waitFor(() => expect(result.current.entries.length).toBeGreaterThan(0))

    const times = result.current.entries.map((entry) => entry.time)
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThan(times[i - 1])
    }
  })

  it.each([PriceChartType.LINE, PriceChartType.CANDLESTICK])(
    'retains the displayed price during a %s period switch by default',
    async (priceChartType) => {
      const { result, rerender } = renderHook(
        ({ duration }) =>
          useTokenPriceChartData({
            variables: { ...variables, duration },
            skip: false,
            priceChartType,
          }),
        { initialProps: { duration: HistoryDuration.Day } },
      )
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.entries.length).toBeGreaterThan(0)

      rerender({ duration: HistoryDuration.Week })

      expect(result.current.loading).toBe(false)
      expect(result.current.entries.at(-1)?.value).toBe(SPOT_PRICE)
    },
  )

  it.each([PriceChartType.LINE, PriceChartType.CANDLESTICK])(
    'shows a skeleton during a %s period switch when previous data is disabled',
    async (priceChartType) => {
      const { result, rerender } = renderHook(
        ({ duration }) =>
          useTokenPriceChartData({
            variables: { ...variables, duration },
            skip: false,
            priceChartType,
            keepPreviousData: false,
          }),
        { initialProps: { duration: HistoryDuration.Day } },
      )
      await waitFor(() => expect(result.current.entries.length).toBeGreaterThan(0))

      rerender({ duration: HistoryDuration.Week })

      expect(result.current).toMatchObject({ entries: [], loading: true, dataQuality: DataQuality.INVALID })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.entries.length).toBeGreaterThan(0)
    },
  )
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

describe('mergeCandlesToGrid', () => {
  const candle = (time: number, open: number): PriceChartData =>
    ({ time, open, high: open + 2, low: open - 2, close: open + 1, value: open + 1 }) as PriceChartData

  it('merges each bucket into first open, max high, min low and last close', () => {
    expect(mergeCandlesToGrid({ candles: [candle(1200, 10), candle(1500, 20)], resolutionSeconds: 600 })).toEqual([
      { time: 1200, open: 10, high: 22, low: 8, close: 21, value: 21 },
    ])
  })

  // Pairing by index would merge the candles either side of the gap into one bar spanning 15 minutes.
  it('leaves a bucket with a missing candle short rather than borrowing a neighbour', () => {
    const merged = mergeCandlesToGrid({
      candles: [candle(1200, 10), candle(1800, 20), candle(2100, 30)],
      resolutionSeconds: 600,
    })
    expect(merged.map(({ time, open, close }) => ({ time, open, close }))).toEqual([
      { time: 1200, open: 10, close: 11 },
      { time: 1800, open: 20, close: 31 },
    ])
  })
})
