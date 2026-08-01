import { GraphQLApi } from '@universe/api'
import { useFeatureFlag } from '@universe/gating'
import { UTCTimestamp } from 'lightweight-charts'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { usePreferProjectMarketDataForCurrency } from 'uniswap/src/features/rwa/usePreferProjectMarketData'
import { TimePeriod } from '~/appGraphql/data/util'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType, DataQuality, PriceChartType, type ChartQueryResult } from '~/components/Charts/utils'
import { useTokenPriceChartData } from '~/hooks/useTokenPriceChartData'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import { renderHook } from '~/test-utils/render'

vi.mock('~/hooks/useTokenPriceChartData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/hooks/useTokenPriceChartData')>()
  return {
    ...actual,
    useTokenPriceChartData: vi.fn(),
    getDisplayedPricePercentChange: vi.fn(actual.getDisplayedPricePercentChange),
  }
})

vi.mock('uniswap/src/features/rwa/usePreferProjectMarketData', () => ({
  usePreferProjectMarketDataForCurrency: vi.fn(() => false),
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()
  return {
    ...actual,
    useTokenSpotPrice: vi.fn(() => undefined),
    useTokenPriceChange: vi.fn(() => 42),
  }
})

const mockUseTokenPriceChartData = vi.mocked(useTokenPriceChartData)
const mockUseTokenSpotPrice = vi.mocked(useTokenSpotPrice)
const mockUsePreferProjectMarketDataForCurrency = vi.mocked(usePreferProjectMarketDataForCurrency)
const mockUseFeatureFlag = vi.mocked(useFeatureFlag)

type PriceChartQueryMock = ChartQueryResult<PriceChartData, ChartType.PRICE> & {
  disableCandlestickUI: boolean
}

function priceEntry(time: number, close: number) {
  return {
    time: time as UTCTimestamp,
    value: close,
    open: close,
    high: close,
    low: close,
    close,
  }
}

const basePriceQuery: PriceChartQueryMock = {
  chartType: ChartType.PRICE,
  entries: [priceEntry(1, 100), priceEntry(2, 100), priceEntry(3, 400)],
  loading: false,
  dataQuality: DataQuality.VALID,
  disableCandlestickUI: false,
}

const variables = {
  chain: GraphQLApi.Chain.Ethereum,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  duration: GraphQLApi.HistoryDuration.Day,
  multichain: false,
}

describe('useTokenPriceChartPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTokenPriceChartData.mockReturnValue(basePriceQuery)
    mockUseTokenSpotPrice.mockReturnValue(undefined)
    mockUsePreferProjectMarketDataForCurrency.mockReturnValue(false)
  })

  it('syncs disableCandlestickUI to the store in layout effect', () => {
    mockUseTokenPriceChartData.mockReturnValue({ ...basePriceQuery, disableCandlestickUI: true })
    const setDisableCandlestickUI = vi.fn()

    renderHook(() =>
      useTokenPriceChartPanel({
        variables,
        priceChartType: PriceChartType.LINE,
        setDisableCandlestickUI,
        timePeriod: TimePeriod.WEEK,
        currency: USDC_MAINNET,
      }),
    )

    expect(setDisableCandlestickUI).toHaveBeenCalledWith(true)
  })

  it('uses 24h price change from useTokenPriceChange when time period is DAY', () => {
    const { result } = renderHook(() =>
      useTokenPriceChartPanel({
        variables,
        priceChartType: PriceChartType.LINE,
        timePeriod: TimePeriod.DAY,
        currency: USDC_MAINNET,
      }),
    )

    expect(result.current.pricePercentChange).toBe(42)
  })

  it('uses entry-based change when time period is not DAY', () => {
    const { result } = renderHook(() =>
      useTokenPriceChartPanel({
        variables,
        priceChartType: PriceChartType.LINE,
        timePeriod: TimePeriod.WEEK,
        currency: USDC_MAINNET,
      }),
    )

    expect(result.current.pricePercentChange).toBe(300)
  })

  it('sets showInvalidSkeleton when data quality is INVALID', () => {
    mockUseTokenPriceChartData.mockReturnValue({ ...basePriceQuery, dataQuality: DataQuality.INVALID })

    const { result } = renderHook(() =>
      useTokenPriceChartPanel({
        variables,
        priceChartType: PriceChartType.LINE,
        timePeriod: TimePeriod.WEEK,
        currency: USDC_MAINNET,
      }),
    )

    expect(result.current.showInvalidSkeleton).toBe(true)
  })

  it('keeps project market data preference off when the token is not a tokenized security', () => {
    renderHook(() =>
      useTokenPriceChartPanel({
        variables: { ...variables, multichain: true },
        priceChartType: PriceChartType.LINE,
        setDisableCandlestickUI: vi.fn(),
        timePeriod: TimePeriod.WEEK,
        currency: USDC_MAINNET,
      }),
    )

    expect(mockUseTokenSpotPrice).toHaveBeenCalledWith(expect.any(String), {
      preferProjectMarketData: false,
      isMultichainAggregateView: true,
      multichainId: undefined,
    })
    expect(mockUseTokenPriceChartData).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPriceOverride: undefined,
        preferProjectMarketData: false,
      }),
    )
  })

  it('uses the REST spot price directly on the all-networks view when V2 tokens are enabled', () => {
    // V2 REST has no cross-chain aggregate price endpoint, so the per-chain REST price is
    // authoritative even on the aggregate view instead of falling back to legacy GraphQL/CoinGecko.
    mockUseFeatureFlag.mockReturnValue(true)
    mockUseTokenSpotPrice.mockReturnValue(123)

    renderHook(() =>
      useTokenPriceChartPanel({
        variables: { ...variables, multichain: true },
        priceChartType: PriceChartType.LINE,
        setDisableCandlestickUI: vi.fn(),
        timePeriod: TimePeriod.WEEK,
        currency: USDC_MAINNET,
      }),
    )

    expect(mockUseTokenPriceChartData).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPriceOverride: 123,
      }),
    )
  })

  it('prefers project market data when the RWA preference hook opts in', () => {
    // Represents rwa_coingecko_data being enabled and the current TDP token matching the RWA whitelist.
    mockUsePreferProjectMarketDataForCurrency.mockReturnValue(true)
    mockUseTokenSpotPrice.mockReturnValue(123)

    renderHook(() =>
      useTokenPriceChartPanel({
        variables: { ...variables, multichain: true },
        priceChartType: PriceChartType.LINE,
        setDisableCandlestickUI: vi.fn(),
        timePeriod: TimePeriod.WEEK,
        currency: USDC_MAINNET,
      }),
    )

    expect(mockUseTokenSpotPrice).toHaveBeenCalledWith(expect.any(String), {
      preferProjectMarketData: true,
      isMultichainAggregateView: true,
      multichainId: undefined,
    })
    expect(mockUseTokenPriceChartData).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPriceOverride: 123,
        preferProjectMarketData: true,
      }),
    )
  })

  it('uses an explicit preferProjectMarketData override when provided', () => {
    mockUsePreferProjectMarketDataForCurrency.mockReturnValue(false)
    mockUseTokenSpotPrice.mockReturnValue(123)

    renderHook(() =>
      useTokenPriceChartPanel({
        variables,
        priceChartType: PriceChartType.LINE,
        timePeriod: TimePeriod.WEEK,
        currency: USDC_MAINNET,
        preferProjectMarketData: true,
      }),
    )

    expect(mockUseTokenSpotPrice).toHaveBeenCalledWith(expect.any(String), {
      preferProjectMarketData: true,
      isMultichainAggregateView: false,
      multichainId: undefined,
    })
  })
})
