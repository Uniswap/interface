import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import {
  OnchainItemListOptionType,
  PoolOption,
  SearchModalListOption,
  SearchModalOption,
  TokenOption,
  WalletByAddressOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { useSearchModalOptionSelection } from 'uniswap/src/features/search/SearchModal/hooks/useSearchModalOptionSelection'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { benignSafetyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { renderHook } from 'uniswap/src/test/test-utils'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { tdpChainSelectionFromFilter } from 'uniswap/src/utils/linking'

const { mockContext, mockRegisterSearchItem } = vi.hoisted(() => ({
  mockContext: {
    navigateToTokenDetails: vi.fn(),
    navigateToExternalProfile: vi.fn(),
    navigateToPoolDetails: vi.fn(),
    navigateToEarnVault: vi.fn(),
    navigateToAuction: vi.fn(),
    getTokenDetailsUrl: vi.fn(() => 'token-url'),
    getPoolDetailsUrl: vi.fn(() => 'pool-url'),
    getExternalProfileUrl: vi.fn(() => 'profile-url'),
  },
  mockRegisterSearchItem: vi.fn(),
}))

// Keep the real provider (the test render wrapper mounts it) and only stub the consumer hook.
vi.mock('uniswap/src/contexts/UniswapContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/contexts/UniswapContext')>()),
  useUniswapContext: () => mockContext,
}))

vi.mock('uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory', () => ({
  useAddToSearchHistory: () => ({ registerSearchItem: mockRegisterSearchItem }),
}))

vi.mock('uniswap/src/features/search/SearchModal/analytics/analytics', () => ({
  sendSearchOptionItemClickedAnalytics: vi.fn(),
}))

const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001'
const WALLET_ADDRESS = '0x1111111111111111111111111111111111111111'
const POOL_ID = '0x2222222222222222222222222222222222222222'

const tokenCurrencyInfo = buildCurrencyInfo({
  currencyId: currencyId(new Token(UniverseChainId.Mainnet, TOKEN_ADDRESS, 18, 'TK', 'Token')),
  currency: new Token(UniverseChainId.Mainnet, TOKEN_ADDRESS, 18, 'TK', 'Token'),
  logoUrl: null,
  safetyInfo: benignSafetyInfo,
})

const tokenOption: TokenOption = {
  type: OnchainItemListOptionType.Token,
  currencyInfo: tokenCurrencyInfo,
  quantity: null,
  balanceUSD: undefined,
}

const poolOption: PoolOption = {
  type: OnchainItemListOptionType.Pool,
  poolId: POOL_ID,
  chainId: UniverseChainId.Mainnet,
  token0CurrencyInfo: tokenCurrencyInfo,
  token1CurrencyInfo: tokenCurrencyInfo,
  protocolVersion: ProtocolVersion.V3,
  feeTier: 3000,
}

const walletOption: WalletByAddressOption = { type: OnchainItemListOptionType.WalletByAddress, address: WALLET_ADDRESS }

const noFilters: SearchFilterContext = { searchChainFilter: null, searchTabFilter: SearchTab.All }

function selectionFor(item: SearchModalOption): {
  item: SearchModalOption
  section: OnchainItemSection<SearchModalListOption>
  index: number
  rowIndex: number
} {
  return { item, section: { sectionKey: OnchainItemSectionName.RecentSearches, data: [item] }, index: 0, rowIndex: 1 }
}

describe('useSearchModalOptionSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records history and analytics, navigates, then closes for a token', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() => useSearchModalOptionSelection({ searchFilters: noFilters, onSelect }))
    const selection = selectionFor(tokenOption)

    result.current.selectOption(selection)

    expect(mockRegisterSearchItem).toHaveBeenCalledWith(tokenOption, { tdpChainFilter: undefined })
    expect(sendSearchOptionItemClickedAnalytics).toHaveBeenCalledWith({
      item: tokenOption,
      section: selection.section,
      sectionIndex: 0,
      rowIndex: 1,
      searchFilters: noFilters,
      trace: {},
    })
    expect(mockContext.navigateToTokenDetails).toHaveBeenCalledWith(tokenCurrencyInfo.currencyId, undefined)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('carries the search chain filter into token history and navigation', () => {
    const searchFilters: SearchFilterContext = { ...noFilters, searchChainFilter: UniverseChainId.ArbitrumOne }
    const { result } = renderHook(() => useSearchModalOptionSelection({ searchFilters }))

    result.current.selectOption(selectionFor(tokenOption))

    expect(mockRegisterSearchItem).toHaveBeenCalledWith(tokenOption, { tdpChainFilter: UniverseChainId.ArbitrumOne })
    expect(mockContext.navigateToTokenDetails).toHaveBeenCalledWith(
      tokenCurrencyInfo.currencyId,
      tdpChainSelectionFromFilter(UniverseChainId.ArbitrumOne),
    )
    expect(result.current.getModifierPressHref(tokenOption)).toBe('token-url')
    expect(mockContext.getTokenDetailsUrl).toHaveBeenCalledWith(
      tokenCurrencyInfo.currencyId,
      tdpChainSelectionFromFilter(UniverseChainId.ArbitrumOne),
    )
  })

  it('navigates pools and wallets to their destinations', () => {
    const { result } = renderHook(() => useSearchModalOptionSelection({ searchFilters: noFilters }))

    result.current.selectOption(selectionFor(poolOption))
    expect(mockContext.navigateToPoolDetails).toHaveBeenCalledWith({
      poolId: POOL_ID,
      chainId: UniverseChainId.Mainnet,
    })
    expect(result.current.getModifierPressHref(poolOption)).toBe('pool-url')

    result.current.selectOption(selectionFor(walletOption))
    expect(mockContext.navigateToExternalProfile).toHaveBeenCalledWith({ address: WALLET_ADDRESS })
    expect(result.current.getModifierPressHref(walletOption)).toBe('profile-url')

    expect(mockRegisterSearchItem).toHaveBeenCalledTimes(2)
  })

  it('records a modifier press without navigating or closing', () => {
    const onSelect = vi.fn()
    const { result } = renderHook(() => useSearchModalOptionSelection({ searchFilters: noFilters, onSelect }))

    result.current.recordSelection(selectionFor(tokenOption))

    expect(mockRegisterSearchItem).toHaveBeenCalledTimes(1)
    expect(sendSearchOptionItemClickedAnalytics).toHaveBeenCalledTimes(1)
    expect(mockContext.navigateToTokenDetails).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
  })
})
