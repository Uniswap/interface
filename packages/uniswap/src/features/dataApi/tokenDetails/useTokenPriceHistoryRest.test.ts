import { waitFor } from '@testing-library/react-native'
import { HistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  toHistoryTarget,
  toRestHistoryDuration,
  useTokenPriceHistoryRest,
} from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const { mockUseFeatureFlag, mockGetGetTokenHistoryPriceQueryOptions } = vi.hoisted(() => ({
  mockUseFeatureFlag: vi.fn(),
  mockGetGetTokenHistoryPriceQueryOptions: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>()),
  getGetTokenHistoryPriceQueryOptions: mockGetGetTokenHistoryPriceQueryOptions,
}))

const CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

const GET_TOKEN_HISTORY_PRICE_RAW_RESPONSE = {
  points: [
    { timestamp: BigInt(100), priceUsd: 1.1 },
    { timestamp: BigInt(200), priceUsd: 2.2 },
  ],
}

describe(useTokenPriceHistoryRest, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mirrors the real query-options builder's contract: queryFn returns raw data, `select`
    // (the actual selectPriceHistoryEntries from the source file) is left for react-query to
    // apply, so that selector gets exercised for real by this test.
    mockGetGetTokenHistoryPriceQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getTokenHistoryPrice'],
      queryFn: () => Promise.resolve(GET_TOKEN_HISTORY_PRICE_RAW_RESPONSE),
      enabled,
      select,
    }))
  })

  describe('V2 off', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(false)
    })

    it('does not fetch REST at all', () => {
      renderHookWithProviders(() => useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.DAY }))

      expect(mockGetGetTokenHistoryPriceQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('returns an empty array', () => {
      const { result } = renderHookWithProviders(() =>
        useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.DAY }),
      )

      expect(result.current).toEqual({ entries: [], isLoading: false })
    })
  })

  describe('V2 on', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true)
    })

    it('returns the REST price history entries from GetTokenHistoryPrice', async () => {
      const { result } = renderHookWithProviders(() =>
        useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.DAY }),
      )

      await waitFor(() => {
        expect(result.current.entries).toEqual([
          { timestamp: 100, value: 1.1 },
          { timestamp: 200, value: 2.2 },
        ])
      })
    })

    it('builds a singleChain target by default', () => {
      renderHookWithProviders(() => useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.DAY }))

      expect(mockGetGetTokenHistoryPriceQueryOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          params: {
            target: { case: 'singleChain', value: { chainId: UniverseChainId.Mainnet, address: expect.any(String) } },
            duration: HistoryDuration.DAY,
          },
        }),
      )
    })

    it('builds a multichain target when isMultichainAggregateView is set', () => {
      renderHookWithProviders(() =>
        useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.DAY, isMultichainAggregateView: true }),
      )

      expect(mockGetGetTokenHistoryPriceQueryOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            target: expect.objectContaining({ case: 'multichain' }),
          }),
        }),
      )
    })

    it('disables the query when preferProjectMarketData is true (no REST equivalent for RWA)', () => {
      renderHookWithProviders(() =>
        useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.DAY, preferProjectMarketData: true }),
      )

      expect(mockGetGetTokenHistoryPriceQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('disables the query when currencyId is undefined', () => {
      renderHookWithProviders(() => useTokenPriceHistoryRest(undefined, { duration: HistoryDuration.DAY }))

      expect(mockGetGetTokenHistoryPriceQueryOptions).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false, params: undefined }),
      )
    })
  })
})

describe(toHistoryTarget, () => {
  it('builds a singleChain target', () => {
    expect(toHistoryTarget({ chainId: UniverseChainId.Mainnet, address: '0xabc', multichain: false })).toEqual({
      case: 'singleChain',
      value: { chainId: UniverseChainId.Mainnet, address: '0xabc' },
    })
  })

  it('builds a multichain target', () => {
    expect(toHistoryTarget({ chainId: UniverseChainId.Mainnet, address: '0xabc', multichain: true })).toEqual({
      case: 'multichain',
      value: { identifier: { case: 'token', value: { chainId: UniverseChainId.Mainnet, address: '0xabc' } } },
    })
  })
})

describe(toRestHistoryDuration, () => {
  it.each([
    [GraphQLApi.HistoryDuration.FiveMinute, HistoryDuration.HOUR],
    [GraphQLApi.HistoryDuration.Hour, HistoryDuration.HOUR],
    [GraphQLApi.HistoryDuration.Day, HistoryDuration.DAY],
    [GraphQLApi.HistoryDuration.Week, HistoryDuration.WEEK],
    [GraphQLApi.HistoryDuration.Month, HistoryDuration.MONTH],
    [GraphQLApi.HistoryDuration.Year, HistoryDuration.YEAR],
    [GraphQLApi.HistoryDuration.Max, HistoryDuration.MAX],
  ])('maps GraphQL %s to REST %s', (graphqlDuration, restDuration) => {
    expect(toRestHistoryDuration(graphqlDuration)).toBe(restDuration)
  })
})
