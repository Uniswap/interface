import {
  type CategoryOption,
  OnchainItemListOptionType,
  SearchModalOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { NUMBER_OF_RESULTS_ALL_TAB } from 'uniswap/src/features/search/SearchModal/constants'
import {
  getAllSections,
  getSearchResultsForActiveTab,
  getTruncatedSectionKeys,
  SearchResultsForActiveTabParams,
  withCategoryOptions,
} from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForSearchResultsUtils'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

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

function createCategoryOption(id: string, name: string): CategoryOption {
  return {
    type: OnchainItemListOptionType.Category,
    category: { id, name, description: '', categoryClass: TokenCategoryClass.Sector, grouped: false, topTokens: [] },
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
    searchAuctionsError: null,
    searchAuctionsLoading: false,
    searchCategoriesLoading: false,
    searchPoolsError: null,
    searchPoolsLoading: false,
    searchTokensError: null,
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
        isLoading: true,
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

      expect(result.isLoading).toBe(false)
      expect(result.error).toBeNull()
    })
  })
})

describe('withCategoryOptions', () => {
  const tokenOptions = [createAuctionOption()]
  const stablecoins = createCategoryOption('stablecoins', 'Stablecoins')
  const defi = createCategoryOption('defi', 'DeFi')
  const aiAgents = createCategoryOption('ai-agents', 'AI Agents')

  it('leads with name matches and trails with member-only matches, keeping BE order in each bucket', () => {
    const result = withCategoryOptions({
      activeTab: SearchTab.All,
      categoryOptions: [defi, stablecoins, aiAgents],
      options: tokenOptions,
      searchFilter: 'stable',
    })
    expect(result).toEqual([stablecoins, ...tokenOptions, defi, aiAgents])
  })

  it('matches the category id slug as well as the display name', () => {
    const result = withCategoryOptions({
      activeTab: SearchTab.All,
      categoryOptions: [aiAgents],
      options: tokenOptions,
      searchFilter: 'AI-AGENTS',
    })
    expect(result).toEqual([aiAgents, ...tokenOptions])
  })

  it('leaves the Tokens tab untouched', () => {
    const result = withCategoryOptions({
      activeTab: SearchTab.Tokens,
      categoryOptions: [defi],
      options: tokenOptions,
      searchFilter: 'defi',
    })
    expect(result).toBe(tokenOptions)
  })

  it('returns the same options when there are no category rows', () => {
    const result = withCategoryOptions({
      activeTab: SearchTab.All,
      categoryOptions: [],
      options: tokenOptions,
      searchFilter: 'defi',
    })
    expect(result).toBe(tokenOptions)
  })
})

describe('getTruncatedSectionKeys', () => {
  it('returns the All-tab sections with more options than fit', () => {
    expect(
      getTruncatedSectionKeys({
        activeTab: SearchTab.All,
        tokenOptionsLength: NUMBER_OF_RESULTS_ALL_TAB + 1,
        poolOptionsLength: NUMBER_OF_RESULTS_ALL_TAB,
        auctionOptionsLength: NUMBER_OF_RESULTS_ALL_TAB + 5,
      }),
    ).toEqual([OnchainItemSectionName.Tokens, OnchainItemSectionName.Auctions])
  })

  it('returns nothing outside the All tab', () => {
    expect(
      getTruncatedSectionKeys({
        activeTab: SearchTab.Tokens,
        tokenOptionsLength: NUMBER_OF_RESULTS_ALL_TAB + 1,
        poolOptionsLength: NUMBER_OF_RESULTS_ALL_TAB + 1,
        auctionOptionsLength: NUMBER_OF_RESULTS_ALL_TAB + 1,
      }),
    ).toEqual([])
  })
})
