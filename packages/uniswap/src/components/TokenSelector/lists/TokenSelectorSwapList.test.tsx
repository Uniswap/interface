import { FeatureFlags } from '@universe/gating'
import {
  OnchainItemListOptionType,
  type RwaTokenOption,
  type TokenOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useTokenSectionsForSwap } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorSwapList'
import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { AssetType, TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { renderHook } from 'uniswap/src/test/test-utils'

const {
  mockUseFeatureFlag,
  mockUseIsFeatureGated,
  mockUseRwaTokenOptions,
  mockUseCommonTokensOptionsWithFallback,
  mockUseBridgingTokensOptions,
} = vi.hoisted(() => ({
  mockUseFeatureFlag: vi.fn(),
  mockUseIsFeatureGated: vi.fn(),
  mockUseRwaTokenOptions: vi.fn(),
  mockUseCommonTokensOptionsWithFallback: vi.fn(),
  mockUseBridgingTokensOptions: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: (flag: FeatureFlags) => mockUseFeatureFlag(flag),
}))
vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useIsFeatureGated: () => mockUseIsFeatureGated(),
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

function renderSwapSections(
  variation: TokenSelectorVariation,
  options?: { chainFilter?: UniverseChainId | null; oppositeSelectedToken?: TradeableAsset },
): ReturnType<typeof useTokenSectionsForSwap> {
  const { result } = renderHook(() =>
    useTokenSectionsForSwap({
      addresses: { evmAddress: undefined, svmAddress: undefined },
      chainFilter: options?.chainFilter ?? null,
      oppositeSelectedToken: options?.oppositeSelectedToken,
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
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseIsFeatureGated.mockReturnValue(false)
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

  it('includes the Stocks section on SwapOutput when the region is not RWA-blocked', () => {
    const { data } = renderSwapSections(TokenSelectorVariation.SwapOutput)
    expect(hasStocksSection(data)).toBe(true)
  })

  it('does NOT include Stocks on SwapInput', () => {
    const { data } = renderSwapSections(TokenSelectorVariation.SwapInput)
    expect(hasStocksSection(data)).toBe(false)
  })

  it('does NOT include Stocks when the region is RWA-blocked', () => {
    mockUseIsFeatureGated.mockReturnValue(true)
    const { data } = renderSwapSections(TokenSelectorVariation.SwapOutput)
    expect(hasStocksSection(data)).toBe(false)
  })

  it('does NOT include Stocks when there are no RWA options', () => {
    mockUseRwaTokenOptions.mockReturnValue([])
    const { data } = renderSwapSections(TokenSelectorVariation.SwapOutput)
    expect(hasStocksSection(data)).toBe(false)
  })

  it('filters stocks by the input token chain when the chain filter is All Chains', () => {
    const inputToken: TradeableAsset = {
      address: '0x0000000000000000000000000000000000000001',
      chainId: UniverseChainId.Unichain,
      type: AssetType.Currency,
    }
    renderSwapSections(TokenSelectorVariation.SwapOutput, { oppositeSelectedToken: inputToken })
    expect(mockUseRwaTokenOptions).toHaveBeenCalledWith(
      expect.objectContaining({ chainFilter: UniverseChainId.Unichain }),
    )
  })

  it('filters stocks by the selected chain even when an input token is on another chain', () => {
    const inputToken: TradeableAsset = {
      address: '0x0000000000000000000000000000000000000001',
      chainId: UniverseChainId.Unichain,
      type: AssetType.Currency,
    }
    renderSwapSections(TokenSelectorVariation.SwapOutput, {
      chainFilter: UniverseChainId.Base,
      oppositeSelectedToken: inputToken,
    })
    expect(mockUseRwaTokenOptions).toHaveBeenCalledWith(expect.objectContaining({ chainFilter: UniverseChainId.Base }))
  })

  it('does not filter stocks when there is no chain filter and no input token', () => {
    renderSwapSections(TokenSelectorVariation.SwapOutput)
    expect(mockUseRwaTokenOptions).toHaveBeenCalledWith(expect.objectContaining({ chainFilter: null }))
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
