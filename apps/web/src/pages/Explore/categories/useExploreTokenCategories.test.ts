import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { useExploreTokenCategories } from '~/pages/Explore/categories/useExploreTokenCategories'
import { renderHook } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useDynamicConfigValue: ({ defaultValue }: { defaultValue: unknown }) => defaultValue,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery', () => ({
  useListCategoriesQuery: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(),
}))

const DEFI: TokenCategory = {
  id: 'defi',
  name: 'DeFi',
  englishName: 'DeFi',
  description: '',
  kind: 'token',
  categoryClass: TokenCategoryClass.Sector,
  grouped: false,
  topTokens: [],
  topGroups: [],
}

function mockQuery({
  data,
  isFetching = false,
  failureCount = 0,
}: {
  data: TokenCategory[] | undefined
  isFetching?: boolean
  failureCount?: number
}): void {
  ;(useListCategoriesQuery as Mock).mockReturnValue({ data, isFetching, failureCount })
}

function mockTestnetMode(isTestnetModeEnabled: boolean): void {
  ;(useEnabledChains as Mock).mockReturnValue({ chains: [], isTestnetModeEnabled })
}

describe('useExploreTokenCategories', () => {
  beforeEach(() => {
    mockTestnetMode(false)
  })

  it('drops a backend category that reuses the frontend default id', () => {
    mockQuery({ data: [{ ...DEFI, id: 'all', name: 'All' }, DEFI] })
    const { result } = renderHook(() => useExploreTokenCategories())
    expect(result.current.orderedCategories).toEqual([DEFI])
    expect(result.current.validCategoryIds.has('all')).toBe(false)
  })

  it('is loading and pending while the first ListCategories attempt is in flight', () => {
    mockQuery({ data: undefined, isFetching: true })
    const { result } = renderHook(() => useExploreTokenCategories())
    expect(result.current.categoriesLoading).toBe(true)
    expect(result.current.categoriesPending).toBe(true)
  })

  it('stops loading on a retry so the static set renders instead of a held skeleton', () => {
    mockQuery({ data: undefined, isFetching: true, failureCount: 1 })
    const { result } = renderHook(() => useExploreTokenCategories())
    expect(result.current.categoriesLoading).toBe(false)
    expect(result.current.dynamicChipsEnabled).toBe(false)
  })

  it('resolves to dynamic chips once categories land', () => {
    mockQuery({ data: [DEFI] })
    const { result } = renderHook(() => useExploreTokenCategories())
    expect(result.current.categoriesLoading).toBe(false)
    expect(result.current.dynamicChipsEnabled).toBe(true)
    expect(result.current.validCategoryIds.has('defi')).toBe(true)
  })

  it('drops the static RWA categories in testnet mode', () => {
    mockTestnetMode(true)
    mockQuery({ data: undefined })
    const { result } = renderHook(() => useExploreTokenCategories())
    expect(result.current.exploreCategoriesEnabled).toBe(false)
    expect(result.current.validCategoryIds.has('stocks')).toBe(false)
  })

  it('keeps fetched categories but drops the static RWA ids in testnet mode', () => {
    mockTestnetMode(true)
    mockQuery({ data: [DEFI] })
    const { result } = renderHook(() => useExploreTokenCategories())
    expect(result.current.validCategoryIds.has('defi')).toBe(true)
    expect(result.current.validCategoryIds.has('stocks')).toBe(false)
  })
})
