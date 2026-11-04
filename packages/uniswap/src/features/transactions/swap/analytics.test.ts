import { TradeType } from '@uniswap/sdk-core'
import { SharedQueryClient, TradingApi, V1_TRADING_API_PATHS, type CheckPermissionsResponse } from '@universe/api'
import { USDC, WBTC } from 'uniswap/src/constants/tokens'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  getBaseTradeAnalyticsProperties,
  getRouteAnalyticsData,
} from 'uniswap/src/features/transactions/swap/analytics'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/logSwapQuoteFetch'
import { createBridgeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { NATIVE_ADDRESS_FOR_TRADING_API } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { createMockCurrencyAmount, createMockTradeWithStatus } from 'uniswap/src/test/fixtures/transactions/swap'
import { mockLocalizationContext } from 'uniswap/src/test/mocks/locale'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker')>()
  return {
    ...actual,
    timestampTracker: {
      hasTimestamp: (): boolean => false,
      setElapsedTime: (): number => 100,
      getElapsedTime: (): number => 100,
    },
  }
})

const mockV2Pool = { type: 'v2-pool', address: '0xv2PoolAddress' }
const mockV3Pool = { type: 'v3-pool', address: '0xv3PoolAddress' }
const mockV4Pool = { type: 'v4-pool', address: '0xpool1' }

const PERMISSIONED_TOKEN = '0xbf56488c857A881ae7e3BED27Cf99c10A7Ab7e50'
const STANDARD_TOKEN = '0x1F46ea239595706960a9208897968b169db1b89c'

function seedPermissions(params: { tokens: string[]; chainId: number; response: CheckPermissionsResponse }): void {
  const { tokens, chainId, response } = params
  SharedQueryClient.setQueryData<CheckPermissionsResponse>(
    [
      ReactQueryCacheKey.TradingApi,
      V1_TRADING_API_PATHS.checkPermissions,
      { walletAddress: '0xwallet', tokens, chainId },
    ],
    response,
  )
}

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
  })

  it('logSwapQuoteRequest calls sendAnalyticsEvent with correct parameters', () => {
    const mockChainId = 1

    logSwapQuoteFetch({
      chainId: mockChainId,
      tokenOutChainId: mockChainId,
      tokenIn: STANDARD_TOKEN,
      tokenOut: PERMISSIONED_TOKEN,
    })

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SwapQuoteFetch, {
      chainId: mockChainId,
      isQuickRoute: false,
      isUSDQuote: false,
      quoteSource: undefined,
      pollInterval: undefined,
      is_permissioned: undefined,
      time_to_first_quote_request: 100,
      time_to_first_quote_request_since_first_input: 100,
    })
  })

  it('logSwapQuoteRequest excludes perf metrics for price quotes', () => {
    const mockChainId = 1

    logSwapQuoteFetch({
      chainId: mockChainId,
      tokenOutChainId: mockChainId,
      tokenIn: STANDARD_TOKEN,
      tokenOut: PERMISSIONED_TOKEN,
      isUSDQuote: true,
    })

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SwapQuoteFetch, {
      chainId: mockChainId,
      isQuickRoute: false,
      isUSDQuote: true,
      quoteSource: undefined,
      pollInterval: undefined,
      is_permissioned: undefined,
    })
  })

  describe('logSwapQuoteFetch is_permissioned', () => {
    const mockChainId = 1

    function getSentSwapQuoteFetchProperties(): Record<string, unknown> {
      const call = vi.mocked(sendAnalyticsEvent).mock.calls.find(([name]) => name === SwapEventName.SwapQuoteFetch)
      expect(call).toBeDefined()
      return call?.[1] as Record<string, unknown>
    }

    it('is true when a pair token is resolved permissioned in the cache', () => {
      seedPermissions({
        tokens: [PERMISSIONED_TOKEN],
        chainId: mockChainId,
        response: { requestId: 'req-1', results: [{ token: PERMISSIONED_TOKEN, isPermissioned: true }] },
      })

      logSwapQuoteFetch({
        chainId: mockChainId,
        tokenOutChainId: mockChainId,
        tokenIn: PERMISSIONED_TOKEN,
        tokenOut: STANDARD_TOKEN,
      })

      expect(getSentSwapQuoteFetchProperties()['is_permissioned']).toBe(true)
    })

    it('is false when every pair token is resolved not-permissioned (native counts as resolved)', () => {
      seedPermissions({
        tokens: [STANDARD_TOKEN],
        chainId: mockChainId,
        response: { requestId: 'req-2', results: [{ token: STANDARD_TOKEN, isPermissioned: false }] },
      })

      logSwapQuoteFetch({
        chainId: mockChainId,
        tokenOutChainId: mockChainId,
        tokenIn: NATIVE_ADDRESS_FOR_TRADING_API,
        tokenOut: STANDARD_TOKEN,
      })

      expect(getSentSwapQuoteFetchProperties()['is_permissioned']).toBe(false)
    })

    it('is omitted when the cache has no resolved answer for the pair', () => {
      logSwapQuoteFetch({
        chainId: mockChainId,
        tokenOutChainId: mockChainId,
        tokenIn: STANDARD_TOKEN,
        tokenOut: PERMISSIONED_TOKEN,
      })

      expect(getSentSwapQuoteFetchProperties()['is_permissioned']).toBeUndefined()
    })

    it('is omitted for a cross-chain pair whose tokens were never checked', () => {
      seedPermissions({
        tokens: [STANDARD_TOKEN],
        chainId: mockChainId,
        response: { requestId: 'req-3', results: [{ token: STANDARD_TOKEN, isPermissioned: false }] },
      })

      logSwapQuoteFetch({
        chainId: mockChainId,
        tokenOutChainId: 10,
        tokenIn: STANDARD_TOKEN,
        tokenOut: STANDARD_TOKEN,
      })

      expect(getSentSwapQuoteFetchProperties()['is_permissioned']).toBeUndefined()
    })
  })

  describe('getRouteAnalyticsData', () => {
    it('returns undefined if routing is undefined', () => {
      const result = getRouteAnalyticsData({ routing: undefined })
      expect(result).toBeUndefined()
    })

    it('returns uniswapXUsed=true for UniswapX trade', () => {
      // We need to cast to Trade because the mock isn't a complete implementation
      const mockTrade = { routing: TradingApi.Routing.DUTCH_V2 } as Trade

      const result = getRouteAnalyticsData(mockTrade)
      expect(result).toEqual({
        v2Used: false,
        v3Used: false,
        v4Used: false,
        uniswapXUsed: true,
        jupiterUsed: false,
      })
    })

    it('extracts route data from classic trade with V2 and V3 pools', () => {
      const mockClassicTrade = {
        routing: TradingApi.Routing.CLASSIC,
        quote: { quote: { route: [[mockV2Pool], [mockV3Pool]] } },
      } as unknown as Trade

      // We need to cast to Trade because the mock isn't a complete implementation
      const result = getRouteAnalyticsData(mockClassicTrade as unknown as Trade)

      // Verify the analytics data structure
      expect(result).toEqual({
        paths: [
          [{ poolAddress: '0xv2PoolAddress', version: 'V2' }],
          [{ poolAddress: '0xv3PoolAddress', version: 'V3' }],
        ],
        poolsCount: 2,
        v2Used: true,
        v3Used: true,
        v4Used: false,
        uniswapXUsed: false,
        jupiterUsed: false,
      })
    })

    it('extracts route data from classic trade with V4 pools', () => {
      // We need to cast to Trade because the mock isn't a complete implementation
      const mockClassicTrade = {
        routing: TradingApi.Routing.CLASSIC,
        quote: { quote: { route: [[mockV4Pool]] } },
      } as unknown as Trade

      const result = getRouteAnalyticsData(mockClassicTrade as unknown as Trade)

      // Verify the analytics data structure
      expect(result).toEqual({
        paths: [[{ poolAddress: '0xpool1', version: 'V4' }]],
        poolsCount: 1,
        v2Used: false,
        v3Used: false,
        v4Used: true,
        uniswapXUsed: false,
        jupiterUsed: false,
      })
    })

    it('returns default result if route extraction fails', () => {
      // Create a mock trade that will cause extraction to fail
      const mockBrokenTrade = {
        routing: TradingApi.Routing.CLASSIC,
        quote: { quote: { route: [[{ type: 'unknown-pool' }]] } },
      } as unknown as Trade

      const result = getRouteAnalyticsData(mockBrokenTrade as unknown as Trade)

      // Should return the default result when extraction fails
      expect(result).toEqual({
        v2Used: false,
        v3Used: false,
        v4Used: false,
        uniswapXUsed: false,
        jupiterUsed: false,
      })
    })
  })

  describe(getBaseTradeAnalyticsProperties, () => {
    const formatter = mockLocalizationContext({}).useLocalizationContext()

    function bridgeTrade(provider: TradingApi.BridgeProvider | undefined): Trade {
      const trade = createBridgeTrade({
        quote: {
          quote: {
            input: { amount: '1000', maximumAmount: '1000' },
            output: { amount: '990', minimumAmount: '990' },
            provider,
          },
          requestId: '123',
          routing: TradingApi.Routing.BRIDGE,
          permitData: null,
        },
        currencyIn: USDC,
        currencyOut: WBTC,
        tradeType: TradeType.EXACT_INPUT,
      })
      if (!trade) {
        throw new Error('Expected test bridge trade to be created')
      }
      return trade
    }

    const classicTrade = createMockTradeWithStatus(
      createMockCurrencyAmount(USDC, '1000'),
      createMockCurrencyAmount(WBTC, '990'),
    ).trade

    it.each([
      {
        name: 'a Relay bridge',
        trade: bridgeTrade(TradingApi.BridgeProvider.RELAY),
        expected: TradingApi.BridgeProvider.RELAY,
      },
      {
        name: 'an Across bridge',
        trade: bridgeTrade(TradingApi.BridgeProvider.ACROSS),
        expected: TradingApi.BridgeProvider.ACROSS,
      },
      {
        name: 'a bridge quote without a provider (Across)',
        trade: bridgeTrade(undefined),
        expected: TradingApi.BridgeProvider.ACROSS,
      },
      { name: 'a classic swap', trade: classicTrade, expected: undefined },
    ])('reports bridge_provider for $name', ({ trade, expected }) => {
      if (!trade) {
        throw new Error('Expected a test trade')
      }

      expect(getBaseTradeAnalyticsProperties({ formatter, trade, trace: {} }).bridge_provider).toBe(expected)
    })
  })
})
