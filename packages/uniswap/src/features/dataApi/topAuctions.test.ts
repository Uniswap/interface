import { type GetTokensRequest, GetTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { Token, TokenSafety } from '@uniswap/client-data-api/dist/data/v2/types_pb'
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

const { mockListTopAuctions, mockGetTokens, mockUseEnabledChains } = vi.hoisted(() => ({
  mockListTopAuctions: vi.fn<(params: ListTopAuctionsRequest) => Promise<ListTopAuctionsResponse>>(),
  mockGetTokens: vi.fn<(params: GetTokensRequest) => Promise<GetTokensResponse>>(),
  mockUseEnabledChains: vi.fn(),
}))

// Mock the factory: vitest resolves concurrent dynamic imports of a mocked module to the real one.
vi.mock('@universe/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/api')>()),
  createAuctionServiceClient: () => ({ listTopAuctions: mockListTopAuctions }),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2')>()),
  dataApiServiceClientV2: { getTokens: mockGetTokens },
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000004'
const HIDDEN_AUCTION_ID = '1_0xD9E8355f9f57185928347a5BdDEe164006b16e58' // Abandoned Interfold auction.

// Mixed case on purpose: listings lowercase addresses, so the safety lookup must ignore case.
const MALICIOUS_TOKEN = '0xaa00000000000000000000000000000000000a01'
const SPAM_AIRDROP_TOKEN = '0xbB00000000000000000000000000000000000b02'
const UNSTABLE_PRICE_TOKEN = '0xCC00000000000000000000000000000000000C03'
const UNFLAGGED_TOKEN = '0xDd00000000000000000000000000000000000d04'

const TOKENS = [
  { address: MALICIOUS_TOKEN, symbol: 'MALICIOUS', safety: { verdict: 'Malicious', features: ['KNOWN_MALICIOUS'] } },
  {
    address: SPAM_AIRDROP_TOKEN,
    symbol: 'AIRDROP',
    safety: { verdict: 'Spam', isSpam: true, features: ['AIRDROP_PATTERN'] },
  },
  {
    address: UNSTABLE_PRICE_TOKEN,
    symbol: 'UNSTABLE',
    safety: { verdict: 'Spam', isSpam: true, features: ['UNSTABLE_TOKEN_PRICE'] },
  },
  { address: UNFLAGGED_TOKEN, symbol: 'CLEAN', safety: { verdict: 'Benign' } },
]

function tokensWithSafety(params: GetTokensRequest): GetTokensResponse {
  return new GetTokensResponse({
    tokens: TOKENS.filter(({ address }) =>
      params.tokens.some((token) => token.address.toLowerCase() === address.toLowerCase()),
    ).map(
      ({ address, symbol, safety }) =>
        new Token({
          chainId: UniverseChainId.Mainnet,
          address,
          decimals: 18,
          symbol,
          name: symbol,
          safety: new TokenSafety(safety),
        }),
    ),
  })
}

type ListingEntry = { symbol: string; volumeUsd: string; auctionId?: string; tokenAddress?: string }

function listing(auctions: ListingEntry[]): ListTopAuctionsResponse {
  return new ListTopAuctionsResponse({
    auctions: auctions.map(
      ({ symbol, volumeUsd, auctionId = `1_${symbol}`, tokenAddress = TOKEN_ADDRESS }) =>
        new AuctionWithStats({
          auction: new Auction({
            auctionId,
            chainId: UniverseChainId.Mainnet,
            tokenAddress: tokenAddress.toLowerCase(),
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
    mockGetTokens.mockReset()
    mockGetTokens.mockImplementation(async (params) => tokensWithSafety(params))
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
  it('drops auctions whose token shows a warning icon, keeping unstable-price spam', async () => {
    mockListings({
      active: [
        { symbol: 'MALICIOUS', volumeUsd: '90000', tokenAddress: MALICIOUS_TOKEN },
        { symbol: 'AIRDROP', volumeUsd: '80000', tokenAddress: SPAM_AIRDROP_TOKEN },
        { symbol: 'UNSTABLE', volumeUsd: '70000', tokenAddress: UNSTABLE_PRICE_TOKEN },
        { symbol: 'CLEAN', volumeUsd: '60000', tokenAddress: UNFLAGGED_TOKEN },
      ],
      completed: [{ symbol: 'ENDED_MALICIOUS', volumeUsd: '72000000', tokenAddress: MALICIOUS_TOKEN }],
    })

    expect((await renderTopAuctions()).options.map(({ symbol }) => symbol)).toEqual(['UNSTABLE', 'CLEAN'])
  })

  it('still fills `size` rows when a warned token would have taken one', async () => {
    mockListings({
      active: [
        { symbol: 'MALICIOUS', volumeUsd: '90000', tokenAddress: MALICIOUS_TOKEN },
        ...['A', 'B', 'C', 'D', 'E'].map((symbol) => ({ symbol, volumeUsd: '5000' })),
      ],
      completed: [],
    })

    expect((await renderTopAuctions()).options.map(({ symbol }) => symbol)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it('shows no rows until token safety has loaded', async () => {
    let resolveTokens: () => void = () => undefined
    mockGetTokens.mockImplementation(
      (params) =>
        new Promise((resolve) => {
          resolveTokens = () => resolve(tokensWithSafety(params))
        }),
    )
    mockListings({
      active: [
        { symbol: 'MALICIOUS', volumeUsd: '90000', tokenAddress: MALICIOUS_TOKEN },
        { symbol: 'CLEAN', volumeUsd: '60000', tokenAddress: UNFLAGGED_TOKEN },
      ],
      completed: [],
    })

    const { result } = renderHook(() => useTopAuctionOptions({ chainFilter: null, size: 5, skip: false }))
    await waitFor(() => expect(mockGetTokens).toHaveBeenCalled())
    expect(result.current).toMatchObject({ data: [], isLoading: true })

    resolveTokens()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.map((option) => option.tokenSymbol)).toEqual(['CLEAN'])
  })

  it('hides newly listed tokens until their safety loads after the chain filter changes', async () => {
    mockListTopAuctions.mockImplementation(async (params) => {
      if (params.statusFilter !== AuctionStatusFilter.ACTIVE) {
        return listing([])
      }
      return params.chainIds.length === 1
        ? listing([{ symbol: 'MALICIOUS', volumeUsd: '90000', tokenAddress: MALICIOUS_TOKEN }])
        : listing([{ symbol: 'CLEAN', volumeUsd: '60000', tokenAddress: UNFLAGGED_TOKEN }])
    })
    const { result, rerender } = renderHook(
      (chainFilter: UniverseChainId | null) => useTopAuctionOptions({ chainFilter, size: 5, skip: false }),
      { initialProps: [null] },
    )
    await waitFor(() => expect(result.current.data?.map((option) => option.tokenSymbol)).toEqual(['CLEAN']))

    let resolveTokens: () => void = () => undefined
    mockGetTokens.mockImplementation(
      (params) =>
        new Promise((resolve) => {
          resolveTokens = () => resolve(tokensWithSafety(params))
        }),
    )
    rerender([UniverseChainId.Base])
    await waitFor(() => expect(mockGetTokens).toHaveBeenCalledTimes(2))
    expect(result.current).toMatchObject({ data: [], isLoading: true })

    resolveTokens()
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('shows the listing unfiltered when token safety fails to load', async () => {
    mockGetTokens.mockRejectedValue(new Error('GetTokens failed'))
    mockListings({
      active: [
        { symbol: 'MALICIOUS', volumeUsd: '90000', tokenAddress: MALICIOUS_TOKEN },
        { symbol: 'CLEAN', volumeUsd: '60000', tokenAddress: UNFLAGGED_TOKEN },
      ],
      completed: [],
    })

    expect((await renderTopAuctions()).options.map(({ symbol }) => symbol)).toEqual(['MALICIOUS', 'CLEAN'])
  })
})
