import { act, render, renderHook } from '@testing-library/react'
import { useEffect } from 'react'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}))

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

let intersectionCallback: (entries: IntersectionObserverEntry[]) => void

beforeAll(() => {
  // Mock IntersectionObserver globally
  Object.defineProperty(globalThis, 'IntersectionObserver', {
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
}): JSX.Element {
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

  return <div ref={sentinelRef as React.RefObject<HTMLDivElement>} data-testid="sentinel" />
}

function TestComponentWithReset({
  onLoadMore,
  hasNextPage,
  isFetching,
}: {
  onLoadMore: () => void
  hasNextPage: boolean
  isFetching: boolean
}): JSX.Element {
  const { sentinelRef } = useInfiniteScroll({ onLoadMore, hasNextPage, isFetching })
  return <div ref={sentinelRef as React.RefObject<HTMLDivElement>} data-testid="sentinel" />
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
    render(<TestComponent hasNextPage={true} isFetching={false} onLoadMore={onLoadMore} />)

    await act(async () => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('should not call onLoadMore when hasNextPage is false', async () => {
    const onLoadMore = vi.fn()
    render(<TestComponent hasNextPage={false} isFetching={false} onLoadMore={onLoadMore} />)

    await act(async () => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should not call onLoadMore when isFetching is true', async () => {
    const onLoadMore = vi.fn()
    render(<TestComponent hasNextPage={true} isFetching={true} onLoadMore={onLoadMore} />)

    await act(async () => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should reset hasTriggered if onLoadMore changes', async () => {
    const onLoadMore1 = vi.fn()
    const onLoadMore2 = vi.fn()

    const { rerender } = render(
      <TestComponentWithReset hasNextPage={true} isFetching={false} onLoadMore={onLoadMore1} />,
    )

    // First intersection
    await act(async () => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(onLoadMore1).toHaveBeenCalledTimes(1)

    // Change onLoadMore to trigger reset
    rerender(<TestComponentWithReset hasNextPage={true} isFetching={false} onLoadMore={onLoadMore2} />)

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
