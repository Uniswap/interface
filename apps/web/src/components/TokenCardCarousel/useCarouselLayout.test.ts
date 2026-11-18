import { act, renderHook } from '@testing-library/react'
import { useCarouselLayout } from '~/components/TokenCardCarousel/useCarouselLayout'

function createContainer(width: number): HTMLDivElement {
  const el = document.createElement('div')
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: width })
  return el
}

describe(useCarouselLayout, () => {
  let resizeCallback: (() => void) | undefined
  const OriginalResizeObserver = globalThis.ResizeObserver

  beforeEach(() => {
    resizeCallback = undefined
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) {
        resizeCallback = callback
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    globalThis.ResizeObserver = OriginalResizeObserver
  })

  it('measures the container before the first paint', () => {
    const ref = { current: createContainer(1120) }

    const { result } = renderHook(() => useCarouselLayout(ref))

    expect(result.current.containerWidth).toBe(1120)
    // (1120 - 3 * 12) / 4
    expect(result.current.cardWidth).toBe(271)
  })

  it('commits a window resize before the handler returns', () => {
    const ref = { current: createContainer(1120) }
    const { result } = renderHook(() => useCarouselLayout(ref))

    Object.defineProperty(ref.current, 'clientWidth', { configurable: true, value: 358 })
    // act() defers ordinary updates to its end; reading inside it proves the commit happened before the resize
    // handler returned, i.e. before the browser lays out and paints the frame.
    let widthWhenHandlerReturned: number | undefined
    act(() => {
      window.dispatchEvent(new Event('resize'))
      widthWhenHandlerReturned = result.current.containerWidth
    })

    expect(widthWhenHandlerReturned).toBe(358)
    expect(result.current.cardWidth).toBe(280)
  })

  it('follows container resizes reported by the ResizeObserver', () => {
    const ref = { current: createContainer(1120) }
    const { result } = renderHook(() => useCarouselLayout(ref))

    Object.defineProperty(ref.current, 'clientWidth', { configurable: true, value: 358 })
    act(() => resizeCallback?.())

    expect(result.current.containerWidth).toBe(358)
  })

  it('falls back to the small card width when there is no container', () => {
    const { result } = renderHook(() => useCarouselLayout({ current: null }))

    expect(result.current.containerWidth).toBe(0)
    expect(result.current.cardWidth).toBe(280)
  })
})
