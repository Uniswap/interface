import { waitFor } from '@testing-library/react-native'
import { BuySellStatsWindow } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { useTokenBuySellStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenBuySellStats'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const { mockGetGetTokenBuySellStatsQueryOptions, mockFetch } = vi.hoisted(() => ({
  mockGetGetTokenBuySellStatsQueryOptions: vi.fn(),
  mockFetch: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>()),
  getGetTokenBuySellStatsQueryOptions: mockGetGetTokenBuySellStatsQueryOptions,
}))

const ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, ADDRESS)

const STATS_RESPONSE = {
  stats: {
    buyCount: 12,
    sellCount: 8,
    buyVolumeUsd: 600,
    sellVolumeUsd: 400,
    uniqueBuyers: 9,
    uniqueSellers: 5,
    buyVolumeTokenAmount: '600',
    sellVolumeTokenAmount: '400',
  },
}

describe(useTokenBuySellStats, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
    mockFetch.mockResolvedValue(STATS_RESPONSE)
    // Mirrors the real builder: params in the key, `select` left for react-query to apply.
    mockGetGetTokenBuySellStatsQueryOptions.mockImplementation(({ params, enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getTokenBuySellStats', params],
      queryFn: () => mockFetch(params),
      enabled: enabled && !!params,
      select,
    }))
  })

  it('returns the mapped stats', async () => {
    const { result } = renderHookWithProviders(() =>
      useTokenBuySellStats(CURRENCY_ID, { window: BuySellStatsWindow.ONE_DAY }),
    )

    await waitFor(() => expect(result.current.data?.totalVolumeUsd).toBe(1000))
    expect(result.current.data?.buys.count).toBe(12)
    expect(result.current.isUnavailable).toBe(false)
  })

  it('scopes a single-network view to the token chain', () => {
    renderHookWithProviders(() => useTokenBuySellStats(CURRENCY_ID, { window: BuySellStatsWindow.ONE_HOUR }))

    expect(mockGetGetTokenBuySellStatsQueryOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          identifier: { case: 'token', value: { chainId: UniverseChainId.Mainnet, address: ADDRESS.toLowerCase() } },
          chainIds: [UniverseChainId.Mainnet],
          window: BuySellStatsWindow.ONE_HOUR,
        },
      }),
    )
  })

  it('scopes the all-networks view to every enabled chain', () => {
    renderHookWithProviders(() =>
      useTokenBuySellStats(CURRENCY_ID, { window: BuySellStatsWindow.ONE_DAY, isMultichainAggregateView: true }),
    )

    const { params } = mockGetGetTokenBuySellStatsQueryOptions.mock.calls[0]![0]
    expect(params.chainIds).toContain(UniverseChainId.Mainnet)
    expect(params.chainIds.length).toBeGreaterThan(1)
  })

  it('refetches when the window changes', async () => {
    const { result, rerender } = renderHookWithProviders(
      ({ window }: { window: BuySellStatsWindow }) => useTokenBuySellStats(CURRENCY_ID, { window }),
      { initialProps: [{ window: BuySellStatsWindow.ONE_DAY }] },
    )
    await waitFor(() => expect(result.current.data).toBeDefined())

    rerender([{ window: BuySellStatsWindow.FOUR_HOURS }])

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(mockFetch).toHaveBeenLastCalledWith(expect.objectContaining({ window: BuySellStatsWindow.FOUR_HOURS }))
  })

  it('keeps the last numbers while a new window loads', async () => {
    const { result, rerender } = renderHookWithProviders(
      ({ window }: { window: BuySellStatsWindow }) => useTokenBuySellStats(CURRENCY_ID, { window }),
      { initialProps: [{ window: BuySellStatsWindow.ONE_DAY }] },
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    mockFetch.mockReturnValue(new Promise(() => {}))

    rerender([{ window: BuySellStatsWindow.FOUR_HOURS }])

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(result.current.data?.totalVolumeUsd).toBe(1000)
  })

  it('does not show the previous token numbers while a new token loads', async () => {
    const { result, rerender } = renderHookWithProviders(
      ({ currencyId }: { currencyId: string }) =>
        useTokenBuySellStats(currencyId, { window: BuySellStatsWindow.ONE_DAY }),
      { initialProps: [{ currencyId: CURRENCY_ID }] },
    )
    await waitFor(() => expect(result.current.data).toBeDefined())
    mockFetch.mockReturnValue(new Promise(() => {}))

    rerender([{ currencyId: buildCurrencyId(UniverseChainId.Base, ADDRESS) }])

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  it('reports unset stats as unavailable, not as an error', async () => {
    mockFetch.mockResolvedValue({})
    const { result } = renderHookWithProviders(() =>
      useTokenBuySellStats(CURRENCY_ID, { window: BuySellStatsWindow.ONE_MONTH }),
    )

    await waitFor(() => expect(result.current.isUnavailable).toBe(true))
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it('reports swaps with neither USD nor token volume as unavailable', async () => {
    mockFetch.mockResolvedValue({
      stats: { ...STATS_RESPONSE.stats, buyVolumeUsd: undefined, buyVolumeTokenAmount: '0' },
    })
    const { result } = renderHookWithProviders(() =>
      useTokenBuySellStats(CURRENCY_ID, { window: BuySellStatsWindow.ONE_HOUR }),
    )

    await waitFor(() => expect(result.current.isUnavailable).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('does not query without a currency id or when skipped', () => {
    renderHookWithProviders(() => useTokenBuySellStats(undefined, { window: BuySellStatsWindow.ONE_DAY }))
    renderHookWithProviders(() => useTokenBuySellStats(CURRENCY_ID, { window: BuySellStatsWindow.ONE_DAY, skip: true }))

    expect(mockGetGetTokenBuySellStatsQueryOptions).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ params: undefined }),
    )
    expect(mockGetGetTokenBuySellStatsQueryOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false }),
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
