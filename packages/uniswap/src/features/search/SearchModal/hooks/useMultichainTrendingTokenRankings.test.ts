import { ConnectError } from '@connectrpc/connect'
import { ChainToken, TokenRankingsStat } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG, CustomRankingType } from '@universe/api'
import { useMultichainTrendingTokenRankings } from 'uniswap/src/features/search/SearchModal/hooks/useMultichainTrendingTokenRankings'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'

const { mockUseTokenRankingsQuery } = vi.hoisted(() => ({
  mockUseTokenRankingsQuery: vi.fn(),
}))

vi.mock('uniswap/src/data/rest/tokenRankings', () => ({
  useTokenRankingsQuery: mockUseTokenRankingsQuery,
}))

function createStat(overrides: Partial<ConstructorParameters<typeof TokenRankingsStat>[0]> = {}): TokenRankingsStat {
  return new TokenRankingsStat({
    chain: 'ETHEREUM',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    logo: 'https://example.com/usdc.png',
    chainTokens: [new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 })],
    ...overrides,
  })
}

const mockRefetch = vi.fn()

describe('useMultichainTrendingTokenRankings', () => {
  beforeEach(() => {
    mockUseTokenRankingsQuery.mockReset()
  })

  it('should pass ALL_NETWORKS and multichain:true to useTokenRankingsQuery', () => {
    mockUseTokenRankingsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useMultichainTrendingTokenRankings({ pageSize: 8, skip: false }))

    expect(mockUseTokenRankingsQuery).toHaveBeenCalledWith({ chainId: ALL_NETWORKS_ARG, multichain: true }, true)
  })

  it('should disable the query when skip is true', () => {
    mockUseTokenRankingsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    renderHook(() => useMultichainTrendingTokenRankings({ pageSize: 8, skip: true }))

    expect(mockUseTokenRankingsQuery).toHaveBeenCalledWith({ chainId: ALL_NETWORKS_ARG, multichain: true }, false)
  })

  it('should return loading state when query is loading', async () => {
    mockUseTokenRankingsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useMultichainTrendingTokenRankings({ pageSize: 8, skip: false }))

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should return undefined data when no trending tokens exist', async () => {
    mockUseTokenRankingsQuery.mockReturnValue({
      data: { tokenRankings: {} },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useMultichainTrendingTokenRankings({ pageSize: 8, skip: false }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should transform trending tokens into MultichainSearchResult[]', async () => {
    const stat1 = createStat({
      chain: 'ETHEREUM',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      name: 'Token A',
      symbol: 'TKNA',
      chainTokens: [
        new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 18 }),
      ],
    })
    const stat2 = createStat({
      chain: 'ETHEREUM',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      name: 'Token B',
      symbol: 'TKNB',
      chainTokens: [
        new ChainToken({ chainId: 1, address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 }),
      ],
    })

    mockUseTokenRankingsQuery.mockReturnValue({
      data: {
        tokenRankings: {
          [CustomRankingType.Trending]: { tokens: [stat1, stat2] },
        },
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useMultichainTrendingTokenRankings({ pageSize: 8, skip: false }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0]?.symbol).toBe('TKNA')
      expect(result.current.data?.[1]?.symbol).toBe('TKNB')
    })
  })

  it('should slice results to pageSize', async () => {
    const stats = Array.from({ length: 5 }, (_, i) =>
      createStat({
        chain: 'ETHEREUM',
        address: `0x${String(i).padStart(40, '0')}`,
        name: `Token ${i}`,
        symbol: `TKN${i}`,
        chainTokens: [new ChainToken({ chainId: 1, address: `0x${String(i).padStart(40, '0')}`, decimals: 18 })],
      }),
    )

    mockUseTokenRankingsQuery.mockReturnValue({
      data: {
        tokenRankings: {
          [CustomRankingType.Trending]: { tokens: stats },
        },
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useMultichainTrendingTokenRankings({ pageSize: 3, skip: false }))

    await waitFor(() => {
      expect(result.current.data).toHaveLength(3)
    })
  })

  it('should filter out stats with empty chainTokens', async () => {
    const validStat = createStat({
      chain: 'ETHEREUM',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      name: 'Valid',
      symbol: 'VLD',
      chainTokens: [
        new ChainToken({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 18 }),
      ],
    })
    const emptyStat = createStat({
      chain: 'ETHEREUM',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      name: 'Empty',
      symbol: 'EMP',
      chainTokens: [],
    })

    mockUseTokenRankingsQuery.mockReturnValue({
      data: {
        tokenRankings: {
          [CustomRankingType.Trending]: { tokens: [validStat, emptyStat] },
        },
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useMultichainTrendingTokenRankings({ pageSize: 8, skip: false }))

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0]?.symbol).toBe('VLD')
    })
  })

  it('should return error from the query', async () => {
    const queryError = new ConnectError('network failure')

    mockUseTokenRankingsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: queryError,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useMultichainTrendingTokenRankings({ pageSize: 8, skip: false }))

    await waitFor(() => {
      expect(result.current.error).toBe(queryError)
      expect(result.current.data).toBeUndefined()
    })
  })

  it('should expose refetch from the query', async () => {
    mockUseTokenRankingsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useMultichainTrendingTokenRankings({ pageSize: 8, skip: false }))

    await waitFor(() => {
      expect(result.current.refetch).toBe(mockRefetch)
    })
  })
})
