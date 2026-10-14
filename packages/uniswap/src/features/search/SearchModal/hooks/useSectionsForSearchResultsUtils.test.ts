import { SearchType } from '@uniswap/client-data-api/dist/data/v2/search_pb'
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
  getSearchTypes,
  getTruncatedSectionKeys,
  SearchResultsForActiveTabParams,
  shouldSkipSearch,
  withCategoryOptions,
} from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForSearchResultsUtils'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

vi.mock('@universe/environment', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/environment')>()),
  isWebApp: true,
}))

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

function createCategoryOption(id: string, name: string, englishName = name): CategoryOption {
  return {
    type: OnchainItemListOptionType.Category,
    category: {
      id,
      name,
      englishName,
      description: '',
      categoryClass: TokenCategoryClass.Sector,
      grouped: false,
      topTokens: [],
      topGroups: [],
    },
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
    refetch: mockRefetch,
    searchError: null,
    searchLoading: false,
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
      const error = new Error('search failed')
      const auctionSection = createSection(OnchainItemSectionName.Auctions)

      const result = getSearchResultsForActiveTab(
        createSearchResultParams({
          activeTab: SearchTab.Auctions,
          auctionSearchResultsSection: [auctionSection],
          searchError: error,
          searchLoading: true,
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
          searchError: new Error('search failed'),
          searchLoading: true,
        }),
      )

      expect(result.isLoading).toBe(false)
      expect(result.error).toBeNull()
    })

    it('holds back the All tab sections while the combined search is loading', () => {
      const result = getSearchResultsForActiveTab(
        createSearchResultParams({
          activeTab: SearchTab.All,
          allSections: [createSection(OnchainItemSectionName.Tokens)],
          searchLoading: true,
        }),
      )

      expect(result.data).toEqual([])
      expect(result.isLoading).toBe(true)
    })

    it('surfaces the search error on the Tokens tab only when no token rows rendered', () => {
      const error = new Error('search failed')

      expect(
        getSearchResultsForActiveTab(
          createSearchResultParams({ activeTab: SearchTab.Tokens, searchError: error, tokenOptionsLength: 0 }),
        ).error,
      ).toBe(error)
      expect(
        getSearchResultsForActiveTab(
          createSearchResultParams({ activeTab: SearchTab.Tokens, searchError: error, tokenOptionsLength: 2 }),
        ).error,
      ).toBeNull()
    })
  })

  describe('shouldSkipSearch', () => {
    it('skips without a query or on the Wallets tab', () => {
      expect(shouldSkipSearch({ activeTab: SearchTab.All, searchFilter: null })).toBe(true)
      expect(shouldSkipSearch({ activeTab: SearchTab.All, searchFilter: '' })).toBe(true)
      expect(shouldSkipSearch({ activeTab: SearchTab.Wallets, searchFilter: 'vitalik' })).toBe(true)
    })

    it('runs on every other tab with a query', () => {
      for (const activeTab of [SearchTab.All, SearchTab.Tokens, SearchTab.Pools, SearchTab.Auctions]) {
        expect(shouldSkipSearch({ activeTab, searchFilter: 'usdc' })).toBe(false)
      }
    })
  })

  describe('getSearchTypes', () => {
    it('requests tokens and pools on web, adding auctions and categories when enabled', () => {
      expect(getSearchTypes({ auctionSearchEnabled: false, categorySearchEnabled: false })).toEqual([
        SearchType.TOKEN,
        SearchType.POOL,
      ])
      expect(getSearchTypes({ auctionSearchEnabled: true, categorySearchEnabled: true })).toEqual([
        SearchType.TOKEN,
        SearchType.POOL,
        SearchType.AUCTION,
        SearchType.CATEGORY,
      ])
    })
  })
})

describe('withCategoryOptions', () => {
  const tokenOptions = [createAuctionOption()]
  const stablecoins = createCategoryOption('stablecoins', 'Stablecoins')
  const defi = createCategoryOption('defi', 'DeFi')
  const aiAgents = createCategoryOption('ai-agents', 'AI Agents')

  it('leads with exact name matches and drops member-only and partial matches', () => {
    const result = withCategoryOptions({
      activeTab: SearchTab.All,
      categoryOptions: [defi, stablecoins, aiAgents],
      options: tokenOptions,
      searchFilter: ' Stablecoins ',
    })
    expect(result).toEqual([stablecoins, ...tokenOptions])
  })

  it('drops partial name matches', () => {
    const result = withCategoryOptions({
      activeTab: SearchTab.All,
      categoryOptions: [stablecoins, defi],
      options: tokenOptions,
      searchFilter: 's',
    })
    expect(result).toBe(tokenOptions)
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

  it('matches the English name when the display name is localized', () => {
    const localizedAiAgents = createCategoryOption('ai-agents', 'Agentes de IA', 'AI Agents')
    const result = withCategoryOptions({
      activeTab: SearchTab.All,
      categoryOptions: [localizedAiAgents],
      options: tokenOptions,
      searchFilter: 'ai agents',
    })
    expect(result).toEqual([localizedAiAgents, ...tokenOptions])
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
