import { waitFor } from '@testing-library/react-native'
import { GetTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { AuctionLifecycle, SearchAuction, SearchResponse } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { GetUsernameResponse, SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { useSectionsForSearchResults } from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForSearchResults'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const { mockUseSearchQuery, mockUseAddressFromEns } = vi.hoisted(() => ({
  mockUseSearchQuery: vi.fn(),
  mockUseAddressFromEns: vi.fn(),
}))

vi.mock('uniswap/src/features/ens/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/ens/api')>()),
  useAddressFromEns: mockUseAddressFromEns,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/search/search', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/search/search')>()),
  useSearchQuery: mockUseSearchQuery,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/rwa/listRwas', () => ({
  useListRwasQuery: (): { data: undefined } => ({ data: undefined }),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories', () => ({
  useAllTokenCategories: (): { categories: []; isLoading: boolean } => ({ categories: [], isLoading: false }),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2')>()),
  dataApiServiceClientV2: { getTokens: async () => new GetTokensResponse() },
}))

vi.mock('uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient', () => ({
  unitagsApiClient: { fetchUsername: async () => new GetUsernameResponse({ available: true }) },
}))

// No RPC provider, so the All tab's ENS lookup resolves to nothing.
vi.mock('uniswap/src/features/providers/createEthersProvider', () => ({
  createEthersProviderFactory: () => () => null,
}))

vi.mock('uniswap/src/features/wallet/hooks/useWallet', () => ({
  useWallet: (): { evmAccount: undefined } => ({ evmAccount: undefined }),
}))

const ENDED_AUCTION = new SearchAuction({
  auctionId: '1_0x0000000000000000000000000000000000000001',
  auctionAddress: '0x0000000000000000000000000000000000000001',
  chainId: UniverseChainId.Mainnet,
  tokenAddress: '0x0000000000000000000000000000000000000002',
  tokenSymbol: 'EX',
  lifecycle: AuctionLifecycle.GRADUATED,
})

function renderAuctionIds(activeTab: SearchTab): () => string[] {
  const { result } = renderHookWithProviders(() =>
    useSectionsForSearchResults({
      chainFilter: null,
      searchFilter: 'ex',
      activeTab,
      auctionSearchEnabled: true,
      shouldPrioritizePools: false,
      shouldPrioritizeWallets: false,
    }),
  )
  return () =>
    (result.current.data ?? [])
      .flatMap(({ data }) => data.flat())
      .flatMap((option) => (option.type === OnchainItemListOptionType.Auction ? [option.auctionId] : []))
}

describe(useSectionsForSearchResults, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
    mockUseAddressFromEns.mockReturnValue({ data: null, isLoading: false })
    mockUseSearchQuery.mockImplementation(({ select }: { select: (response: SearchResponse) => unknown }) => ({
      data: select(new SearchResponse({ auctions: [ENDED_AUCTION] })),
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    }))
  })

  it('uses a resolved ENS address for web token searches', async () => {
    const address = '0x00000000000000000000000000000000000000a1'
    mockUseAddressFromEns.mockImplementation((name: string | null) => ({
      data: name === 'token.example.eth' ? address : null,
      isLoading: false,
    }))
    renderHookWithProviders(() =>
      useSectionsForSearchResults({
        chainFilter: UniverseChainId.Mainnet,
        searchFilter: 'token.example.eth',
        activeTab: SearchTab.Tokens,
        shouldPrioritizePools: false,
        shouldPrioritizeWallets: false,
      }),
    )
    await waitFor(() =>
      expect(mockUseSearchQuery).toHaveBeenCalledWith(
        expect.objectContaining({ input: expect.objectContaining({ searchQuery: address }) }),
      ),
    )
  })

  it('does not resolve ENS as a token search on another selected chain', async () => {
    renderHookWithProviders(() =>
      useSectionsForSearchResults({
        chainFilter: UniverseChainId.Base,
        searchFilter: 'token.example.eth',
        activeTab: SearchTab.Tokens,
        shouldPrioritizePools: false,
        shouldPrioritizeWallets: false,
      }),
    )
    await waitFor(() =>
      expect(mockUseSearchQuery).toHaveBeenCalledWith(
        expect.objectContaining({ input: expect.objectContaining({ searchQuery: 'token.example.eth' }) }),
      ),
    )
    expect(mockUseAddressFromEns).toHaveBeenCalledWith(null)
  })

  it('lists an ended auction on the Auctions tab', async () => {
    const auctionIds = renderAuctionIds(SearchTab.Auctions)

    await waitFor(() => expect(auctionIds()).toEqual([ENDED_AUCTION.auctionId]))
  })

  it('drops an ended auction from the All tab', async () => {
    const auctionIds = renderAuctionIds(SearchTab.All)

    await waitFor(() => expect(SharedQueryClient.isFetching()).toBe(0))
    expect(auctionIds()).toEqual([])
  })
})
