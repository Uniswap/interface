import { renderHook } from '@testing-library/react'
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

describe(useFixedDropdownLayout, () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })
  })

  it('right-aligns fixed dropdowns using the measured dropdown width', () => {
    const triggerElement = document.createElement('div')
    const measuringElement = document.createElement('div')
    mockElementRect(triggerElement, { left: 300, right: 500, width: 200 })
    mockElementSize(measuringElement, { height: 320, width: 240 })

    const { result } = renderHook(() =>
      useFixedDropdownLayout({
        alignRight: true,
        allowFlip: true,
        dropdownOffset: 10,
        enabled: true,
        isOpen: true,
        isSheet: false,
        measuringDropdownRef: { current: measuringElement },
        triggerRef: { current: triggerElement },
      }),
    )

    expect(result.current.fixedStyle?.left).toBe(260)
  })
})
