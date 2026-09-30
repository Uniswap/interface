import { renderHook } from '@testing-library/react'
import { useResolveTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useResolveTokenCategories'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

const mockUseAllTokenCategories = vi.fn()
const mockUseTokenCategoryOrder = vi.fn()

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories', () => ({
  useAllTokenCategories: (): unknown => mockUseAllTokenCategories(),
}))

vi.mock('uniswap/src/features/tokenCategories/useTokenCategoryOrder', () => ({
  useTokenCategoryOrder: (categories: TokenCategory[]): unknown => mockUseTokenCategoryOrder(categories),
}))

const defi = tokenCategory({ id: 'defi', name: 'DeFi' })
const stocks = tokenCategory({ id: 'stocks', name: 'Stocks' })
function mockAllCategories({ isLoading }: { isLoading: boolean }): void {
  mockUseAllTokenCategories.mockReturnValue({ categories: [defi, stocks], isLoading })
}

describe('useResolveTokenCategories', () => {
  beforeEach(() => {
    mockAllCategories({ isLoading: false })
    mockUseTokenCategoryOrder.mockImplementation((categories: TokenCategory[]) => categories)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns no categories when the token has no ids', () => {
    const { result } = renderHook(() => useResolveTokenCategories({ categoryIds: undefined }))
    expect(result.current).toEqual({ categories: [], isLoading: false })
  })

  it('drops ids the lookup does not know', () => {
    const { result } = renderHook(() =>
      useResolveTokenCategories({ categoryIds: ['stocks', 'not-a-category', 'defi'] }),
    )
    expect(result.current.categories).toEqual([defi, stocks])
  })

  it('applies the canonical order (ListCategories order, then Statsig pins), not the token’s own id order', () => {
    mockUseTokenCategoryOrder.mockImplementation((categories: TokenCategory[]) => [...categories].reverse())
    const { result } = renderHook(() => useResolveTokenCategories({ categoryIds: ['stocks', 'defi'] }))
    expect(mockUseTokenCategoryOrder).toHaveBeenLastCalledWith([defi, stocks])
    expect(result.current.categories).toEqual([stocks, defi])
  })

  it('keeps a stable empty array across renders so consumers do not re-render', () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useResolveTokenCategories({ categoryIds: ids }),
      {
        initialProps: { ids: ['unknown-a'] },
      },
    )
    const first = result.current.categories
    rerender({ ids: ['unknown-b'] })
    expect(result.current.categories).toBe(first)
  })

  it('stays loading while either the token or the lookup is loading', () => {
    const tokenLoading = renderHook(() => useResolveTokenCategories({ categoryIds: ['defi'], isLoading: true }))
    expect(tokenLoading.result.current.isLoading).toBe(true)

    mockAllCategories({ isLoading: true })
    const lookupLoading = renderHook(() => useResolveTokenCategories({ categoryIds: ['defi'] }))
    expect(lookupLoading.result.current.isLoading).toBe(true)
    expect(lookupLoading.result.current.categories).toEqual([defi])
  })

  it('does not count the lookup as loading for a token with no ids', () => {
    mockAllCategories({ isLoading: true })

    expect(renderHook(() => useResolveTokenCategories({ categoryIds: [] })).result.current.isLoading).toBe(false)
    expect(renderHook(() => useResolveTokenCategories({ categoryIds: undefined })).result.current.isLoading).toBe(false)
  })
})
