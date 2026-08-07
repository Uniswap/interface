import { GatedFeature } from '@universe/compliance'
import { FeatureFlags } from '@universe/gating'
import { OnchainItemListOptionType, type TokenOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { useTokenSectionsForSwapV2 } from 'uniswap/src/components/TokenSelectorV2/hooks/useTokenSectionsForSwapV2'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { renderHook } from 'uniswap/src/test/test-utils'

const {
  mockUseFeatureFlag,
  mockUseIsFeatureGated,
  mockUseRwaTokenOptions,
  mockUseCommonTokensOptionsWithFallback,
  mockUseBridgingTokensOptions,
  mockUsePortfolioTokenOptions,
  mockUseRecentlySearchedTokens,
  mockUseTrendingTokensOptionsV2,
  mockUseEnabledChains,
} = vi.hoisted(() => ({
  mockUseFeatureFlag: vi.fn(),
  mockUseIsFeatureGated: vi.fn(),
  mockUseRwaTokenOptions: vi.fn(),
  mockUseCommonTokensOptionsWithFallback: vi.fn(),
  mockUseBridgingTokensOptions: vi.fn(),
  mockUsePortfolioTokenOptions: vi.fn(),
  mockUseRecentlySearchedTokens: vi.fn(),
  mockUseTrendingTokensOptionsV2: vi.fn(),
  mockUseEnabledChains: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: (flag: FeatureFlags) => mockUseFeatureFlag(flag),
}))
vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useIsFeatureGated: (feature: GatedFeature) => mockUseIsFeatureGated(feature),
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
vi.mock('uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions', () => ({
  usePortfolioTokenOptions: mockUsePortfolioTokenOptions,
}))
vi.mock('uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens', () => ({
  useRecentlySearchedTokens: mockUseRecentlySearchedTokens,
}))
vi.mock('uniswap/src/components/TokenSelectorV2/hooks/useTrendingTokensOptionsV2', () => ({
  useTrendingTokensOptionsV2: mockUseTrendingTokensOptionsV2,
}))
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

const tokenOption = {
  type: OnchainItemListOptionType.Token,
  currencyInfo: { currencyId: 'token-currency-id' },
} as TokenOption

const rwaOption = {
  type: OnchainItemListOptionType.Rwa,
  chainId: 1,
  address: '0x1',
  symbol: 'GOOGLX',
  name: 'Alphabet',
}

const emptyPortfolioData: PortfolioBalancesResult = {
  data: undefined,
  error: undefined,
  refetch: vi.fn(),
  loading: false,
}

function gqlResult<T>(data: T): { data: T; error: undefined; refetch: () => void; loading: boolean } {
  return { data, error: undefined, refetch: vi.fn(), loading: false }
}

function renderSwapSectionsV2(
  variation: TokenSelectorVariation,
  options?: { includeYourTokens?: boolean },
): ReturnType<typeof useTokenSectionsForSwapV2> {
  const { result } = renderHook(() =>
    useTokenSectionsForSwapV2({
      chainFilter: null,
      variation,
      includeYourTokens: options?.includeYourTokens ?? true,
      portfolioData: emptyPortfolioData,
    }),
  )
  return result.current
}

describe('useTokenSectionsForSwapV2', () => {
  beforeEach(() => {
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseIsFeatureGated.mockReturnValue(false)
    mockUseRwaTokenOptions.mockReturnValue([])
    mockUseCommonTokensOptionsWithFallback.mockReturnValue(gqlResult([tokenOption]))
    mockUseBridgingTokensOptions.mockReturnValue({ ...gqlResult([tokenOption]), shouldNest: false })
    mockUsePortfolioTokenOptions.mockReturnValue(gqlResult([tokenOption]))
    mockUseRecentlySearchedTokens.mockReturnValue([tokenOption])
    mockUseTrendingTokensOptionsV2.mockReturnValue(gqlResult([tokenOption]))
    mockUseEnabledChains.mockReturnValue({
      chains: [UniverseChainId.Mainnet],
      gqlChains: [],
      defaultChainId: UniverseChainId.Mainnet,
      isTestnetModeEnabled: false,
    })
  })

  it('orders sections Recent → Suggested → Bridging → Your tokens → Trending on single-pane input', () => {
    const { data } = renderSwapSectionsV2(TokenSelectorVariation.SwapInput)
    const keys = (data ?? []).map((section) => section.sectionKey)

    expect(keys).toEqual([
      OnchainItemSectionName.RecentSearches,
      OnchainItemSectionName.SuggestedTokens,
      OnchainItemSectionName.BridgingTokens,
      OnchainItemSectionName.YourTokens,
      OnchainItemSectionName.TrendingTokens,
    ])
  })

  it('excludes Your tokens from the list when the sidebar owns it (dual-pane)', () => {
    const { data } = renderSwapSectionsV2(TokenSelectorVariation.SwapInput, { includeYourTokens: false })
    const keys = (data ?? []).map((section) => section.sectionKey)

    expect(keys).not.toContain(OnchainItemSectionName.YourTokens)
    expect(keys).toContain(OnchainItemSectionName.TrendingTokens)
  })

  it('includes Stocks between Suggested and Bridging on SwapOutput when RWA is available', () => {
    mockUseRwaTokenOptions.mockReturnValue([rwaOption])
    const { data } = renderSwapSectionsV2(TokenSelectorVariation.SwapOutput)
    const keys = (data ?? []).map((section) => section.sectionKey)

    expect(keys.indexOf(OnchainItemSectionName.Stocks)).toBeGreaterThan(
      keys.indexOf(OnchainItemSectionName.SuggestedTokens),
    )
    expect(keys.indexOf(OnchainItemSectionName.Stocks)).toBeLessThan(
      keys.indexOf(OnchainItemSectionName.BridgingTokens),
    )
  })

  it('does NOT include Stocks on SwapInput', () => {
    mockUseRwaTokenOptions.mockReturnValue([rwaOption])
    const { data } = renderSwapSectionsV2(TokenSelectorVariation.SwapInput)
    const keys = (data ?? []).map((section) => section.sectionKey)

    expect(keys).not.toContain(OnchainItemSectionName.Stocks)
  })

  it('does NOT include Stocks on SwapOutput when the RWA region is blocked, and disables the RWA query', () => {
    mockUseIsFeatureGated.mockReturnValue(true)
    mockUseRwaTokenOptions.mockReturnValue([rwaOption])
    const { data } = renderSwapSectionsV2(TokenSelectorVariation.SwapOutput)
    const keys = (data ?? []).map((section) => section.sectionKey)

    expect(keys).not.toContain(OnchainItemSectionName.Stocks)
    expect(mockUseIsFeatureGated).toHaveBeenCalledWith(GatedFeature.ISSUER_SPECIFIC_RWA)
    expect(mockUseRwaTokenOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('wraps Recent options as a single horizontal pill-row item', () => {
    const { data } = renderSwapSectionsV2(TokenSelectorVariation.SwapInput)
    const recentSection = data?.find((section) => section.sectionKey === OnchainItemSectionName.RecentSearches)

    expect(recentSection?.data).toHaveLength(1)
    expect(Array.isArray(recentSection?.data[0])).toBe(true)
  })

  it('omits the Recent section when there are no recent searches', () => {
    mockUseRecentlySearchedTokens.mockReturnValue([])
    const { data } = renderSwapSectionsV2(TokenSelectorVariation.SwapInput)
    const keys = (data ?? []).map((section) => section.sectionKey)

    expect(keys).not.toContain(OnchainItemSectionName.RecentSearches)
  })

  it('returns only Suggested and Your tokens in testnet mode', () => {
    mockUseEnabledChains.mockReturnValue({
      chains: [UniverseChainId.Sepolia],
      gqlChains: [],
      defaultChainId: UniverseChainId.Sepolia,
      isTestnetModeEnabled: true,
    })
    const { data } = renderSwapSectionsV2(TokenSelectorVariation.SwapInput)
    const keys = (data ?? []).map((section) => section.sectionKey)

    expect(keys).toEqual([OnchainItemSectionName.SuggestedTokens, OnchainItemSectionName.YourTokens])
  })

  it('surfaces a source error when that source has no data', () => {
    mockUseTrendingTokensOptionsV2.mockReturnValue({
      data: undefined,
      error: new Error('trending down'),
      refetch: vi.fn(),
      loading: false,
    })
    const result = renderSwapSectionsV2(TokenSelectorVariation.SwapInput)

    expect(result.error).toBeInstanceOf(Error)
  })

  it('suppresses a source error when stale data is still present', () => {
    mockUseTrendingTokensOptionsV2.mockReturnValue({
      data: [tokenOption],
      error: new Error('trending down'),
      refetch: vi.fn(),
      loading: false,
    })
    const result = renderSwapSectionsV2(TokenSelectorVariation.SwapInput)

    expect(result.error).toBeUndefined()
    expect(result.data?.map((section) => section.sectionKey)).toContain(OnchainItemSectionName.TrendingTokens)
  })

  it('fans refetch out to all four underlying refetches', () => {
    const refetches = [vi.fn(), vi.fn(), vi.fn(), vi.fn()] as const
    mockUsePortfolioTokenOptions.mockReturnValue({ ...gqlResult([tokenOption]), refetch: refetches[0] })
    mockUseTrendingTokensOptionsV2.mockReturnValue({ ...gqlResult([tokenOption]), refetch: refetches[1] })
    mockUseCommonTokensOptionsWithFallback.mockReturnValue({ ...gqlResult([tokenOption]), refetch: refetches[2] })
    mockUseBridgingTokensOptions.mockReturnValue({
      ...gqlResult([tokenOption]),
      shouldNest: false,
      refetch: refetches[3],
    })

    const result = renderSwapSectionsV2(TokenSelectorVariation.SwapInput)
    result.refetch?.()

    refetches.forEach((refetch) => expect(refetch).toHaveBeenCalledTimes(1))
  })
})
