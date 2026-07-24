import { useSimplePagination } from '~/pages/Explore/hooks/useSimplePagination'
import { act, renderHook } from '~/test-utils/render'

describe('useSimplePagination', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with page 1', () => {
    const { result } = renderHook(() => useSimplePagination())
    expect(result.current.page).toBe(1)
  })

  it('should increment page synchronously when delay is 0', () => {
    const { result } = renderHook(() => useSimplePagination({ loadMoreDelayMs: 0 }))

    act(() => {
      result.current.loadMore?.({})
    })
    expect(result.current.page).toBe(2)

    act(() => {
      result.current.loadMore?.({})
    })
    expect(result.current.page).toBe(3)
  })

  it('should call onComplete after incrementing page when delay is 0', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useSimplePagination({ loadMoreDelayMs: 0 }))

    act(() => {
      result.current.loadMore?.({ onComplete })
    })

    expect(result.current.page).toBe(2)
    expect(onComplete).toHaveBeenCalled()
  })

  it('should defer the page increment and onComplete by the configured delay', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useSimplePagination({ loadMoreDelayMs: 400 }))

    act(() => {
      result.current.loadMore?.({ onComplete })
    })

    // Not yet revealed — the indicator can paint during this window.
    expect(result.current.page).toBe(1)
    expect(onComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.page).toBe(2)
    expect(onComplete).toHaveBeenCalled()
  })

  it('should stop paginating once every loaded row is displayed', () => {
    const { result } = renderHook(() => useSimplePagination({ totalCount: 40, pageSize: 20, loadMoreDelayMs: 0 }))

    // Page 1 shows 20 of 40 — more remain.
    expect(result.current.hasMore).toBe(true)
    expect(result.current.loadMore).toBeDefined()

    act(() => {
      result.current.loadMore?.({})
    })

    // Page 2 shows all 40 — no more to reveal, so loadMore is withdrawn.
    expect(result.current.page).toBe(2)
    expect(result.current.hasMore).toBe(false)
    expect(result.current.loadMore).toBeUndefined()
  })

  it('should always allow loading more when total count is unknown', () => {
    const { result } = renderHook(() => useSimplePagination({ loadMoreDelayMs: 0 }))
    expect(result.current.hasMore).toBe(true)
    expect(result.current.loadMore).toBeDefined()
  })
})
