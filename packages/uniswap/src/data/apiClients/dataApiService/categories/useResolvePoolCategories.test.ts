import { renderHook } from '@testing-library/react'
import { useResolvePoolCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useResolvePoolCategories'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { poolCategory } from 'uniswap/src/test/fixtures/poolCategory'

const mockUseAllPoolCategories = vi.fn()
const mockUseCategoryOrder = vi.fn()

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useAllPoolCategories', () => ({
  useAllPoolCategories: (): unknown => mockUseAllPoolCategories(),
}))

vi.mock('uniswap/src/features/tokenCategories/useCategoryOrder', () => ({
  useCategoryOrder: ({ categories }: { categories: PoolCategory[] }): unknown => mockUseCategoryOrder(categories),
}))

const stables = poolCategory({ id: 'stable-pools', name: 'Stables' })
const correlated = poolCategory({ id: 'correlated', name: 'Correlated' })

describe('useResolvePoolCategories', () => {
  beforeEach(() => {
    mockUseAllPoolCategories.mockReturnValue({ categories: [stables, correlated], isLoading: false })
    mockUseCategoryOrder.mockImplementation((categories: PoolCategory[]) => categories)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns no categories when the pool has no ids', () => {
    const { result } = renderHook(() => useResolvePoolCategories({ categoryIds: undefined }))
    expect(result.current).toEqual({ categories: [], isLoading: false })
  })

  it('resolves known ids in list order and drops unknown ones', () => {
    const { result } = renderHook(() =>
      useResolvePoolCategories({ categoryIds: ['correlated', 'not-a-category', 'stable-pools'] }),
    )
    expect(result.current.categories).toEqual([stables, correlated])
  })

  it('only counts the lookup as loading for a pool that has ids', () => {
    mockUseAllPoolCategories.mockReturnValue({ categories: [], isLoading: true })
    expect(renderHook(() => useResolvePoolCategories({ categoryIds: [] })).result.current.isLoading).toBe(false)
    expect(renderHook(() => useResolvePoolCategories({ categoryIds: ['stable-pools'] })).result.current.isLoading).toBe(
      true,
    )
  })
})
