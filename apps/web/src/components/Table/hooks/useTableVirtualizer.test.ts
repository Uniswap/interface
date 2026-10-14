import { act, cleanup, renderHook } from '@testing-library/react'
import { useTableVirtualizer } from '~/components/Table/hooks/useTableVirtualizer'

const TABLE_DOCUMENT_OFFSET_PX = 500
const LOCKED_SCROLL_OFFSET_PX = 900

function scrollPageTo(scrollY: number): void {
  Object.defineProperty(window, 'scrollY', { value: scrollY, writable: true, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

describe('useTableVirtualizer', () => {
  let triggerBodyResize: () => void

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          triggerBodyResize = () => callback([], this as unknown as ResizeObserver)
        }
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    )
  })

  afterEach(() => {
    // unmount first so resetting scrollY below doesn't notify a live virtualizer outside act()
    cleanup()
    vi.unstubAllGlobals()
    document.body.style.position = ''
    scrollPageTo(0)
  })

  it('keeps the window scroll margin while a modal scroll lock pins the body', () => {
    const container = document.createElement('div')
    const getRect = vi.spyOn(container, 'getBoundingClientRect')
    getRect.mockReturnValue({ top: TABLE_DOCUMENT_OFFSET_PX } as DOMRect)

    const { result } = renderHook(() =>
      useTableVirtualizer({ mode: 'window', count: 50, estimateSize: () => 60, forwardedRef: null }),
    )
    act(() => result.current.setContainerRef(container))
    expect(result.current.virtualizer.options.scrollMargin).toBe(TABLE_DOCUMENT_OFFSET_PX)

    // pinned body: content is shifted up by the locked offset while scrollY reads 0
    document.body.style.position = 'fixed'
    getRect.mockReturnValue({ top: TABLE_DOCUMENT_OFFSET_PX - LOCKED_SCROLL_OFFSET_PX } as DOMRect)
    act(() => triggerBodyResize())
    expect(result.current.virtualizer.options.scrollMargin).toBe(TABLE_DOCUMENT_OFFSET_PX)

    document.body.style.position = ''
    getRect.mockReturnValue({ top: TABLE_DOCUMENT_OFFSET_PX + 40 } as DOMRect)
    act(() => triggerBodyResize())
    expect(result.current.virtualizer.options.scrollMargin).toBe(TABLE_DOCUMENT_OFFSET_PX + 40)
  })

  it('holds the window scroll offset while a modal scroll lock pins the body', () => {
    const { result } = renderHook(() =>
      useTableVirtualizer({ mode: 'window', count: 50, estimateSize: () => 60, forwardedRef: null }),
    )
    act(() => scrollPageTo(LOCKED_SCROLL_OFFSET_PX))
    expect(result.current.virtualizer.scrollOffset).toBe(LOCKED_SCROLL_OFFSET_PX)

    // pinning clamps scrollY to 0 and fires a scroll event
    document.body.style.position = 'fixed'
    act(() => scrollPageTo(0))
    expect(result.current.virtualizer.scrollOffset).toBe(LOCKED_SCROLL_OFFSET_PX)

    document.body.style.position = ''
    act(() => scrollPageTo(LOCKED_SCROLL_OFFSET_PX + 100))
    expect(result.current.virtualizer.scrollOffset).toBe(LOCKED_SCROLL_OFFSET_PX + 100)
  })
})
