import { act, renderHook } from '@testing-library/react'
import { useContainerWidth } from 'uniswap/src/components/nfts/hooks/useContainerWidth'

describe('useContainerWidth', () => {
  let observerCallback: ResizeObserverCallback
  let mockObserve: ReturnType<typeof vi.fn>
  let mockDisconnect: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockObserve = vi.fn()
    mockDisconnect = vi.fn()
    Object.defineProperty(globalThis, 'ResizeObserver', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((cb: ResizeObserverCallback) => {
        observerCallback = cb
        return { observe: mockObserve, disconnect: mockDisconnect, unobserve: vi.fn() }
      }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 0 when ref is null', () => {
    const ref = { current: null }

    const { result } = renderHook(() => useContainerWidth(ref))

    expect(result.current).toBe(0)
    expect(mockObserve).not.toHaveBeenCalled()
  })

  it('reads initial width from getBoundingClientRect when ref is attached', () => {
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ width: 640 } as DOMRect)
    const ref = { current: el }
    const { result } = renderHook(() => useContainerWidth(ref))

    expect(result.current).toBe(640)
    expect(mockObserve).toHaveBeenCalledWith(el)
  })

  it('updates width when ResizeObserver callback fires', () => {
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ width: 640 } as DOMRect)
    const ref = { current: el }
    const { result } = renderHook(() => useContainerWidth(ref))

    expect(result.current).toBe(640)

    act(() => {
      observerCallback([{ contentRect: { width: 1024 } } as ResizeObserverEntry], {} as ResizeObserver)
    })

    expect(result.current).toBe(1024)
  })

  it('disconnects the observer on unmount', () => {
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ width: 320 } as DOMRect)
    const ref = { current: el }
    const { unmount } = renderHook(() => useContainerWidth(ref))

    expect(mockDisconnect).not.toHaveBeenCalled()
    unmount()
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })
})
