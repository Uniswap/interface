import useSimplePagination from 'hooks/useSimplePagination'
import { act, renderHook } from 'test-utils/render'

describe('useSimplePagination', () => {
  it('should initialize with page 1', () => {
    const { result } = renderHook(() => useSimplePagination())
    expect(result.current.page).toBe(1)
  })

  it('should increment page number', () => {
    const { result } = renderHook(() => useSimplePagination())

    act(() => {
      result.current.loadMore({})
    })

    expect(result.current.page).toBe(2)

    act(() => {
      result.current.loadMore({})
    })

    expect(result.current.page).toBe(3)
  })

  it('should call onComplete callback after incrementing page', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useSimplePagination())

    act(() => {
      result.current.loadMore({ onComplete })
    })

    expect(result.current.page).toBe(2)
    expect(onComplete).toHaveBeenCalled()
  })
})
