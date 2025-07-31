import { useInfiniteScroll } from 'hooks/useInfiniteScroll'
import { useEffect } from 'react'
import { act, render, renderHook } from 'test-utils/render'
import { Flex } from 'ui/src'

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

let intersectionCallback: (entries: IntersectionObserverEntry[]) => void

beforeAll(() => {
  // Mock IntersectionObserver globally
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: vi.fn((callback) => {
      intersectionCallback = callback
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
      }
    }),
  })
})

beforeEach(() => {
  vi.clearAllMocks()
})

function TestComponent({
  onLoadMore,
  hasNextPage,
  isFetching,
}: {
  onLoadMore: () => void
  hasNextPage: boolean
  isFetching: boolean
}) {
  const { sentinelRef } = useInfiniteScroll({ onLoadMore, hasNextPage, isFetching })

  useEffect(() => {
    const element = document.createElement('div')
    if (sentinelRef.current !== element) {
      Object.defineProperty(sentinelRef, 'current', {
        value: element,
        writable: true,
      })
    }
  }, [sentinelRef])

  return <Flex ref={sentinelRef} data-testid="sentinel" />
}

function TestComponentWithReset({
  onLoadMore,
  hasNextPage,
  isFetching,
}: {
  onLoadMore: () => void
  hasNextPage: boolean
  isFetching: boolean
}) {
  const { sentinelRef } = useInfiniteScroll({ onLoadMore, hasNextPage, isFetching })
  return <Flex ref={sentinelRef} data-testid="sentinel" />
}

describe('useInfiniteScroll', () => {
  it('should return sentinelRef', () => {
    const onLoadMore = vi.fn()
    const { result } = renderHook(() => useInfiniteScroll({ onLoadMore, hasNextPage: true, isFetching: false }))

    expect(result.current.sentinelRef).toBeDefined()
    expect(result.current.sentinelRef.current).toBeNull()
  })

  it('should call onLoadMore when sentinel intersects and conditions are met', async () => {
    const onLoadMore = vi.fn()
    render(<TestComponent onLoadMore={onLoadMore} hasNextPage={true} isFetching={false} />)

    await act(async () => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('should not call onLoadMore when hasNextPage is false', async () => {
    const onLoadMore = vi.fn()
    render(<TestComponent onLoadMore={onLoadMore} hasNextPage={false} isFetching={false} />)

    await act(async () => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should not call onLoadMore when isFetching is true', async () => {
    const onLoadMore = vi.fn()
    render(<TestComponent onLoadMore={onLoadMore} hasNextPage={true} isFetching={true} />)

    await act(async () => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should reset hasTriggered if onLoadMore changes', async () => {
    const onLoadMore1 = vi.fn()
    const onLoadMore2 = vi.fn()

    const { rerender } = render(
      <TestComponentWithReset onLoadMore={onLoadMore1} hasNextPage={true} isFetching={false} />,
    )

    // First intersection
    await act(async () => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(onLoadMore1).toHaveBeenCalledTimes(1)

    // Change onLoadMore to trigger reset
    rerender(<TestComponentWithReset onLoadMore={onLoadMore2} hasNextPage={true} isFetching={false} />)

    // Should trigger again with new function
    await act(async () => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(onLoadMore2).toHaveBeenCalledTimes(1)
  })

  it('should not observe when element is not available', async () => {
    const onLoadMore = vi.fn()
    renderHook(() => useInfiniteScroll({ onLoadMore, hasNextPage: true, isFetching: false }))

    // Observer should not be called when no element is attached
    expect(mockObserve).not.toHaveBeenCalled()
  })
})
