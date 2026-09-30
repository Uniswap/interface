import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native'
import { GetTokenHistoryPriceResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration as RestHistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { createElement, type PropsWithChildren } from 'react'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import {
  toHistoryTarget,
  toRestHistoryDuration,
  useTokenPriceHistoryRest,
} from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getTokenHistoryPrice: vi.fn() },
}))

const CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

const GET_TOKEN_HISTORY_PRICE_RAW_RESPONSE = new GetTokenHistoryPriceResponse({
  points: [
    { timestamp: BigInt(100), priceUsd: 1.1 },
    { timestamp: BigInt(200), priceUsd: 2.2 },
  ],
})

const mockGetTokenHistoryPrice = vi.mocked(dataApiServiceClientV2.getTokenHistoryPrice)

describe(useTokenPriceHistoryRest, () => {
  let queryClient: QueryClient

  function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockGetTokenHistoryPrice.mockReset().mockResolvedValue(GET_TOKEN_HISTORY_PRICE_RAW_RESPONSE)
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
    onlineManager.setOnline(true)
  })

  it('returns the REST price history entries from GetTokenHistoryPrice', async () => {
    const { result } = renderHook(() => useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.Day }), {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(result.current.entries).toEqual([
        { timestamp: 100, value: 1.1 },
        { timestamp: 200, value: 2.2 },
      ])
    })
  })

  it('shows the skeleton instead of the previous period while a newly selected period loads', async () => {
    const { result, rerender } = renderHook(
      (duration: HistoryDuration) => useTokenPriceHistoryRest(CURRENCY_ID, { duration }),
      { initialProps: HistoryDuration.Day, wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.entries).toHaveLength(2))
    expect(result.current.isLoading).toBe(false)

    mockGetTokenHistoryPrice.mockReturnValueOnce(new Promise<never>(() => {}))
    rerender(HistoryDuration.Week)

    expect(mockGetTokenHistoryPrice).toHaveBeenCalledTimes(2)
    expect(result.current).toEqual({ entries: [], isLoading: true, error: null })
  })

  it('keeps loading for a duration switch paused offline and resolves on reconnect', async () => {
    const { result, rerender } = renderHook(
      (duration: HistoryDuration) => useTokenPriceHistoryRest(CURRENCY_ID, { duration }),
      { initialProps: HistoryDuration.Day, wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.entries).toHaveLength(2))
    expect(result.current.isLoading).toBe(false)
    expect(mockGetTokenHistoryPrice).toHaveBeenCalledTimes(1)

    act(() => onlineManager.setOnline(false))
    rerender(HistoryDuration.Week)

    expect(result.current).toEqual({ entries: [], isLoading: true, error: null })
    expect(mockGetTokenHistoryPrice).toHaveBeenCalledTimes(1)

    act(() => onlineManager.setOnline(true))
    await waitFor(() => expect(result.current.entries).toHaveLength(2))
    expect(result.current.isLoading).toBe(false)
    expect(mockGetTokenHistoryPrice).toHaveBeenCalledTimes(2)
  })

  it('keeps cached entries visible while refreshing in the background', async () => {
    const firstRender = renderHook(() => useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.Day }), {
      wrapper: Wrapper,
    })
    await waitFor(() => expect(firstRender.result.current.entries).toHaveLength(2))
    const cachedEntries = firstRender.result.current.entries
    firstRender.unmount()
    await queryClient.invalidateQueries()

    mockGetTokenHistoryPrice.mockResolvedValueOnce(
      new GetTokenHistoryPriceResponse({ points: [{ timestamp: BigInt(300), priceUsd: 3.3 }] }),
    )
    const { result } = renderHook(() => useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.Day }), {
      wrapper: Wrapper,
    })

    expect(mockGetTokenHistoryPrice).toHaveBeenCalledTimes(2)
    expect(result.current).toEqual({ entries: cachedEntries, isLoading: false, error: null })
    await waitFor(() => expect(result.current.entries).toEqual([{ timestamp: 300, value: 3.3 }]))
    expect(result.current.isLoading).toBe(false)
  })

  it('requests a singleChain target by default', () => {
    renderHook(() => useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.Day }), {
      wrapper: Wrapper,
    })

    expect(mockGetTokenHistoryPrice).toHaveBeenCalledWith({
      target: { case: 'singleChain', value: { chainId: UniverseChainId.Mainnet, address: expect.any(String) } },
      duration: RestHistoryDuration.DAY,
    })
  })

  it('requests a multichain target when isMultichainAggregateView is set', () => {
    renderHook(
      () => useTokenPriceHistoryRest(CURRENCY_ID, { duration: HistoryDuration.Day, isMultichainAggregateView: true }),
      { wrapper: Wrapper },
    )

    expect(mockGetTokenHistoryPrice).toHaveBeenCalledWith({
      target: {
        case: 'multichain',
        value: {
          identifier: {
            case: 'token',
            value: { chainId: UniverseChainId.Mainnet, address: expect.any(String) },
          },
        },
      },
      duration: RestHistoryDuration.DAY,
    })
  })

  it('disables the query when currencyId is undefined', () => {
    const { result } = renderHook(() => useTokenPriceHistoryRest(undefined, { duration: HistoryDuration.Day }), {
      wrapper: Wrapper,
    })

    expect(result.current).toEqual({ entries: [], isLoading: false, error: null })
    expect(mockGetTokenHistoryPrice).not.toHaveBeenCalled()
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
    [HistoryDuration.Hour, RestHistoryDuration.HOUR],
    [HistoryDuration.Day, RestHistoryDuration.DAY],
    [HistoryDuration.Week, RestHistoryDuration.WEEK],
    [HistoryDuration.Month, RestHistoryDuration.MONTH],
    [HistoryDuration.Year, RestHistoryDuration.YEAR],
    [HistoryDuration.Max, RestHistoryDuration.MAX],
  ])('maps %s to REST %s', (duration, restDuration) => {
    expect(toRestHistoryDuration(duration)).toBe(restDuration)
  })
})
