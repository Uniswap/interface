import { SearchModalOption, OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import {
  getAllSections,
  getSearchResultsForActiveTab,
  SearchResultsForActiveTabParams,
} from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForSearchResultsUtils'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'

const mockRefetch = vi.fn()

function createAuctionOption(): SearchModalOption {
  return {
    type: OnchainItemListOptionType.Auction,
    auctionId: 'auction-1',
    auctionAddress: '0x0000000000000000000000000000000000000001',
    chainId: 1,
    tokenAddress: '0x0000000000000000000000000000000000000002',
    tokenSymbol: 'UNI',
    tokenName: 'Uniswap',
    tokenLogoUrl: undefined,
    currencyInfo: null,
    committedVolumeUsd: 100,
    isVerified: true,
  }
}

function createSection(sectionKey: OnchainItemSectionName): OnchainItemSection<SearchModalOption> {
  return {
    sectionKey,
    data: [createAuctionOption()],
  }
}

function createSearchResultParams(
  overrides: Partial<SearchResultsForActiveTabParams>,
): SearchResultsForActiveTabParams {
  return {
    activeTab: SearchTab.All,
    allSections: [],
    auctionSearchEnabled: true,
    auctionSearchResultsSection: undefined,
    earnSearchResultsSection: undefined,
    poolSearchOptionsLength: 0,
    poolSearchResultsLength: undefined,
    poolSearchResultsSection: undefined,
    refetchAll: mockRefetch,
    refetchSearchAuctions: mockRefetch,
    refetchSearchPools: mockRefetch,
    refetchSearchTokens: mockRefetch,
    searchAuctionsError: undefined,
    searchAuctionsLoading: false,
    searchPoolsError: undefined,
    searchPoolsLoading: false,
    searchTokensError: undefined,
    searchTokensLoading: false,
    tokenOptionsLength: 0,
    tokenSearchResultsSection: undefined,
    walletSearchResultsLoading: false,
    walletSearchResultsSection: undefined,
    ...overrides,
  }
}

describe('useSectionsForSearchResultsUtils', () => {
  describe('getAllSections', () => {
    it('appends auction results after token, pool, and wallet sections on the All tab', () => {
      const sections = getAllSections({
        auctionSearchResultsSection: [createSection(OnchainItemSectionName.Auctions)],
        earnSearchResultsSection: undefined,
        shouldPrioritizeWallets: false,
        shouldShowWallets: true,
        tokenAndPoolSections: [
          createSection(OnchainItemSectionName.Tokens),
          createSection(OnchainItemSectionName.Pools),
        ],
        walletSearchResultsSection: [createSection(OnchainItemSectionName.Wallets)],
      })

      expect(sections.map((section) => section.sectionKey)).toEqual([
        OnchainItemSectionName.Tokens,
        OnchainItemSectionName.Pools,
        OnchainItemSectionName.Wallets,
        OnchainItemSectionName.Auctions,
      ])
    })

    it('leads with earn sections when present on the All tab', () => {
      const sections = getAllSections({
        auctionSearchResultsSection: [createSection(OnchainItemSectionName.Auctions)],
        earnSearchResultsSection: [createSection(OnchainItemSectionName.Earn)],
        shouldPrioritizeWallets: false,
        shouldShowWallets: true,
        tokenAndPoolSections: [
          createSection(OnchainItemSectionName.Tokens),
          createSection(OnchainItemSectionName.Pools),
        ],
        walletSearchResultsSection: [createSection(OnchainItemSectionName.Wallets)],
      })

      expect(sections.map((section) => section.sectionKey)).toEqual([
        OnchainItemSectionName.Earn,
        OnchainItemSectionName.Tokens,
        OnchainItemSectionName.Pools,
        OnchainItemSectionName.Wallets,
        OnchainItemSectionName.Auctions,
      ])
    })

    it('keeps auction results after wallet-prioritized sections on the All tab', () => {
      const sections = getAllSections({
        auctionSearchResultsSection: [createSection(OnchainItemSectionName.Auctions)],
        earnSearchResultsSection: undefined,
        shouldPrioritizeWallets: true,
        shouldShowWallets: true,
        tokenAndPoolSections: [
          createSection(OnchainItemSectionName.Tokens),
          createSection(OnchainItemSectionName.Pools),
        ],
        walletSearchResultsSection: [createSection(OnchainItemSectionName.Wallets)],
      })

      expect(sections.map((section) => section.sectionKey)).toEqual([
        OnchainItemSectionName.Wallets,
        OnchainItemSectionName.Tokens,
        OnchainItemSectionName.Pools,
        OnchainItemSectionName.Auctions,
      ])
    })

    it('keeps auction results when disabled wallet search terms hide wallets', () => {
      const sections = getAllSections({
        auctionSearchResultsSection: [createSection(OnchainItemSectionName.Auctions)],
        earnSearchResultsSection: undefined,
        shouldPrioritizeWallets: false,
        shouldShowWallets: false,
        tokenAndPoolSections: [createSection(OnchainItemSectionName.Tokens)],
        walletSearchResultsSection: [createSection(OnchainItemSectionName.Wallets)],
      })

      expect(sections.map((section) => section.sectionKey)).toEqual([
        OnchainItemSectionName.Tokens,
        OnchainItemSectionName.Auctions,
      ])
    })
  })

  describe('getSearchResultsForActiveTab', () => {
    it('returns auction sections and query state for the Auctions tab', () => {
      const error = new Error('auction search failed')
      const auctionSection = createSection(OnchainItemSectionName.Auctions)

      const result = getSearchResultsForActiveTab(
        createSearchResultParams({
          activeTab: SearchTab.Auctions,
          auctionSearchResultsSection: [auctionSection],
          searchAuctionsError: error,
          searchAuctionsLoading: true,
        }),
      )

      expect(result).toEqual({
        data: [auctionSection],
        loading: true,
        error,
        refetch: mockRefetch,
      })
    })

    it('suppresses auction loading and errors when auction search is disabled', () => {
      const result = getSearchResultsForActiveTab(
        createSearchResultParams({
          activeTab: SearchTab.Auctions,
          auctionSearchEnabled: false,
          searchAuctionsError: new Error('auction search failed'),
          searchAuctionsLoading: true,
        }),
      )

      expect(result.loading).toBe(false)
      expect(result.error).toBeUndefined()
    })
  })
})
