import { waitFor } from '@testing-library/react-native'
import {
  Auction,
  AuctionWithStats,
  ListTopAuctionsResponse,
  type ListTopAuctionsRequest,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useSectionsForNoQuerySearch } from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForNoQuerySearch'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const { mockListTopAuctions, mockListPools, mockListTokens } = vi.hoisted(() => ({
  mockListTopAuctions: vi.fn<(params: ListTopAuctionsRequest) => Promise<ListTopAuctionsResponse>>(),
  mockListPools: vi.fn(),
  mockListTokens: vi.fn(),
}))

vi.mock('@universe/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/api')>()),
  createAuctionServiceClient: () => ({ listTopAuctions: mockListTopAuctions }),
}))

vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useIsFeatureGated: (): boolean => false,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2')>()),
  dataApiServiceClientV2: { listPools: mockListPools, listTokens: mockListTokens },
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/rwa/listRwas', () => ({
  useListRwasQuery: (): { data: undefined } => ({ data: undefined }),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/rwa/listRankedRwas', () => ({
  useListRankedRwasQuery: (): { data: undefined; isLoading: boolean } => ({ data: undefined, isLoading: false }),
}))

function renderSectionKeys(activeTab: SearchTab): () => OnchainItemSectionName[] {
  const { result } = renderHookWithProviders(() =>
    useSectionsForNoQuerySearch({ chainFilter: null, activeTab, auctionSearchEnabled: true }),
  )
  return () => (result.current.data ?? []).map(({ sectionKey }) => sectionKey)
}

describe(useSectionsForNoQuerySearch, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
    mockListTopAuctions.mockResolvedValue(
      new ListTopAuctionsResponse({
        auctions: [
          new AuctionWithStats({
            auction: new Auction({
              auctionId: '1_0x0000000000000000000000000000000000000001',
              chainId: UniverseChainId.Mainnet,
              tokenAddress: '0x0000000000000000000000000000000000000002',
              tokenSymbol: 'LIVE',
              totalBidVolumeUsd: '50000',
            }),
          }),
        ],
      }),
    )
    mockListPools.mockResolvedValue({ pools: [] })
    mockListTokens.mockResolvedValue({ multichainTokens: [] })
  })

  it('lists top auctions on the Auctions tab', async () => {
    const sectionKeys = renderSectionKeys(SearchTab.Auctions)

    await waitFor(() => expect(sectionKeys()).toContain(OnchainItemSectionName.TopAuctions))
  })

  it('leaves top auctions off the All tab without requesting them', async () => {
    const sectionKeys = renderSectionKeys(SearchTab.All)

    await waitFor(() => expect(SharedQueryClient.isFetching()).toBe(0))
    expect(mockListTopAuctions).not.toHaveBeenCalled()
    expect(sectionKeys()).not.toContain(OnchainItemSectionName.TopAuctions)
  })
})
