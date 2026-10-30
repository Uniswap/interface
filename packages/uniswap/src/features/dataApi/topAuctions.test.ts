import { GetTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  Auction,
  AuctionStatusFilter,
  AuctionWithStats,
  ListTopAuctionsResponse,
  type ListTopAuctionsRequest,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { useTopAuctionOptions } from 'uniswap/src/features/dataApi/topAuctions'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'

const { mockListTopAuctions, mockUseEnabledChains } = vi.hoisted(() => ({
  mockListTopAuctions: vi.fn<(params: ListTopAuctionsRequest) => Promise<ListTopAuctionsResponse>>(),
  mockUseEnabledChains: vi.fn(),
}))

// Mock the factory: vitest resolves concurrent dynamic imports of a mocked module to the real one.
vi.mock('@universe/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/api')>()),
  createAuctionServiceClient: () => ({ listTopAuctions: mockListTopAuctions }),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2')>()),
  dataApiServiceClientV2: { getTokens: async () => new GetTokensResponse() },
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000004'
const HIDDEN_AUCTION_ID = '1_0xD9E8355f9f57185928347a5BdDEe164006b16e58' // Abandoned Interfold auction.

type ListingEntry = { symbol: string; volumeUsd: string; auctionId?: string }

function listing(auctions: ListingEntry[]): ListTopAuctionsResponse {
  return new ListTopAuctionsResponse({
    auctions: auctions.map(
      ({ symbol, volumeUsd, auctionId = `1_${symbol}` }) =>
        new AuctionWithStats({
          auction: new Auction({
            auctionId,
            chainId: UniverseChainId.Mainnet,
            tokenAddress: TOKEN_ADDRESS,
            tokenSymbol: symbol,
            totalBidVolumeUsd: volumeUsd,
          }),
        }),
    ),
  })
}

function mockListings({ active, completed }: { active: ListingEntry[]; completed: ListingEntry[] }): void {
  mockListTopAuctions.mockImplementation(async (params: ListTopAuctionsRequest) =>
    params.statusFilter === AuctionStatusFilter.ACTIVE ? listing(active) : listing(completed),
  )
}

async function renderTopAuctions(): Promise<{
  options: { symbol: string | undefined; isEnded: boolean | undefined }[]
  error: Error | null
}> {
  const { result } = renderHook(() => useTopAuctionOptions({ chainFilter: null, size: 5, skip: false }))
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  return {
    options: (result.current.data ?? []).map((option) => ({
      symbol: option.tokenSymbol,
      isEnded: option.searchStats?.isEnded,
    })),
    error: result.current.error,
  }
}

describe(useTopAuctionOptions, () => {
  beforeEach(() => {
    SharedQueryClient.clear()
    mockListTopAuctions.mockReset()
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet, UniverseChainId.Base] })
  })

  it('requests both listings on the enabled chains only', async () => {
    mockListings({ active: [], completed: [] })

    await renderTopAuctions()

    expect(mockListTopAuctions.mock.calls.map(([params]) => [params.statusFilter, params.chainIds])).toEqual(
      expect.arrayContaining([
        [AuctionStatusFilter.ACTIVE, [UniverseChainId.Mainnet, UniverseChainId.Base]],
        [AuctionStatusFilter.COMPLETED, [UniverseChainId.Mainnet, UniverseChainId.Base]],
      ]),
    )
  })

  it('lists active auctions from $1K by volume, then fills with ended auctions from $10K by volume', async () => {
    mockListings({
      active: [
        { symbol: 'NEW', volumeUsd: '0' },
        { symbol: 'LIVE_1K', volumeUsd: '1000' },
        { symbol: 'LIVE_BIG', volumeUsd: '71000' },
        { symbol: 'LIVE_SMALL', volumeUsd: '999.99' },
      ],
      completed: [
        { symbol: 'ENDED_SMALL', volumeUsd: '9999' },
        { symbol: 'ENDED_10K', volumeUsd: '10000' },
        { symbol: 'ENDED_BIG', volumeUsd: '72000000' },
      ],
    })

    expect((await renderTopAuctions()).options).toEqual([
      { symbol: 'LIVE_BIG', isEnded: undefined },
      { symbol: 'LIVE_1K', isEnded: undefined },
      { symbol: 'ENDED_BIG', isEnded: true },
      { symbol: 'ENDED_10K', isEnded: true },
    ])
  })

  it('shows no ended auctions once `size` active auctions qualify', async () => {
    mockListings({
      active: ['A', 'B', 'C', 'D', 'E', 'F'].map((symbol) => ({ symbol, volumeUsd: '5000' })),
      completed: [{ symbol: 'ENDED', volumeUsd: '72000000' }],
    })

    const { options } = await renderTopAuctions()

    expect(options).toHaveLength(5)
    expect(options.every(({ isEnded }) => !isEnded)).toBe(true)
  })

  it('drops hidden auctions from both listings', async () => {
    mockListings({
      active: [
        { symbol: 'FOLD', volumeUsd: '72000000', auctionId: HIDDEN_AUCTION_ID },
        { symbol: 'LIVE', volumeUsd: '5000' },
      ],
      completed: [{ symbol: 'FOLD', volumeUsd: '72000000', auctionId: HIDDEN_AUCTION_ID }],
    })

    expect((await renderTopAuctions()).options).toEqual([{ symbol: 'LIVE', isEnded: undefined }])
  })

  it('lists an auction served by both listings once, as ended', async () => {
    mockListings({
      active: [{ symbol: 'MOVED', volumeUsd: '50000' }],
      completed: [{ symbol: 'MOVED', volumeUsd: '50000' }],
    })

    expect((await renderTopAuctions()).options).toEqual([{ symbol: 'MOVED', isEnded: true }])
  })

  it('keeps the loaded listing when the other fails, and errors only when nothing loaded', async () => {
    mockListTopAuctions.mockImplementation(async (params: ListTopAuctionsRequest) => {
      if (params.statusFilter === AuctionStatusFilter.ACTIVE) {
        throw new Error('active failed')
      }
      return listing([{ symbol: 'ENDED', volumeUsd: '72000000' }])
    })
    expect(await renderTopAuctions()).toEqual({ options: [{ symbol: 'ENDED', isEnded: true }], error: null })

    SharedQueryClient.clear()
    mockListTopAuctions.mockRejectedValue(new Error('both failed'))
    expect((await renderTopAuctions()).error).toBeInstanceOf(Error)
  })
})
