import { Token } from '@uniswap/sdk-core'
import {
  AuctionOption,
  MultichainTokenOption,
  OnchainItemListOptionType,
  RwaCollectionOption,
  TokenOption,
  UnitagOption,
  WalletOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { InterfaceEventName, MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { Mock } from 'vitest'

// Use vi.hoisted to create a mutable mock value that can be changed between tests
const mockPlatformState = vi.hoisted(() => ({ isMobileApp: false }))

vi.mock('uniswap/src/features/telemetry/send')
vi.mock('@universe/environment', () => ({
  get isMobileApp(): boolean {
    return mockPlatformState.isMobileApp
  },
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

const MOCK_MULTICHAIN_TOKEN: MultichainTokenOption = {
  type: OnchainItemListOptionType.MultichainToken,
  multichainResult: {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    logoUrl: 'https://example.com/usdc.png',
    tokens: [
      {
        currency: {
          chainId: 1,
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          name: 'USD Coin',
          decimals: 6,
        } as Token,
        currencyId: '1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        logoUrl: 'https://example.com/usdc.png',
      },
      {
        currency: {
          chainId: 130,
          address: '0x345',
          name: 'USD Coin',
          decimals: 6,
        } as Token,
        currencyId: '130_0x345',
        logoUrl: 'https://example.com/usdc.png',
      },
    ],
  },
  primaryCurrencyInfo: {
    currency: {
      chainId: 1,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      name: 'USD Coin',
      decimals: 6,
    } as Token,
    currencyId: '1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    logoUrl: 'https://example.com/usdc.png',
  },
}

const MOCK_RWA_COLLECTION: RwaCollectionOption = {
  type: OnchainItemListOptionType.RwaCollection,
  showCategoryTag: true,
  rwa: {
    symbol: 'TSLA',
    name: 'Tesla',
    logoUrl: '',
    priceUsd: 0,
    volume24hUsd: 0,
    sparkline1d: { points: [] },
    issuerTokens: [
      {
        symbol: 'TSLAON',
        name: 'Tesla',
        logoUrl: '',
        issuer: 'ondo',
        priceUsd: 0,
        volume24hUsd: 0,
        sparkline1d: { points: [] },
        chainTokens: [{ chainId: 1, address: '0xaaa' }],
      },
    ],
  },
}

const MOCK_AUCTION: AuctionOption = {
  type: OnchainItemListOptionType.Auction,
  auctionId: '1_0xauction',
  auctionAddress: '0xauction',
  chainId: UniverseChainId.Mainnet,
  tokenAddress: '0xtoken',
  tokenSymbol: 'AUCT',
  tokenName: 'Auction Token',
  tokenLogoUrl: undefined,
  currencyInfo: null,
  committedVolumeUsd: undefined,
  isVerified: true,
}

describe('sendSearchOptionItemClickedAnalytics', () => {
  const mockSendAnalyticsEvent = sendAnalyticsEvent as Mock

  beforeEach(() => {
    vi.clearAllMocks()
    mockPlatformState.isMobileApp = false
  })

  it('sends token analytics event on mobile', () => {
    mockPlatformState.isMobileApp = true

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
    mockPlatformState.isMobileApp = false

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
      token_type: 'token',
      total_suggestions: 2,
      query_text: 'test',
      selected_search_result_name: 'Test Token 1',
      selected_search_result_address: '0x123',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Tokens,
    })
  })

  it('sends multichain token analytics event on web', () => {
    mockPlatformState.isMobileApp = false

    const mockSection: OnchainItemSection<MultichainTokenOption> = {
      sectionKey: OnchainItemSectionName.Tokens,
      data: [MOCK_MULTICHAIN_TOKEN],
    }
    const mockSearchFilters: SearchFilterContext = {
      query: 'usdc',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Tokens,
    }

    sendSearchOptionItemClickedAnalytics({
      item: MOCK_MULTICHAIN_TOKEN,
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
      suggestionCount: 1,
      query: 'usdc',
      chainId: 1,
      suggestion_type: 'token-suggestion',
      token_type: 'multichain_token',
      total_suggestions: 1,
      query_text: 'usdc',
      selected_search_result_name: 'USD Coin',
      selected_search_result_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Tokens,
    })
  })

  it('sends rwa collection analytics event on web, keyed on the tapped issuer (NavbarResultSelected)', () => {
    mockPlatformState.isMobileApp = false

    const mockSection: OnchainItemSection<RwaCollectionOption> = {
      sectionKey: OnchainItemSectionName.Tokens,
      data: [MOCK_RWA_COLLECTION],
    }
    const mockSearchFilters: SearchFilterContext = {
      query: 'tesla',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Tokens,
    }

    sendSearchOptionItemClickedAnalytics({
      item: MOCK_RWA_COLLECTION,
      section: mockSection,
      rowIndex: 1,
      sectionIndex: 0,
      searchFilters: mockSearchFilters,
      // A different issuer than issuerTokens[0] (address 0xaaa) was tapped: analytics must reflect 0xbbb.
      rwaSelection: { chainId: UniverseChainId.Mainnet, address: '0xbbb' },
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.NavbarResultSelected, {
      category: OnchainItemSectionName.Tokens,
      isHistory: false,
      position: 1,
      sectionPosition: 1,
      suggestionCount: 1,
      query: 'tesla',
      chainId: UniverseChainId.Mainnet,
      suggestion_type: 'token-suggestion',
      token_type: 'token',
      total_suggestions: 1,
      query_text: 'tesla',
      selected_search_result_name: 'Tesla',
      selected_search_result_address: '0xbbb',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Tokens,
    })
  })

  it('sends rwa collection analytics event on mobile (ExploreSearchResultClicked)', () => {
    mockPlatformState.isMobileApp = true

    const mockSection: OnchainItemSection<RwaCollectionOption> = {
      sectionKey: OnchainItemSectionName.Tokens,
      data: [MOCK_RWA_COLLECTION],
    }
    const mockSearchFilters: SearchFilterContext = {
      query: 'tesla',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Tokens,
    }

    sendSearchOptionItemClickedAnalytics({
      item: MOCK_RWA_COLLECTION,
      section: mockSection,
      rowIndex: 1,
      sectionIndex: 0,
      searchFilters: mockSearchFilters,
      rwaSelection: { chainId: UniverseChainId.Mainnet, address: '0xbbb' },
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(MobileEventName.ExploreSearchResultClicked, {
      category: OnchainItemSectionName.Tokens,
      isHistory: false,
      position: 1,
      sectionPosition: 1,
      suggestionCount: 1,
      query: 'tesla',
      name: 'Tesla',
      chain: UniverseChainId.Mainnet,
      address: '0xbbb',
      type: 'token',
      searchChainFilter: null,
      searchTabFilter: SearchTab.Tokens,
    })
  })

  it('sends wallet address analytics event', () => {
    mockPlatformState.isMobileApp = true
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

  it('sends top auction analytics event on web', () => {
    mockPlatformState.isMobileApp = false

    const mockSection: OnchainItemSection<AuctionOption> = {
      sectionKey: OnchainItemSectionName.TopAuctions,
      data: [MOCK_AUCTION],
    }
    const mockSearchFilters: SearchFilterContext = {
      searchChainFilter: null,
      searchTabFilter: SearchTab.All,
    }

    sendSearchOptionItemClickedAnalytics({
      item: MOCK_AUCTION,
      section: mockSection,
      rowIndex: 1,
      sectionIndex: 4,
      searchFilters: mockSearchFilters,
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.NavbarResultSelected, {
      category: OnchainItemSectionName.TopAuctions,
      isHistory: false,
      position: 1,
      sectionPosition: 5,
      suggestionCount: 1,
      chainId: UniverseChainId.Mainnet,
      suggestion_type: 'auction-trending',
      total_suggestions: 1,
      query_text: '',
      selected_search_result_name: 'Auction Token',
      selected_search_result_address: '0xauction',
      searchChainFilter: null,
      searchTabFilter: SearchTab.All,
    })
  })
})
