import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import { ChartType, DataQuality, PriceChartType } from '~/components/Charts/utils'
import { useTDPPriceChartData } from '~/pages/TokenDetails/components/chart/hooks'
import { renderHook } from '~/test-utils/render'

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

const BASE_VARIABLES = {
  chain: GraphQLApi.Chain.Ethereum,
  address: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
  duration: GraphQLApi.HistoryDuration.Year,
  multichain: false,
}

function makeSubgraphResult(priceHistory: typeof SUBGRAPH_PRICE_HISTORY) {
  return {
    data: { token: { market: { priceHistory, ohlc: null, price: { value: 12 } } } },
    loading: false,
  }
}

function makeCoinGeckoResult(priceHistory: typeof COINGECKO_PRICE_HISTORY | []) {
  return {
    data: {
      tokenProjects: [
        {
          tokens: [{ chain: GraphQLApi.Chain.Ethereum, market: { priceHistory } }],
          markets: [],
        },
      ],
    },
    loading: false,
  }
}

describe('useTDPPriceChartData', () => {
  beforeEach(() => {
    mockUseTokenPriceQuery.mockReturnValue(makeSubgraphResult(SUBGRAPH_PRICE_HISTORY))
    mockUseTokenPriceHistoryQuery.mockReturnValue(makeCoinGeckoResult(COINGECKO_PRICE_HISTORY))
  })

  it('uses CoinGecko price history when it returns data', () => {
    const { result } = renderHook(() =>
      useTDPPriceChartData({
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
      useTDPPriceChartData({
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
      useTDPPriceChartData({
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
      useTDPPriceChartData({
        variables: { ...BASE_VARIABLES, multichain: true },
        skip: false,
        priceChartType: PriceChartType.LINE,
      }),
    )

    // Subgraph entries start at value 10
    expect(result.current.entries[0].value).toBe(10)
  })
})
