import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  Auction,
  AuctionLookupStatus,
  AuctionStatusFilter,
  AuctionWithStats,
  GetAuctionResponse,
  ListTopAuctionsResponse,
  TopAuctionsOrder,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { AuctionServiceClient } from 'uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient'
import { useTopAuctions } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import store from '~/state'

vi.mock('~/utils/params/chainParams', () => ({ useChainIdFromUrlParam: () => undefined }))

const { verifiedAuctionIds } = vi.hoisted(() => ({ verifiedAuctionIds: [] as string[] }))

vi.mock('uniswap/src/features/toucan/useVerifiedAuctionIds', () => ({
  useVerifiedAuctionIds: () => verifiedAuctionIds,
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => {
  const noCurrencyInfos: never[] = []
  return { useCurrencyInfos: () => noCurrencyInfos }
})

const { blockInfo } = vi.hoisted(() => {
  const mainnetChainId = 1
  return {
    blockInfo: {
      blocksByChain: new Map([[mainnetChainId, { number: 1_000n, timestamp: 0n }]]),
      pendingChainIds: new Set<number>(),
    },
  }
})

vi.mock('~/features/Toucan/hooks/useTopAuctions/useMultiChainBlockInfo', () => ({
  useMultiChainBlockInfo: () => blockInfo,
}))

afterEach(() => {
  blockInfo.pendingChainIds.clear()
  verifiedAuctionIds.length = 0
})

const MAINNET_CHAIN_ID = 1
// Base has no block: a chain whose RPC failed, unless a test marks it pending.
const BASE_CHAIN_ID = 8453
const SECOND_PAGE_TOKEN = btoa(JSON.stringify({ offset: 100 }))

function createAuction(address: string, chainId = MAINNET_CHAIN_ID): Auction {
  return new Auction({
    auctionId: `${chainId}_${address}`,
    chainId,
    address,
    tokenAddress: address,
    startBlock: '1',
    endBlock: '2000',
  })
}

function auctionWithStats(address: string, chainId = MAINNET_CHAIN_ID): AuctionWithStats {
  return new AuctionWithStats({ auction: createAuction(address, chainId) })
}

// Resolves on a macrotask: React Query batches notifications on setTimeout(0), so a microtask mock
// collapses the fetching and settled renders into one and `loadMore`'s completion never fires.
function respondsWith(result: ListTopAuctionsResponse | Error): () => Promise<ListTopAuctionsResponse> {
  return () =>
    new Promise((resolve, reject) => {
      setTimeout(() => (result instanceof Error ? reject(result) : resolve(result)), 0)
    })
}

function renderTopAuctions(params?: Parameters<typeof useTopAuctions>[0]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  )
  return renderHook(() => useTopAuctions(params), { wrapper })
}

function auctionIds(auctions: ReturnType<typeof useTopAuctions>['auctions']): (string | undefined)[] {
  return auctions.map((enrichedAuction) => enrichedAuction.auction?.auctionId)
}

describe('useTopAuctions pagination', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests lifecycle order with unsafe tokens excluded, then follows the next page token', async () => {
    const listTopAuctions = vi
      .spyOn(AuctionServiceClient, 'listTopAuctions')
      .mockImplementationOnce(
        respondsWith(
          new ListTopAuctionsResponse({
            auctions: [auctionWithStats('0xa'), auctionWithStats('0xb')],
            nextPageToken: SECOND_PAGE_TOKEN,
          }),
        ),
      )
      .mockImplementationOnce(
        respondsWith(new ListTopAuctionsResponse({ auctions: [auctionWithStats('0xc')], nextPageToken: '' })),
      )

    const { result } = renderTopAuctions()
    await waitFor(() => expect(result.current.auctions).toHaveLength(2))

    expect(listTopAuctions).toHaveBeenCalledTimes(1)
    expect(listTopAuctions.mock.calls[0]?.[0]).toMatchObject({
      pageSize: 100,
      chainIds: [],
      liveOnly: false,
      excludeUnsafeTokens: true,
      order: TopAuctionsOrder.LIFECYCLE,
      pageToken: '',
    })

    const onComplete = vi.fn()
    act(() => result.current.loadMore?.({ onComplete }))
    await waitFor(() => expect(onComplete).toHaveBeenCalled())

    expect(listTopAuctions.mock.calls[1]?.[0]).toMatchObject({
      excludeUnsafeTokens: true,
      order: TopAuctionsOrder.LIFECYCLE,
      pageToken: SECOND_PAGE_TOKEN,
    })
    expect(auctionIds(result.current.auctions)).toEqual(['1_0xa', '1_0xb', '1_0xc'])
    expect(result.current.loadMore).toBeUndefined()
  })

  it('forwards the custom-only and status filters to the server', async () => {
    const listTopAuctions = vi
      .spyOn(AuctionServiceClient, 'listTopAuctions')
      .mockImplementationOnce(
        respondsWith(new ListTopAuctionsResponse({ auctions: [auctionWithStats('0xa')], nextPageToken: '' })),
      )

    const { result } = renderTopAuctions({ customOnly: true, statusFilter: AuctionStatusFilter.UPCOMING })
    await waitFor(() => expect(result.current.auctions).toHaveLength(1))

    expect(listTopAuctions.mock.calls[0]?.[0]).toMatchObject({
      customOnly: true,
      statusFilter: AuctionStatusFilter.UPCOMING,
    })
  })

  it('keeps server order and drops an auction repeated on a later page', async () => {
    vi.spyOn(AuctionServiceClient, 'listTopAuctions')
      .mockImplementationOnce(
        respondsWith(
          new ListTopAuctionsResponse({
            auctions: [auctionWithStats('0xb'), auctionWithStats('0xa')],
            nextPageToken: SECOND_PAGE_TOKEN,
          }),
        ),
      )
      .mockImplementationOnce(
        respondsWith(
          new ListTopAuctionsResponse({
            auctions: [auctionWithStats('0xa'), auctionWithStats('0xc')],
            nextPageToken: '',
          }),
        ),
      )

    const { result } = renderTopAuctions()
    await waitFor(() => expect(result.current.auctions).toHaveLength(2))

    act(() => result.current.loadMore?.({}))
    await waitFor(() => expect(result.current.loadMore).toBeUndefined())

    expect(auctionIds(result.current.auctions)).toEqual(['1_0xb', '1_0xa', '1_0xc'])
  })

  it('keeps the loaded rows and the next page on offer when a later page fails', async () => {
    vi.spyOn(AuctionServiceClient, 'listTopAuctions')
      .mockImplementationOnce(
        respondsWith(
          new ListTopAuctionsResponse({ auctions: [auctionWithStats('0xa')], nextPageToken: SECOND_PAGE_TOKEN }),
        ),
      )
      .mockImplementationOnce(respondsWith(new Error('unavailable')))

    const { result } = renderTopAuctions()
    await waitFor(() => expect(result.current.auctions).toHaveLength(1))

    const onComplete = vi.fn()
    act(() => result.current.loadMore?.({ onComplete }))
    await waitFor(() => expect(onComplete).toHaveBeenCalled())

    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(auctionIds(result.current.auctions)).toEqual(['1_0xa'])
    expect(result.current.loadMore).toBeDefined()
  })

  it('holds back a later-page row while its chain block loads without hiding the loaded rows', async () => {
    blockInfo.pendingChainIds.add(BASE_CHAIN_ID)
    vi.spyOn(AuctionServiceClient, 'listTopAuctions')
      .mockImplementationOnce(
        respondsWith(
          new ListTopAuctionsResponse({ auctions: [auctionWithStats('0xa')], nextPageToken: SECOND_PAGE_TOKEN }),
        ),
      )
      .mockImplementationOnce(
        respondsWith(
          new ListTopAuctionsResponse({ auctions: [auctionWithStats('0xb', BASE_CHAIN_ID)], nextPageToken: '' }),
        ),
      )

    const { result } = renderTopAuctions()
    await waitFor(() => expect(result.current.auctions).toHaveLength(1))

    act(() => result.current.loadMore?.({}))
    await waitFor(() => expect(result.current.loadMore).toBeUndefined())

    expect(result.current.isLoading).toBe(false)
    expect(auctionIds(result.current.auctions)).toEqual(['1_0xa'])
  })

  it('renders a row whose chain block failed instead of dropping it', async () => {
    vi.spyOn(AuctionServiceClient, 'listTopAuctions').mockImplementationOnce(
      respondsWith(
        new ListTopAuctionsResponse({
          auctions: [auctionWithStats('0xa'), auctionWithStats('0xb', BASE_CHAIN_ID)],
          nextPageToken: '',
        }),
      ),
    )

    const { result } = renderTopAuctions()
    await waitFor(() => expect(result.current.auctions).toHaveLength(2))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(auctionIds(result.current.auctions)).toEqual(['1_0xa', '8453_0xb'])
  })

  it('appends a verified auction the loaded pages lack via GetAuction, without bid stats', async () => {
    verifiedAuctionIds.push(`${MAINNET_CHAIN_ID}_0xv`)
    vi.spyOn(AuctionServiceClient, 'listTopAuctions').mockImplementationOnce(
      respondsWith(new ListTopAuctionsResponse({ auctions: [auctionWithStats('0xa')], nextPageToken: '' })),
    )
    const getAuction = vi
      .spyOn(AuctionServiceClient, 'getAuction')
      .mockResolvedValue(
        new GetAuctionResponse({ auctions: [createAuction('0xv')], lookupStatus: AuctionLookupStatus.COMPLETE }),
      )

    const { result, rerender } = renderTopAuctions()
    await waitFor(() => expect(auctionIds(result.current.auctions)).toEqual(['1_0xa', '1_0xv']))

    expect(getAuction.mock.calls[0]?.[0]).toMatchObject({ chainId: MAINNET_CHAIN_ID, address: '0xv' })
    expect(result.current.auctions[1]?.totalBidVolume).toBe('')

    const { auctions } = result.current
    rerender()
    expect(result.current.auctions).toBe(auctions)
  })

  it('runs the verified fallback under a status filter', async () => {
    verifiedAuctionIds.push(`${MAINNET_CHAIN_ID}_0xv`)
    vi.spyOn(AuctionServiceClient, 'listTopAuctions').mockImplementationOnce(
      respondsWith(new ListTopAuctionsResponse({ auctions: [auctionWithStats('0xa')], nextPageToken: '' })),
    )
    const getAuction = vi
      .spyOn(AuctionServiceClient, 'getAuction')
      .mockResolvedValue(
        new GetAuctionResponse({ auctions: [createAuction('0xv')], lookupStatus: AuctionLookupStatus.COMPLETE }),
      )

    const { result } = renderTopAuctions({ statusFilter: AuctionStatusFilter.GRADUATED })
    await waitFor(() => expect(auctionIds(result.current.auctions)).toEqual(['1_0xa', '1_0xv']))

    expect(getAuction).toHaveBeenCalledTimes(1)
  })

  it('fetches nothing while disabled', () => {
    verifiedAuctionIds.push(`${MAINNET_CHAIN_ID}_0xv`)
    const listTopAuctions = vi.spyOn(AuctionServiceClient, 'listTopAuctions')
    const getAuction = vi.spyOn(AuctionServiceClient, 'getAuction')

    const { result } = renderTopAuctions({ enabled: false })

    expect(listTopAuctions).not.toHaveBeenCalled()
    expect(getAuction).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.auctions).toEqual([])
  })

  it('reports an error and offers no next page when the first page fails', async () => {
    vi.spyOn(AuctionServiceClient, 'listTopAuctions').mockImplementationOnce(respondsWith(new Error('unavailable')))

    const { result } = renderTopAuctions()
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.auctions).toEqual([])
    expect(result.current.loadMore).toBeUndefined()
  })
})
