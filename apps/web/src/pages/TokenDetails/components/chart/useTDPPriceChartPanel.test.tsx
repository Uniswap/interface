import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { TimePeriod } from '~/appGraphql/data/util'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType, DataQuality, PriceChartType, type ChartQueryResult } from '~/components/Charts/utils'
import { useTDPPriceChartData } from '~/pages/TokenDetails/components/chart/hooks'
import { useTDPPriceChartPanel } from '~/pages/TokenDetails/components/chart/useTDPPriceChartPanel'
import { renderHook } from '~/test-utils/render'

vi.mock('~/pages/TokenDetails/components/chart/hooks', () => ({
  useTDPPriceChartData: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenSpotPriceWrapper', () => ({
  useTokenSpotPrice: vi.fn(() => undefined),
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()
  return {
    ...actual,
    useTokenPriceChange: vi.fn(() => 42),
  }
})

const mockUseTDPPriceChartData = vi.mocked(useTDPPriceChartData)

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

describe('useTDPPriceChartPanel', () => {
  beforeEach(() => {
    mockUseTDPPriceChartData.mockReturnValue(basePriceQuery)
  })

  it('syncs disableCandlestickUI to the store in layout effect', () => {
    mockUseTDPPriceChartData.mockReturnValue({ ...basePriceQuery, disableCandlestickUI: true })
    const setDisableCandlestickUI = vi.fn()

    renderHook(() =>
      useTDPPriceChartPanel({
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
      useTDPPriceChartPanel({
        variables,
        priceChartType: PriceChartType.LINE,
        setDisableCandlestickUI: vi.fn(),
        timePeriod: TimePeriod.DAY,
        currency: USDC_MAINNET,
      }),
    )

    expect(result.current.pricePercentChange).toBe(42)
  })

  it('uses entry-based change when time period is not DAY', () => {
    const { result } = renderHook(() =>
      useTDPPriceChartPanel({
        variables,
        priceChartType: PriceChartType.LINE,
        setDisableCandlestickUI: vi.fn(),
        timePeriod: TimePeriod.WEEK,
        currency: USDC_MAINNET,
      }),
    )

    expect(result.current.pricePercentChange).toBe(300)
  })

  it('sets showInvalidSkeleton when data quality is INVALID', () => {
    mockUseTDPPriceChartData.mockReturnValue({ ...basePriceQuery, dataQuality: DataQuality.INVALID })

    const { result } = renderHook(() =>
      useTDPPriceChartPanel({
        variables,
        priceChartType: PriceChartType.LINE,
        setDisableCandlestickUI: vi.fn(),
        timePeriod: TimePeriod.WEEK,
        currency: USDC_MAINNET,
      }),
    )

    expect(result.current.showInvalidSkeleton).toBe(true)
  })
})
