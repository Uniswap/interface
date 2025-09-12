import { Token } from '@uniswap/sdk-core'
import {
  NFTCollectionOption,
  OnchainItemListOptionType,
  TokenOption,
  UnitagOption,
  WalletOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { InterfaceEventName, MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

jest.mock('uniswap/src/features/telemetry/send')
jest.mock('utilities/src/platform', () => ({
  isMobileApp: false,
}))

const MOCK_TOKEN1: TokenOption = {
  type: OnchainItemListOptionType.Token,
  currencyInfo: {
    currency: {
      chainId: 1,
      address: '0x123',
      name: 'Test Token 1',
      decimals: 18,
    } as Token,
    currencyId: '1_0x123',
    logoUrl: 'https://example.com/logo.png',
  },
  quantity: null,
  balanceUSD: undefined,
}

const MOCK_TOKEN2: TokenOption = {
  type: OnchainItemListOptionType.Token,
  currencyInfo: {
    currency: {
      chainId: 130,
      address: '0x345',
      name: 'Test Token 2',
      decimals: 18,
    } as Token,
    currencyId: '130_0x345',
    logoUrl: 'https://example.com/logo.png',
  },
  quantity: null,
  balanceUSD: undefined,
}

const MOCK_NFT: NFTCollectionOption = {
  type: OnchainItemListOptionType.NFTCollection,
  chainId: 1,
  address: '0x789',
  name: 'Test Collection',
  imageUrl: 'https://example.com/nft.png',
  isVerified: true,
}

describe('sendSearchOptionItemClickedAnalytics', () => {
  const mockSendAnalyticsEvent = sendAnalyticsEvent as jest.Mock
  const platformModule = require('utilities/src/platform')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends token analytics event on mobile', () => {
    platformModule.isMobileApp = true

    const mockSection: OnchainItemSection<TokenOption> = {
      sectionKey: OnchainItemSectionName.TrendingTokens,
      data: [MOCK_TOKEN1, MOCK_TOKEN1, MOCK_TOKEN2],
    }
    const mockSearchFilters: SearchFilterContext = {
      query: 'test',
      searchChainFilter: null,
      searchTabFilter: SearchTab.All,
    }

    sendSearchOptionItemClickedAnalytics({
      item: MOCK_TOKEN2,
      section: mockSection,
      rowIndex: 3,
      sectionIndex: 2,
      searchFilters: mockSearchFilters,
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(MobileEventName.ExploreSearchResultClicked, {
      category: OnchainItemSectionName.TrendingTokens,
      isHistory: false,
      position: 3,
      sectionPosition: 3,
      suggestionCount: 3,
      query: 'test',
      name: 'Test Token 2',
      chain: 130,
      address: '0x345',
      type: 'token',
      searchChainFilter: null,
      searchTabFilter: SearchTab.All,
    })
  })

  it('sends token analytics event on web', () => {
    platformModule.isMobileApp = false

    const mockSection: OnchainItemSection<TokenOption> = {
      sectionKey: OnchainItemSectionName.Tokens,
      data: [MOCK_TOKEN1, MOCK_TOKEN2],
    }
    const mockSearchFilters: SearchFilterContext = {
      query: 'test',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Tokens,
    }

    sendSearchOptionItemClickedAnalytics({
      item: MOCK_TOKEN1,
      section: mockSection,
      rowIndex: 1,
      sectionIndex: 0,
      searchFilters: mockSearchFilters,
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.NavbarResultSelected, {
      category: OnchainItemSectionName.Tokens,
      isHistory: false,
      position: 1,
      sectionPosition: 1,
      suggestionCount: 2,
      query: 'test',
      chainId: 1,
      suggestion_type: 'token-suggestion',
      total_suggestions: 2,
      query_text: 'test',
      selected_search_result_name: 'Test Token 1',
      selected_search_result_address: '0x123',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Tokens,
    })
  })

  it('sends wallet address analytics event', () => {
    platformModule.isMobileApp = true
    const mockWallet: UnitagOption = {
      type: OnchainItemListOptionType.Unitag,
      address: '0x456',
      unitag: 'test-unitag.uni.eth',
    }
    const mockSection: OnchainItemSection<WalletOption> = {
      sectionKey: OnchainItemSectionName.Wallets,
      data: [mockWallet],
    }
    const mockSearchFilters: SearchFilterContext = {
      query: 'test',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Wallets,
    }

    sendSearchOptionItemClickedAnalytics({
      item: mockWallet,
      section: mockSection,
      rowIndex: 1,
      sectionIndex: 0,
      searchFilters: mockSearchFilters,
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(MobileEventName.ExploreSearchResultClicked, {
      category: OnchainItemSectionName.Wallets,
      isHistory: false,
      position: 1,
      sectionPosition: 1,
      suggestionCount: 1,
      query: 'test',
      address: '0x456',
      type: 'address',
      searchChainFilter: null,
      name: 'test-unitag.uni.eth',
      domain: '.uni.eth',
      searchTabFilter: SearchTab.Wallets,
    })
  })

  it('sends nft analytics event', () => {
    platformModule.isMobileApp = true
    const mockSection: OnchainItemSection<NFTCollectionOption> = {
      sectionKey: OnchainItemSectionName.NFTCollections,
      data: [MOCK_NFT],
    }
    const mockSearchFilters: SearchFilterContext = {
      query: 'test',
      searchChainFilter: null,
      searchTabFilter: SearchTab.NFTCollections,
    }

    sendSearchOptionItemClickedAnalytics({
      item: MOCK_NFT,
      section: mockSection,
      rowIndex: 1,
      sectionIndex: 0,
      searchFilters: mockSearchFilters,
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(MobileEventName.ExploreSearchResultClicked, {
      category: OnchainItemSectionName.NFTCollections,
      isHistory: false,
      position: 1,
      sectionPosition: 1,
      suggestionCount: 1,
      query: 'test',
      name: 'Test Collection',
      chain: 1,
      address: '0x789',
      type: 'collection',
      searchChainFilter: null,
      searchTabFilter: SearchTab.NFTCollections,
    })
  })
})
