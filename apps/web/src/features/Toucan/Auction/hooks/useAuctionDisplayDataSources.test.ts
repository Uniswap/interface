import { skipToken, useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { EVMUniverseChainId, UniverseChainId } from '@universe/chains'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { viemClients } from 'uniswap/src/features/providers/viemClients'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useAuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { CurrentBlockState } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { useV2ListTokenPools } from '~/pages/Explore/hooks/useV2ListTokenPools'

vi.mock('@tanstack/react-query', async () => ({
  ...(await vi.importActual('@tanstack/react-query')),
  useQuery: vi.fn(),
}))

vi.mock('uniswap/src/features/providers/viemClients', () => ({
  viemClients: { getViemClient: vi.fn() },
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries', () => ({
  auctionQueries: { getLatestCheckpoint: vi.fn((options) => ({ ...options, queryKey: ['checkpoint'] })) },
}))

vi.mock('~/pages/Explore/hooks/useV2ListTokenPools')

const mockUseQuery = vi.mocked(useQuery)
const mockUseBlockQuery = vi.fn<typeof useQuery>()
const mockUseCheckpointQuery = vi.fn<typeof useQuery>()
const mockGetViemClient = vi.mocked(viemClients.getViemClient, { partial: true })
const mockGetBlockNumber = vi.fn()
const mockGetLatestCheckpoint = vi.mocked(auctionQueries.getLatestCheckpoint)
const mockUseV2ListTokenPools = vi.mocked(useV2ListTokenPools)

const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'
const AUCTION_ADDRESS = '0x2222222222222222222222222222222222222222'
const mockRefetchPools = vi.fn()

function renderSources(
  enabled = true,
  overrides: {
    chainId?: EVMUniverseChainId
    startBlock?: string
    endBlock?: string
    tokenAddress?: string
    auctionAddress?: string
    currentBlock?: CurrentBlockState
    watchUntilBlock?: bigint
  } = {},
) {
  return renderHook(() =>
    useAuctionDisplayDataSources({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: TOKEN_ADDRESS,
      auctionAddress: AUCTION_ADDRESS,
      startBlock: '10',
      endBlock: '100',
      enabled,
      ...overrides,
    }),
  )
}

function getPollingInterval(blockNumber: bigint | undefined): number | false | undefined {
  const refetchInterval = mockUseBlockQuery.mock.lastCall?.[0]?.refetchInterval
  if (typeof refetchInterval !== 'function') {
    throw new Error('Expected an adaptive block polling interval')
  }
  return refetchInterval({ state: { data: blockNumber } } as Parameters<typeof refetchInterval>[0])
}

describe('useAuctionDisplayDataSources', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseV2ListTokenPools.mockReturnValue({
      pools: undefined,
      rawPoolCount: undefined,
      isLoading: true,
      isSuccess: false,
      isFetchedAfterMount: false,
      refetch: mockRefetchPools,
      isError: false,
      loadMore: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })
    mockGetViemClient.mockReturnValue({ getBlockNumber: mockGetBlockNumber })
    mockGetBlockNumber.mockResolvedValue(100n)
    mockUseBlockQuery.mockReturnValue({ data: undefined, isError: false } as ReturnType<typeof useQuery>)
    mockUseCheckpointQuery.mockReturnValue({ isSuccess: false, isFetchedAfterMount: false } as ReturnType<
      typeof useQuery
    >)
    mockUseQuery.mockImplementation((options) =>
      options.queryKey[0] === ReactQueryCacheKey.BlockNumber
        ? mockUseBlockQuery(options)
        : mockUseCheckpointQuery(options),
    )
  })

  it('uses one V2/V3/V4 token-pools query', () => {
    renderSources()

    expect(mockUseV2ListTokenPools).toHaveBeenCalledOnce()
    expect(mockUseV2ListTokenPools).toHaveBeenCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: TOKEN_ADDRESS,
      isNative: false,
      sortState: { sortBy: 'TVL', sortDirection: 'desc' },
      enabled: true,
    })
  })

  it('only reports NO_POOL input after a successful empty response', () => {
    mockUseV2ListTokenPools.mockReturnValue({
      pools: [],
      rawPoolCount: 0,
      isLoading: true,
      isSuccess: false,
      isFetchedAfterMount: false,
      refetch: mockRefetchPools,
      isError: false,
      loadMore: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })
    const loadingWithCachedEmptyData = renderSources()
    expect(loadingWithCachedEmptyData.result.current.pools).toEqual({ status: 'loading' })

    mockUseV2ListTokenPools.mockReturnValue({
      pools: [],
      rawPoolCount: 0,
      isLoading: false,
      isSuccess: true,
      isFetchedAfterMount: true,
      refetch: mockRefetchPools,
      isError: false,
      loadMore: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })
    const successfulEmpty = renderSources()
    expect(successfulEmpty.result.current.pools).toEqual({ status: 'success', poolCount: 0 })
  })

  it('keeps pool errors distinct from cached empty data', () => {
    mockUseV2ListTokenPools.mockReturnValue({
      pools: [],
      rawPoolCount: 0,
      isLoading: false,
      isSuccess: false,
      isFetchedAfterMount: false,
      refetch: mockRefetchPools,
      isError: true,
      loadMore: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    const { result } = renderSources()

    expect(result.current.pools).toEqual({ status: 'error' })
  })

  it('does not treat raw rows that fail normalization as an empty response', () => {
    mockUseV2ListTokenPools.mockReturnValue({
      pools: [],
      rawPoolCount: 1,
      isLoading: false,
      isSuccess: true,
      isFetchedAfterMount: true,
      refetch: mockRefetchPools,
      isError: false,
      loadMore: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as ReturnType<typeof useV2ListTokenPools>)

    const { result } = renderSources()

    expect(result.current.pools).toEqual({ status: 'success', poolCount: 1 })
  })

  it('refreshes cached pools on mount and at auction end without polling them', () => {
    mockUseBlockQuery.mockReturnValue({ data: 99n, isError: false } as ReturnType<typeof useQuery>)
    const { rerender } = renderSources()

    expect(mockRefetchPools).toHaveBeenCalledExactlyOnceWith({ cancelRefetch: false })
    rerender()
    expect(mockRefetchPools).toHaveBeenCalledTimes(1)

    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
    rerender()
    expect(mockRefetchPools).toHaveBeenCalledTimes(2)
    expect(mockRefetchPools).toHaveBeenLastCalledWith({ cancelRefetch: false })

    mockUseBlockQuery.mockReturnValue({ data: 101n, isError: false } as ReturnType<typeof useQuery>)
    rerender()
    expect(mockRefetchPools).toHaveBeenCalledTimes(2)
  })

  it('does not treat crossing the end block as an auction end with an invalid start block', () => {
    mockUseBlockQuery.mockReturnValue({ data: 99n, isError: false } as ReturnType<typeof useQuery>)
    const { rerender } = renderSources(true, { startBlock: '-1' })

    expect(mockRefetchPools).toHaveBeenCalledTimes(1)

    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
    rerender()

    expect(mockRefetchPools).toHaveBeenCalledTimes(1)
  })

  it('does not duplicate the mount refresh when the auction has already ended', () => {
    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)

    const { rerender } = renderSources()

    expect(mockRefetchPools).toHaveBeenCalledExactlyOnceWith({ cancelRefetch: false })

    mockUseBlockQuery.mockReturnValue({ data: 101n, isError: false } as ReturnType<typeof useQuery>)
    rerender()

    expect(mockRefetchPools).toHaveBeenCalledTimes(1)
  })

  it('waits for a mounted pool fetch before trusting a hydrated empty response', () => {
    const cachedPools = {
      pools: [],
      rawPoolCount: 0,
      isLoading: false,
      isSuccess: true,
      isFetchedAfterMount: false,
      isError: false,
      refetch: mockRefetchPools,
      loadMore: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    }
    mockUseV2ListTokenPools.mockReturnValue(cachedPools)
    const { result, rerender } = renderSources()

    expect(result.current.pools).toEqual({ status: 'loading' })
    expect(mockRefetchPools).toHaveBeenCalledExactlyOnceWith({ cancelRefetch: false })

    mockUseV2ListTokenPools.mockReturnValue({ ...cachedPools, isFetchedAfterMount: true })
    rerender()
    expect(result.current.pools).toEqual({ status: 'success', poolCount: 0 })
  })

  it('keeps a failed pool refresh distinct from the hydrated empty response', () => {
    mockUseV2ListTokenPools.mockReturnValue({
      pools: [],
      rawPoolCount: 0,
      isLoading: false,
      isSuccess: false,
      isFetchedAfterMount: true,
      isError: true,
      refetch: mockRefetchPools,
      loadMore: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    const { result } = renderSources()

    expect(result.current.pools).toEqual({ status: 'error' })
  })

  it('preserves current-block loading, error, and success', () => {
    const loading = renderSources()
    expect(loading.result.current.currentBlock).toEqual({ status: 'loading' })

    mockUseBlockQuery.mockReturnValue({ isError: true } as ReturnType<typeof useQuery>)
    const error = renderSources()
    expect(error.result.current.currentBlock).toEqual({ status: 'error' })

    mockUseBlockQuery.mockReturnValue({ data: 123n, isError: false } as ReturnType<typeof useQuery>)
    const success = renderSources()
    expect(success.result.current.currentBlock).toEqual({ status: 'success', blockNumber: 123n })
  })

  it('reads an uncached chain head from the auction chain viem client', async () => {
    renderSources(true, { chainId: UniverseChainId.ArbitrumOne })

    expect(mockUseBlockQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryKey: [ReactQueryCacheKey.BlockNumber, { chainId: UniverseChainId.ArbitrumOne }],
        enabled: true,
      }),
    )
    const queryFn = mockUseBlockQuery.mock.lastCall?.[0].queryFn
    if (typeof queryFn !== 'function') {
      throw new Error('Expected a chain-head query function')
    }

    await expect(queryFn({} as Parameters<typeof queryFn>[0])).resolves.toBe(100n)

    expect(mockGetViemClient).toHaveBeenCalledExactlyOnceWith(UniverseChainId.ArbitrumOne)
    expect(mockGetBlockNumber).toHaveBeenCalledExactlyOnceWith({ cacheTime: 0 })
  })

  it.each<CurrentBlockState>([{ status: 'loading' }, { status: 'error' }, { status: 'success', blockNumber: 100n }])(
    'uses the supplied block state without another chain query ($status)',
    (currentBlock) => {
      mockUseBlockQuery.mockReturnValue({ data: 200n, isError: false } as ReturnType<typeof useQuery>)

      const { result } = renderSources(true, { currentBlock })

      expect(result.current.currentBlock).toEqual(currentBlock)
      expect(mockUseBlockQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: false, queryFn: skipToken }),
      )
      expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: currentBlock.status === 'success' }),
      )
      expect(mockGetViemClient).not.toHaveBeenCalled()
    },
  )

  it('refreshes terminal data when the supplied block reaches auction end', () => {
    const { rerender, result } = renderHook(
      ({ currentBlock }: { currentBlock: CurrentBlockState }) =>
        useAuctionDisplayDataSources({
          chainId: UniverseChainId.Mainnet,
          tokenAddress: TOKEN_ADDRESS,
          auctionAddress: AUCTION_ADDRESS,
          startBlock: '10',
          endBlock: '100',
          enabled: true,
          currentBlock,
        }),
      { initialProps: { currentBlock: { status: 'success', blockNumber: 99n } as CurrentBlockState } },
    )

    expect(result.current.currencyRaised).toEqual({ status: 'idle' })
    expect(mockRefetchPools).toHaveBeenCalledTimes(1)

    rerender({ currentBlock: { status: 'success', blockNumber: 100n } })

    expect(result.current.currencyRaised).toEqual({ status: 'loading' })
    expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
    expect(mockRefetchPools).toHaveBeenCalledTimes(2)
    expect(mockUseBlockQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false, queryFn: skipToken }))
  })

  it('keeps a fetched block through a transient refetch error', () => {
    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: true } as ReturnType<typeof useQuery>)

    const { result } = renderSources()

    // Retained block data survives the failed refetch: the phase holds and the checkpoint read stays enabled.
    expect(result.current.currentBlock).toEqual({ status: 'success', blockNumber: 100n })
    expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
    expect(result.current.currencyRaised).toEqual({ status: 'loading' })
  })

  it.each<CurrentBlockState>([{ status: 'loading' }, { status: 'error' }, { status: 'success', blockNumber: 50n }])(
    'uses a supplied block state without reading or watching the chain head: $status',
    (currentBlock) => {
      mockUseBlockQuery.mockReturnValue({ data: 999n, isError: false } as ReturnType<typeof useQuery>)

      const { result } = renderSources(true, { currentBlock })

      expect(mockUseBlockQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
      )
      expect(result.current.currentBlock).toEqual(currentBlock)
      expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
      expect(result.current.currencyRaised).toEqual({ status: 'idle' })
    },
  )

  it('fetches a fresh terminal checkpoint when the supplied block reaches the end', () => {
    mockUseBlockQuery.mockReturnValue({ data: 1n, isError: false } as ReturnType<typeof useQuery>)
    const { result, rerender } = renderHook(
      ({ blockNumber }) =>
        useAuctionDisplayDataSources({
          chainId: UniverseChainId.Mainnet,
          tokenAddress: TOKEN_ADDRESS,
          auctionAddress: AUCTION_ADDRESS,
          startBlock: '10',
          endBlock: '100',
          enabled: true,
          currentBlock: { status: 'success', blockNumber },
        }),
      { initialProps: { blockNumber: 99n } },
    )

    expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))

    mockUseCheckpointQuery.mockReturnValue({
      isSuccess: true,
      isFetchedAfterMount: false,
      data: { currencyRaised: '100' },
    } as ReturnType<typeof useQuery>)
    rerender({ blockNumber: 100n })

    expect(mockUseBlockQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    )
    expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith({
      params: expect.objectContaining({ chainId: UniverseChainId.Mainnet, address: AUCTION_ADDRESS }),
      enabled: true,
      staleTime: 0,
    })
    expect(result.current.currencyRaised).toEqual({ status: 'loading' })

    mockUseCheckpointQuery.mockReturnValue({
      isSuccess: true,
      isFetchedAfterMount: true,
      data: { currencyRaised: '500' },
    } as ReturnType<typeof useQuery>)
    rerender({ blockNumber: 100n })

    expect(result.current.currencyRaised).toEqual({ status: 'success', currencyRaised: '500' })
  })

  it('keeps requests disabled with a supplied post-end block when the feature is off', () => {
    const { result } = renderSources(false, { currentBlock: { status: 'success', blockNumber: 100n } })

    expect(mockUseV2ListTokenPools).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
    expect(mockUseBlockQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    )
    expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
    expect(result.current.currentBlock).toEqual({ status: 'loading' })
    expect(result.current.currencyRaised).toEqual({ status: 'idle' })
  })

  it('derives the polling cadence from cached blocks without waiting for a render', () => {
    renderSources()

    expect(getPollingInterval(undefined)).toBe(120_000)
    expect(getPollingInterval(50n)).toBe(120_000)
    expect(getPollingInterval(95n)).toBe(12_000)
    expect(getPollingInterval(100n)).toBe(false)
  })

  it.each([
    { startBlock: undefined },
    { startBlock: 'invalid' },
    { startBlock: '-1' },
    { endBlock: undefined },
    { endBlock: 'invalid' },
    { endBlock: '-1' },
  ])('does not poll the chain head with invalid block bounds %#', (overrides) => {
    mockUseBlockQuery.mockReturnValue({ data: 50n, isError: false } as ReturnType<typeof useQuery>)

    const { result } = renderSources(true, overrides)

    expect(mockUseBlockQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
    expect(getPollingInterval(50n)).toBe(false)
    expect(result.current.currentBlock).toEqual({ status: 'success', blockNumber: 50n })
  })

  it.each([{ startBlock: undefined }, { endBlock: undefined }])(
    'still polls toward a sibling ceiling when the primary auction has no usable bounds %#',
    (overrides) => {
      mockUseBlockQuery.mockReturnValue({ data: 50n, isError: false } as ReturnType<typeof useQuery>)

      renderSources(true, { ...overrides, watchUntilBlock: 300n })

      expect(getPollingInterval(50n)).toBe(120_000)
      expect(getPollingInterval(295n)).toBe(12_000)
      expect(getPollingInterval(300n)).toBe(false)
    },
  )

  it('polls the chain head slowly away from a phase boundary', () => {
    mockUseBlockQuery.mockReturnValue({ data: 50n, isError: false } as ReturnType<typeof useQuery>)

    renderSources()

    // 50 blocks to the end is outside the fast window at any chain block time.
    expect(getPollingInterval(50n)).toBe(120_000)
  })

  it('polls at chain speed near the end block', () => {
    mockUseBlockQuery.mockReturnValue({ data: 95n, isError: false } as ReturnType<typeof useQuery>)

    renderSources()

    expect(getPollingInterval(95n)).toBe(12_000)
  })

  it('polls at chain speed near the start block while upcoming', () => {
    mockUseBlockQuery.mockReturnValue({ data: 6n, isError: false } as ReturnType<typeof useQuery>)

    renderSources()

    expect(getPollingInterval(6n)).toBe(12_000)
  })

  it('reads currencyRaised from the response', () => {
    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
    mockUseCheckpointQuery.mockReturnValue({
      isSuccess: true,
      isFetchedAfterMount: true,
      data: { currencyRaised: '500' },
    } as ReturnType<typeof useQuery>)

    const { result } = renderSources()

    expect(result.current.currencyRaised).toEqual({
      status: 'success',
      currencyRaised: '500',
    })
  })

  it('fetches the terminal checkpoint when LIVE becomes ENDED', () => {
    mockUseBlockQuery.mockReturnValue({ data: 99n, isError: false } as ReturnType<typeof useQuery>)
    const { rerender, result } = renderSources()

    // Keyed on the auction even while disabled, so a sibling fan-out cannot collide on one key.
    expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith({
      params: expect.objectContaining({ chainId: UniverseChainId.Mainnet, address: AUCTION_ADDRESS }),
      enabled: false,
      staleTime: 0,
    })
    expect(result.current.currencyRaised).toEqual({ status: 'idle' })

    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
    mockUseCheckpointQuery.mockReturnValue({
      isSuccess: true,
      isFetchedAfterMount: true,
      data: { currencyRaised: '500' },
    } as ReturnType<typeof useQuery>)
    rerender()

    expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith({
      params: expect.objectContaining({ chainId: UniverseChainId.Mainnet, address: AUCTION_ADDRESS }),
      enabled: true,
      staleTime: 0,
    })
    expect(result.current.currencyRaised).toEqual({
      status: 'success',
      currencyRaised: '500',
    })
  })

  it('waits for the terminal checkpoint refetch before using cached data', () => {
    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
    mockUseCheckpointQuery.mockReturnValue({
      isSuccess: true,
      isFetching: true,
      isFetchedAfterMount: false,
      data: { currencyRaised: '100' },
    } as ReturnType<typeof useQuery>)
    const { rerender, result } = renderSources()

    expect(result.current.currencyRaised).toEqual({ status: 'loading' })

    mockUseCheckpointQuery.mockReturnValue({
      isSuccess: true,
      isFetching: false,
      isFetchedAfterMount: true,
      data: { currencyRaised: '500' },
    } as ReturnType<typeof useQuery>)
    rerender()

    expect(result.current.currencyRaised).toEqual({
      status: 'success',
      currencyRaised: '500',
    })
  })

  it('keeps the terminal checkpoint during later refetches', () => {
    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
    mockUseCheckpointQuery.mockReturnValue({
      isSuccess: true,
      isFetching: true,
      isFetchedAfterMount: true,
      data: { currencyRaised: '500' },
    } as ReturnType<typeof useQuery>)

    const { result } = renderSources()

    expect(result.current.currencyRaised).toEqual({
      status: 'success',
      currencyRaised: '500',
    })
  })

  it('preserves checkpoint errors', () => {
    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
    mockUseCheckpointQuery.mockReturnValue({
      isError: true,
      isFetchedAfterMount: true,
    } as ReturnType<typeof useQuery>)

    const { result } = renderSources()

    expect(result.current.currencyRaised).toEqual({ status: 'error' })
  })

  it('rejects retained pre-end checkpoint data when the post-end refetch fails', () => {
    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
    mockUseCheckpointQuery.mockReturnValue({
      isSuccess: false,
      isError: true,
      isFetchedAfterMount: true,
      data: { currencyRaised: '100' },
    } as ReturnType<typeof useQuery>)

    const { result } = renderSources()

    expect(result.current.currencyRaised).toEqual({ status: 'error' })
  })

  it.each([undefined, ''])(
    'reads checkpoints without requesting pools when the token address is absent (%s)',
    (tokenAddress) => {
      mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
      mockUseCheckpointQuery.mockReturnValue({
        isSuccess: true,
        isFetchedAfterMount: true,
        data: { currencyRaised: '500' },
      } as ReturnType<typeof useQuery>)

      const { result } = renderSources(true, { tokenAddress })

      expect(mockUseV2ListTokenPools).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
      expect(mockRefetchPools).not.toHaveBeenCalled()
      expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith({
        params: { chainId: UniverseChainId.Mainnet, address: AUCTION_ADDRESS },
        enabled: true,
        staleTime: 0,
      })
      expect(result.current.currencyRaised).toEqual({ status: 'success', currencyRaised: '500' })
    },
  )

  it.each([undefined, ''])('keeps checkpoint reads disabled without an auction address (%s)', (auctionAddress) => {
    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)

    const { result } = renderSources(true, { auctionAddress })

    expect(mockGetLatestCheckpoint).toHaveBeenLastCalledWith({
      params: undefined,
      enabled: false,
      staleTime: 0,
    })
    expect(result.current.currencyRaised).toEqual({ status: 'idle' })
  })

  it('does not read a chain head without the auction chain', () => {
    const { result } = renderSources(true, { chainId: undefined })

    expect(mockUseBlockQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false, queryFn: skipToken }))
    expect(mockGetViemClient).not.toHaveBeenCalled()
    expect(result.current.currentBlock).toEqual({ status: 'loading' })
  })

  it('disables every request when its caller gates the feature off', () => {
    const { result } = renderSources(false)

    expect(mockUseV2ListTokenPools).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    expect(mockRefetchPools).not.toHaveBeenCalled()
    expect(mockUseBlockQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false, queryFn: skipToken }))
    expect(mockGetLatestCheckpoint).toHaveBeenCalledWith({
      params: expect.objectContaining({ chainId: UniverseChainId.Mainnet, address: AUCTION_ADDRESS }),
      enabled: false,
      staleTime: 0,
    })
    expect(result.current).toEqual({
      currentBlock: { status: 'loading' },
      currencyRaised: { status: 'idle' },
      pools: { status: 'loading' },
      refetchCurrentBlock: expect.any(Function),
      refetchCheckpoint: expect.any(Function),
    })
  })

  it('refetches the checkpoint on demand only while its query is enabled', () => {
    const mockRefetchCheckpoint = vi.fn()
    mockUseBlockQuery.mockReturnValue({ data: 100n, isError: false } as ReturnType<typeof useQuery>)
    mockUseCheckpointQuery.mockReturnValue({ refetch: mockRefetchCheckpoint } as unknown as ReturnType<typeof useQuery>)

    renderSources(true).result.current.refetchCheckpoint()
    expect(mockRefetchCheckpoint).toHaveBeenCalledOnce()

    renderSources(false).result.current.refetchCheckpoint()
    expect(mockRefetchCheckpoint).toHaveBeenCalledOnce()
  })

  it('keeps polling through the claim boundary and stops there', () => {
    mockUseBlockQuery.mockReturnValue({ data: 110n, isError: false } as ReturnType<typeof useQuery>)
    renderSources(true, { watchUntilBlock: 300n })

    expect(getPollingInterval(95n)).toBe(12_000)
    expect(getPollingInterval(110n)).toBe(120_000)
    expect(getPollingInterval(295n)).toBe(12_000)
    expect(getPollingInterval(300n)).toBe(false)
  })
})
