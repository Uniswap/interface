import { useIsPoolCategoriesEnabled } from '@universe/gating'
import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { poolCategory } from 'uniswap/src/test/fixtures/poolCategory'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { useExplorePoolCategories } from '~/pages/Explore/categories/useExplorePoolCategories'
import { renderHook } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsPoolCategoriesEnabled: vi.fn(() => true),
  useDynamicConfigValue: ({ defaultValue }: { defaultValue: unknown }) => defaultValue,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery', () => ({
  useListPoolCategoriesQuery: vi.fn(),
}))

const MAJORS = poolCategory({ id: 'major-pools', name: 'Majors' })

function mockQuery({
  data,
  isFetching = false,
  failureCount = 0,
}: {
  data: PoolCategory[] | undefined
  isFetching?: boolean
  failureCount?: number
}): void {
  ;(useListPoolCategoriesQuery as Mock).mockReturnValue({ data, isFetching, failureCount })
}

describe('useExplorePoolCategories', () => {
  beforeEach(() => {
    ;(useIsPoolCategoriesEnabled as Mock).mockReturnValue(true)
  })

  it('drops a backend category that reuses the frontend default id', () => {
    mockQuery({ data: [{ ...MAJORS, id: 'all', name: 'All' }, MAJORS] })
    const { result } = renderHook(() => useExplorePoolCategories())
    expect(result.current.orderedCategories).toEqual([MAJORS])
    expect(result.current.validCategoryIds.has('all')).toBe(false)
  })

  it('is loading and pending while the first ListCategories attempt is in flight', () => {
    mockQuery({ data: undefined, isFetching: true })
    const { result } = renderHook(() => useExplorePoolCategories())
    expect(result.current.categoriesLoading).toBe(true)
    expect(result.current.categoriesPending).toBe(true)
    expect(result.current.chipsEnabled).toBe(false)
  })

  it('stops loading on a retry so the tab renders without chips instead of a held skeleton', () => {
    mockQuery({ data: undefined, isFetching: true, failureCount: 1 })
    const { result } = renderHook(() => useExplorePoolCategories())
    expect(result.current.categoriesLoading).toBe(false)
    expect(result.current.chipsEnabled).toBe(false)
  })

  it('enables chips once categories land', () => {
    mockQuery({ data: [MAJORS] })
    const { result } = renderHook(() => useExplorePoolCategories())
    expect(result.current.chipsEnabled).toBe(true)
    expect(result.current.validCategoryIds.has('major-pools')).toBe(true)
  })

  it('has no chips and no valid ids with the flag off, even with a cached list', () => {
    ;(useIsPoolCategoriesEnabled as Mock).mockReturnValue(false)
    mockQuery({ data: [MAJORS] })
    const { result } = renderHook(() => useExplorePoolCategories())
    expect(result.current.chipsEnabled).toBe(false)
    expect(result.current.categoriesLoading).toBe(false)
    expect(result.current.validCategoryIds.size).toBe(0)
  })
})
