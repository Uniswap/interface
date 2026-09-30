import { waitFor } from '@testing-library/react-native'
import { SharedQueryClient } from '@universe/api'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useSpotlitCategorySections } from 'uniswap/src/features/search/SearchModal/hooks/useSpotlitCategorySections'
import { TokenCategoryClass, type TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const {
  mockUseEnabledChains,
  mockV2ListTokens,
  mockUseIsTokenCategoriesEnabled,
  mockUseDynamicConfigValue,
  mockUseIsFeatureGated,
} = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockV2ListTokens: vi.fn(),
  mockUseIsTokenCategoriesEnabled: vi.fn(),
  mockUseDynamicConfigValue: vi.fn(),
  mockUseIsFeatureGated: vi.fn(),
}))

vi.mock('@universe/compliance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/compliance')>()),
  useIsFeatureGated: mockUseIsFeatureGated,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: mockUseIsTokenCategoriesEnabled,
  useDynamicConfigValue: mockUseDynamicConfigValue,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2')>()),
  dataApiServiceClientV2: { listTokens: mockV2ListTokens },
}))

function category(id: string, name: string): TokenCategory {
  return { id, name, description: '', categoryClass: TokenCategoryClass.Market, grouped: false, topTokens: [] }
}

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories', () => ({
  useAllTokenCategories: (): { categories: TokenCategory[]; isLoading: boolean } => ({
    categories: [
      category('stocks', 'Stocks'),
      category('trending', 'Trending'),
      category('top-gainers', 'Top Gainers'),
    ],
    isLoading: false,
  }),
}))

describe('useSpotlitCategorySections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
    mockUseEnabledChains.mockReturnValue({ chains: [1, 137] })
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    mockUseIsFeatureGated.mockReturnValue(false)
    mockUseDynamicConfigValue.mockReturnValue(['trending', 'stocks'])
  })

  it('is disabled and fetches nothing when the flag is off', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)

    const { result } = renderHookWithProviders(() =>
      useSpotlitCategorySections({ chainFilter: null, tokenCount: 5, skip: false }),
    )

    expect(result.current.enabled).toBe(false)
    expect(result.current.sections).toEqual([])
    expect(mockV2ListTokens).not.toHaveBeenCalled()
  })

  it('is disabled when the spotlight config is empty', () => {
    mockUseDynamicConfigValue.mockReturnValue([])

    const { result } = renderHookWithProviders(() =>
      useSpotlitCategorySections({ chainFilter: null, tokenCount: 5, skip: false }),
    )

    expect(result.current.enabled).toBe(false)
    expect(mockV2ListTokens).not.toHaveBeenCalled()
  })

  it('requests one category-filtered ListTokens page per spotlit category', async () => {
    mockV2ListTokens.mockResolvedValue({ multichainTokens: [] })

    renderHookWithProviders(() => useSpotlitCategorySections({ chainFilter: 1, tokenCount: 3, skip: false }))

    await waitFor(() => expect(mockV2ListTokens).toHaveBeenCalledTimes(2))
    expect(mockV2ListTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        chainIds: [1],
        page: { pageSize: 3 },
        filter: expect.objectContaining({ categoryIds: ['trending'] }),
      }),
    )
    expect(mockV2ListTokens).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.objectContaining({ categoryIds: ['stocks'] }) }),
    )
  })

  it('builds category-scoped sections in config order and omits empty categories', async () => {
    mockV2ListTokens.mockImplementation(({ filter }: { filter: { categoryIds: string[] } }) =>
      Promise.resolve({
        multichainTokens:
          filter.categoryIds[0] === 'stocks'
            ? [createRankedMultichainToken({ symbol: 'TSLAon', categoryIds: ['stocks', 'low-volatility'] })]
            : [],
      }),
    )
    mockUseDynamicConfigValue.mockReturnValue(['trending', 'stocks'])

    const { result } = renderHookWithProviders(() =>
      useSpotlitCategorySections({ chainFilter: null, tokenCount: 5, skip: false }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.sections).toHaveLength(1)
    expect(result.current.sections[0]).toEqual(
      expect.objectContaining({
        sectionKey: OnchainItemSectionName.Category,
        sectionId: 'category-stocks',
        categoryId: 'stocks',
        name: 'Stocks',
      }),
    )
    expect(result.current.sections[0]?.data).toHaveLength(1)
  })
})

describe('useSpotlitCategorySections resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
    mockUseEnabledChains.mockReturnValue({ chains: [1, 137] })
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    mockUseIsFeatureGated.mockReturnValue(false)
  })

  it('drops RWA categories for RWA-blocked regions', async () => {
    mockUseIsFeatureGated.mockReturnValue(true)
    mockUseDynamicConfigValue.mockReturnValue(['stocks', 'trending'])
    mockV2ListTokens.mockResolvedValue({ multichainTokens: [] })

    renderHookWithProviders(() => useSpotlitCategorySections({ chainFilter: null, tokenCount: 5, skip: false }))

    await waitFor(() => expect(mockV2ListTokens).toHaveBeenCalledTimes(1))
    expect(mockV2ListTokens).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.objectContaining({ categoryIds: ['trending'] }) }),
    )
  })

  it('hands the shelf back once every configured category settles empty', async () => {
    mockUseDynamicConfigValue.mockReturnValue(['trending'])
    mockV2ListTokens.mockResolvedValue({ multichainTokens: [] })

    const { result } = renderHookWithProviders(() =>
      useSpotlitCategorySections({ chainFilter: null, tokenCount: 5, skip: false }),
    )

    expect(result.current.enabled).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.enabled).toBe(false)
    expect(result.current.sections).toEqual([])
  })

  it('renders flat single-chain Token rows when a network filter is set', async () => {
    mockUseDynamicConfigValue.mockReturnValue(['stocks'])
    mockV2ListTokens.mockResolvedValue({
      multichainTokens: [
        createRankedMultichainToken({
          symbol: 'TSLAon',
          chainId: 1,
          addresses: {
            '1': '0x1111111111111111111111111111111111111111',
            '137': '0x2222222222222222222222222222222222222222',
          },
        }),
      ],
    })

    const { result } = renderHookWithProviders(() =>
      useSpotlitCategorySections({ chainFilter: 1, tokenCount: 5, skip: false }),
    )

    await waitFor(() => expect(result.current.sections).toHaveLength(1))
    const rows = result.current.sections[0]?.data ?? []
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual(
      expect.objectContaining({
        type: OnchainItemListOptionType.Token,
        currencyInfo: expect.objectContaining({ currency: expect.objectContaining({ chainId: 1 }) }),
      }),
    )
  })

  it('hands the shelf back to the legacy sections when no configured id resolves', () => {
    mockUseDynamicConfigValue.mockReturnValue(['renamed-upstream'])

    const { result } = renderHookWithProviders(() =>
      useSpotlitCategorySections({ chainFilter: null, tokenCount: 5, skip: false }),
    )

    expect(result.current.enabled).toBe(false)
    expect(mockV2ListTokens).not.toHaveBeenCalled()
  })

  it('omits a failed category while another loads', async () => {
    mockUseDynamicConfigValue.mockReturnValue(['trending', 'stocks'])
    mockV2ListTokens.mockImplementation(({ filter }: { filter: { categoryIds: string[] } }) =>
      filter.categoryIds[0] === 'trending'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve({ multichainTokens: [createRankedMultichainToken({ symbol: 'TSLAon' })] }),
    )

    const { result } = renderHookWithProviders(() =>
      useSpotlitCategorySections({ chainFilter: null, tokenCount: 5, skip: false }),
    )

    await waitFor(() => expect(result.current.sections).toHaveLength(1))
    expect(result.current.sections[0]?.categoryId).toBe('stocks')
    expect(result.current.enabled).toBe(true)
  })

  it('hands the shelf back when every category fails', async () => {
    mockUseDynamicConfigValue.mockReturnValue(['trending', 'stocks'])
    mockV2ListTokens.mockRejectedValue(new Error('boom'))

    const { result } = renderHookWithProviders(() =>
      useSpotlitCategorySections({ chainFilter: null, tokenCount: 5, skip: false }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.enabled).toBe(false)
    expect(result.current.sections).toEqual([])
  })
})
