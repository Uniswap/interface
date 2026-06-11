import { FeatureFlags } from '@universe/gating'
import {
  OnchainItemListOptionType,
  type RwaTokenOption,
  type TokenOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useTokenSectionsForSwap } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorSwapList'
import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { renderHook } from 'uniswap/src/test/test-utils'

const {
  mockUseFeatureFlag,
  mockUseRwaTokenOptions,
  mockUseCommonTokensOptionsWithFallback,
  mockUseBridgingTokensOptions,
} = vi.hoisted(() => ({
  mockUseFeatureFlag: vi.fn(),
  mockUseRwaTokenOptions: vi.fn(),
  mockUseCommonTokensOptionsWithFallback: vi.fn(),
  mockUseBridgingTokensOptions: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: (flag: FeatureFlags) => mockUseFeatureFlag(flag),
}))
vi.mock('uniswap/src/components/TokenSelector/hooks/useRwaTokenOptions', () => ({
  useRwaTokenOptions: mockUseRwaTokenOptions,
}))
vi.mock('uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback', () => ({
  useCommonTokensOptionsWithFallback: mockUseCommonTokensOptionsWithFallback,
}))
vi.mock('uniswap/src/features/bridging/hooks/tokens', () => ({
  useBridgingTokensOptions: mockUseBridgingTokensOptions,
}))
// Bypass the async data-loading gate so the assembled sections are computed synchronously,
// isolating the test to the Stocks-section assembly logic (which doesn't depend on it).
vi.mock('uniswap/src/components/TokenSelector/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/components/TokenSelector/utils')>()),
  isSwapListLoading: () => false,
}))

const stock: RwaTokenOption = {
  type: OnchainItemListOptionType.Rwa,
  chainId: UniverseChainId.Bnb,
  address: '0xe92f673ca36c5e2efd2de7628f815f84807e803f',
  symbol: 'GOOGLX',
  name: 'Alphabet',
}

const tokenOption = {
  type: OnchainItemListOptionType.Token,
  currencyInfo: { currencyId: 'token-currency-id' },
} as TokenOption

function renderSwapSections(variation: TokenSelectorVariation): ReturnType<typeof useTokenSectionsForSwap> {
  const { result } = renderHook(() =>
    useTokenSectionsForSwap({
      addresses: { evmAddress: undefined, svmAddress: undefined },
      chainFilter: null,
      variation,
    }),
  )
  return result.current
}

function hasStocksSection(sections: ReturnType<typeof useTokenSectionsForSwap>['data']): boolean {
  return Boolean(sections?.some((section) => section.sectionKey === OnchainItemSectionName.Stocks))
}

describe('useTokenSectionsForSwap Stocks section', () => {
  beforeEach(() => {
    mockUseRwaTokenOptions.mockReturnValue([stock])
    mockUseFeatureFlag.mockImplementation((flag: FeatureFlags) => flag === FeatureFlags.RwaUxTokenSelector)
    mockUseCommonTokensOptionsWithFallback.mockReturnValue({
      data: undefined,
      error: undefined,
      refetch: vi.fn(),
      loading: false,
    })
    mockUseBridgingTokensOptions.mockReturnValue({
      data: undefined,
      error: undefined,
      refetch: vi.fn(),
      loading: false,
      shouldNest: false,
    })
  })

  it('includes the Stocks section on SwapOutput when the flag is on', () => {
    const { data } = renderSwapSections(TokenSelectorVariation.SwapOutput)
    expect(hasStocksSection(data)).toBe(true)
  })

  it('does NOT include Stocks on SwapInput', () => {
    const { data } = renderSwapSections(TokenSelectorVariation.SwapInput)
    expect(hasStocksSection(data)).toBe(false)
  })

  it('does NOT include Stocks when the flag is off', () => {
    mockUseFeatureFlag.mockReturnValue(false)
    const { data } = renderSwapSections(TokenSelectorVariation.SwapOutput)
    expect(hasStocksSection(data)).toBe(false)
  })

  it('does NOT include Stocks when there are no RWA options', () => {
    mockUseRwaTokenOptions.mockReturnValue([])
    const { data } = renderSwapSections(TokenSelectorVariation.SwapOutput)
    expect(hasStocksSection(data)).toBe(false)
  })

  it('orders Stocks between Suggested and Bridging when both neighbors are present', () => {
    mockUseCommonTokensOptionsWithFallback.mockReturnValue({
      data: [tokenOption],
      error: undefined,
      refetch: vi.fn(),
      loading: false,
    })
    mockUseBridgingTokensOptions.mockReturnValue({
      data: [tokenOption],
      error: undefined,
      refetch: vi.fn(),
      loading: false,
      shouldNest: false,
    })

    const { data } = renderSwapSections(TokenSelectorVariation.SwapOutput)
    const keys = (data ?? []).map((section) => section.sectionKey)

    expect(keys).toContain(OnchainItemSectionName.SuggestedTokens)
    expect(keys).toContain(OnchainItemSectionName.Stocks)
    expect(keys).toContain(OnchainItemSectionName.BridgingTokens)
    expect(keys.indexOf(OnchainItemSectionName.Stocks)).toBeGreaterThan(
      keys.indexOf(OnchainItemSectionName.SuggestedTokens),
    )
    expect(keys.indexOf(OnchainItemSectionName.Stocks)).toBeLessThan(
      keys.indexOf(OnchainItemSectionName.BridgingTokens),
    )
  })
})
