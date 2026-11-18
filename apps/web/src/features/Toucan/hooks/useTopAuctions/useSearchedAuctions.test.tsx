import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { AuctionLifecycle, SearchAuction, SearchType } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import {
  Auction,
  AuctionLookupStatus,
  AuctionStatusFilter,
  GetAuctionResponse,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { AuctionServiceClient } from 'uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient'
import { useSearchedAuctions } from '~/features/Toucan/hooks/useTopAuctions/useSearchedAuctions'
import store from '~/state'

const { mockUseSearchResults } = vi.hoisted(() => ({ mockUseSearchResults: vi.fn() }))

vi.mock('uniswap/src/features/dataApi/searchResults', () => ({ useSearchResults: mockUseSearchResults }))

vi.mock('~/utils/params/chainParams', () => ({ useChainIdFromUrlParam: () => undefined }))

vi.mock('uniswap/src/features/toucan/useVerifiedAuctionIds', () => {
  const noVerifiedAuctionIds: string[] = []
  return { useVerifiedAuctionIds: () => noVerifiedAuctionIds }
})

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => {
  const noCurrencyInfos: never[] = []
  return { useCurrencyInfos: () => noCurrencyInfos }
})

vi.mock('~/features/Toucan/hooks/useTopAuctions/useMultiChainBlockInfo', () => {
  const mainnetChainId = 1
  const blockInfo = {
    blocksByChain: new Map([[mainnetChainId, { number: 1_000n, timestamp: 0n }]]),
    pendingChainIds: new Set<number>(),
  }
  return { useMultiChainBlockInfo: () => blockInfo }
})

const MAINNET_CHAIN_ID = 1
const FIRST_ADDRESS = `0x${'a'.repeat(40)}`
const SECOND_ADDRESS = `0x${'b'.repeat(40)}`
const UNINDEXED_ADDRESS = `0x${'c'.repeat(40)}`

function searchAuction(address: string, lifecycle = AuctionLifecycle.UNSPECIFIED): SearchAuction {
  return new SearchAuction({
    auctionId: `${MAINNET_CHAIN_ID}_${address}`,
    chainId: MAINNET_CHAIN_ID,
    auctionAddress: address,
    lifecycle,
  })
}

function foundAuction({ address, chainId }: { address: string; chainId: number }): GetAuctionResponse {
  return new GetAuctionResponse({
    auctions: [
      new Auction({ auctionId: `${chainId}_${address}`, chainId, address, startBlock: '1', endBlock: '2000' }),
    ],
    lookupStatus: AuctionLookupStatus.COMPLETE,
  })
}

function mockSearch(auctions: SearchAuction[]): void {
  mockUseSearchResults.mockReturnValue({ data: { auctions }, isLoading: false, isError: false })
}

function renderSearchedAuctions(
  searchQuery: string | undefined,
  filters: { liveOnly?: boolean; statusFilter?: AuctionStatusFilter } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  )
  return { ...renderHook(() => useSearchedAuctions({ searchQuery, ...filters }), { wrapper }), queryClient }
}

describe(useSearchedAuctions, () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hydrates auction search matches in rank order, dropping one GetAuction cannot find', async () => {
    mockSearch([searchAuction(SECOND_ADDRESS), searchAuction(UNINDEXED_ADDRESS), searchAuction(FIRST_ADDRESS)])
    vi.spyOn(AuctionServiceClient, 'getAuction').mockImplementation(async (params) =>
      params.address === UNINDEXED_ADDRESS
        ? new GetAuctionResponse({ auctions: [], lookupStatus: AuctionLookupStatus.COMPLETE })
        : foundAuction(params),
    )

    const { result } = renderSearchedAuctions('lau')
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockUseSearchResults).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: 'lau',
        chainFilter: null,
        types: [SearchType.AUCTION],
        skip: false,
        size: 100,
      }),
    )
    expect(result.current.auctions.map((row) => row.auction?.address)).toEqual([SECOND_ADDRESS, FIRST_ADDRESS])
    expect(result.current.isError).toBe(false)
  })

  it('filters candidates by lifecycle before the hydration cap', async () => {
    const endedAddresses = Array.from({ length: 30 }, (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}`)
    mockSearch([
      ...endedAddresses.map((address) => searchAuction(address, AuctionLifecycle.GRADUATED)),
      searchAuction(FIRST_ADDRESS, AuctionLifecycle.UPCOMING),
      searchAuction(SECOND_ADDRESS, AuctionLifecycle.LIVE),
      searchAuction(UNINDEXED_ADDRESS),
    ])
    const getAuction = vi
      .spyOn(AuctionServiceClient, 'getAuction')
      .mockImplementation(async (params) => foundAuction(params))

    const { result } = renderSearchedAuctions('lau', { statusFilter: AuctionStatusFilter.LIVE })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(getAuction.mock.calls.map(([params]) => params.address)).toEqual([SECOND_ADDRESS, UNINDEXED_ADDRESS])
  })

  it('keeps only upcoming, live and undecided candidates under liveOnly', async () => {
    mockSearch([
      searchAuction(FIRST_ADDRESS, AuctionLifecycle.FAILED),
      searchAuction(SECOND_ADDRESS, AuctionLifecycle.UPCOMING),
      searchAuction(UNINDEXED_ADDRESS),
    ])
    const getAuction = vi
      .spyOn(AuctionServiceClient, 'getAuction')
      .mockImplementation(async (params) => foundAuction(params))

    const { result } = renderSearchedAuctions('lau', { liveOnly: true })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(getAuction.mock.calls.map(([params]) => params.address)).toEqual([SECOND_ADDRESS, UNINDEXED_ADDRESS])
  })

  it.each([
    ['rejects', () => Promise.reject(new Error('unavailable'))],
    [
      'returns a degraded miss',
      async () => new GetAuctionResponse({ auctions: [], lookupStatus: AuctionLookupStatus.DEGRADED }),
    ],
  ])('reports an error when no result loads and a lookup %s', async (_, getAuctionImpl) => {
    mockSearch([searchAuction(FIRST_ADDRESS), searchAuction(SECOND_ADDRESS)])
    vi.spyOn(AuctionServiceClient, 'getAuction').mockImplementation(async (params) =>
      params.address === FIRST_ADDRESS
        ? new GetAuctionResponse({ auctions: [], lookupStatus: AuctionLookupStatus.COMPLETE })
        : getAuctionImpl(),
    )

    const { result } = renderSearchedAuctions('lau')
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.auctions).toEqual([])
    expect(result.current.isError).toBe(true)
  })

  it('keeps loading without an error while a lookup is still in flight after another failed', async () => {
    mockSearch([searchAuction(FIRST_ADDRESS), searchAuction(SECOND_ADDRESS)])
    let resolveSecond: (response: GetAuctionResponse) => void = () => {}
    vi.spyOn(AuctionServiceClient, 'getAuction').mockImplementation((params) =>
      params.address === FIRST_ADDRESS
        ? Promise.reject(new Error('unavailable'))
        : new Promise((resolve) => {
            resolveSecond = resolve
          }),
    )

    const { result, queryClient } = renderSearchedAuctions('lau')
    await waitFor(() => expect(queryClient.isFetching()).toBe(1))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)

    act(() => resolveSecond(foundAuction({ address: SECOND_ADDRESS, chainId: MAINNET_CHAIN_ID })))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.auctions.map((row) => row.auction?.address)).toEqual([SECOND_ADDRESS])
    expect(result.current.isError).toBe(false)
  })

  it('keeps the same rows across rerenders until a lookup changes', async () => {
    mockSearch([searchAuction(FIRST_ADDRESS)])
    vi.spyOn(AuctionServiceClient, 'getAuction').mockImplementation(async (params) => foundAuction(params))

    const { result, rerender } = renderSearchedAuctions('lau')
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const { auctions } = result.current
    rerender()

    expect(result.current.auctions).toBe(auctions)
  })

  it('reports no results without an error when every lookup completes empty', async () => {
    mockSearch([searchAuction(FIRST_ADDRESS)])
    vi.spyOn(AuctionServiceClient, 'getAuction').mockResolvedValue(
      new GetAuctionResponse({ auctions: [], lookupStatus: AuctionLookupStatus.COMPLETE }),
    )

    const { result } = renderSearchedAuctions('lau')
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.auctions).toEqual([])
    expect(result.current.isError).toBe(false)
  })

  it('skips search without a query', () => {
    mockUseSearchResults.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    const getAuction = vi.spyOn(AuctionServiceClient, 'getAuction')

    const { result } = renderSearchedAuctions(undefined)

    expect(mockUseSearchResults).toHaveBeenCalledWith(expect.objectContaining({ searchQuery: null, skip: true }))
    expect(getAuction).not.toHaveBeenCalled()
    expect(result.current.auctions).toEqual([])
  })

  it('reports a failed search', () => {
    mockUseSearchResults.mockReturnValue({ data: undefined, isLoading: false, isError: true })

    const { result } = renderSearchedAuctions('lau')

    expect(result.current.isError).toBe(true)
  })
})
