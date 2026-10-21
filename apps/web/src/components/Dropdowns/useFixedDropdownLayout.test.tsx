import { act, renderHook } from '@testing-library/react'
import { useFixedDropdownLayout } from '~/components/Dropdowns/useFixedDropdownLayout'

function mockElementRect(element: HTMLDivElement, rect: Partial<DOMRect>): void {
  element.getBoundingClientRect = vi.fn(() => ({
    bottom: 240,
    height: 40,
    left: 300,
    right: 500,
    top: 200,
    width: 200,
    x: 300,
    y: 200,
    toJSON: vi.fn(),
    ...rect,
  }))
}

function mockElementSize(element: HTMLDivElement, { height, width }: { height: number; width: number }): void {
  Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height })
  Object.defineProperty(element, 'offsetWidth', { configurable: true, value: width })
}

function renderFixedLayout({
  triggerElement,
  measuringElement,
  alignRight,
}: {
  triggerElement: HTMLDivElement
  measuringElement: HTMLDivElement
  alignRight?: boolean
}) {
  // Stable ref objects, as callers' useRef gives the hook; fresh objects per render would re-run the open-time layout.
  const measuringDropdownRef = { current: measuringElement }
  const triggerRef = { current: triggerElement }
  return renderHook(() =>
    useFixedDropdownLayout({
      alignRight,
      allowFlip: true,
      dropdownOffset: 10,
      enabled: true,
      isOpen: true,
      isSheet: false,
      measuringDropdownRef,
      triggerRef,
    }),
  )
}

describe(useFixedDropdownLayout, () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('right-aligns fixed dropdowns using the measured dropdown width', () => {
    const triggerElement = document.createElement('div')
    const measuringElement = document.createElement('div')
    mockElementRect(triggerElement, { left: 300, right: 500, width: 200 })
    mockElementSize(measuringElement, { height: 320, width: 240 })

    const { result } = renderFixedLayout({ triggerElement, measuringElement, alignRight: true })

    expect(result.current.fixedStyle?.left).toBe(260)
  })

  it('re-anchors on each scroll frame and re-decides the open side once scrolling pauses', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] })
    const triggerElement = document.createElement('div')
    const measuringElement = document.createElement('div')
    mockElementRect(triggerElement, { top: 200, bottom: 240 })
    mockElementSize(measuringElement, { height: 320, width: 240 })

    const { result } = renderFixedLayout({ triggerElement, measuringElement })

    expect(result.current.flipVertical).toBe(false)
    expect(result.current.fixedStyle?.top).toBe(250)

    // The page scrolls up and the trigger lands near the bottom edge, where a fresh layout pass
    // would flip the menu above it. Mid-scroll the menu only moves with the trigger.
    mockElementRect(triggerElement, { top: 700, bottom: 740 })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(50)
    })

    expect(result.current.flipVertical).toBe(false)
    expect(result.current.fixedStyle?.top).toBe(750)

    // Once scrolling has paused the side is re-decided.
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.flipVertical).toBe(true)
    expect(result.current.fixedStyle?.bottom).toBe(110)
  })
})
