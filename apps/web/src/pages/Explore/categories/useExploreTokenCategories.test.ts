import { useIsTokenCategoriesEnabledWithLoading } from '@universe/gating'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { useExploreTokenCategories } from '~/pages/Explore/categories/useExploreTokenCategories'
import { renderHook } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabledWithLoading: vi.fn(() => ({ value: true, isLoading: false })),
  useDynamicConfigValue: ({ defaultValue }: { defaultValue: unknown }) => defaultValue,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery', () => ({
  useListCategoriesQuery: vi.fn(),
}))

const DEFI: TokenCategory = {
  id: 'defi',
  name: 'DeFi',
  description: '',
  categoryClass: TokenCategoryClass.Sector,
  grouped: false,
  topTokens: [],
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

function mockFlag({ value, isLoading = false }: { value: boolean; isLoading?: boolean }): void {
  ;(useIsTokenCategoriesEnabledWithLoading as Mock).mockReturnValue({ value, isLoading })
}

describe('useExploreTokenCategories', () => {
  beforeEach(() => {
    mockFlag({ value: true })
  })

  it('drops a backend category that reuses the frontend default id', () => {
    mockQuery({ data: [{ ...DEFI, id: 'all', name: 'All' }, DEFI] })
    const { result } = renderHook(() => useExploreTokenCategories())
    expect(result.current.orderedCategories).toEqual([DEFI])
    expect(result.current.validCategoryIds.has('all')).toBe(false)
  })

  it('is loading while Statsig has not reported the flag yet', () => {
    mockFlag({ value: false, isLoading: true })
    mockQuery({ data: undefined })
    const { result } = renderHook(() => useExploreTokenCategories())
    expect(result.current.categoriesLoading).toBe(true)
    expect(result.current.categoriesPending).toBe(false)
    expect(result.current.dynamicChipsEnabled).toBe(false)
  })

  it('ignores Statsig re-entering loading after the flag has reported once', () => {
    mockFlag({ value: false, isLoading: true })
    mockQuery({ data: [DEFI] })
    const { result, rerender } = renderHook(() => useExploreTokenCategories())
    expect(result.current.categoriesLoading).toBe(true)

    mockFlag({ value: true })
    rerender()
    expect(result.current.categoriesLoading).toBe(false)

    mockFlag({ value: true, isLoading: true })
    rerender()
    expect(result.current.categoriesLoading).toBe(false)
    expect(result.current.dynamicChipsEnabled).toBe(true)
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

  it('is not loading when the flag is off', () => {
    mockFlag({ value: false })
    mockQuery({ data: undefined })
    const { result } = renderHook(() => useExploreTokenCategories())
    expect(result.current.categoriesLoading).toBe(false)
    expect(result.current.dynamicChipsEnabled).toBe(false)
  })
})
