import { TouchableArea } from '@universe/mycelium'
import { HorizontalFadeScroller } from '~/components/HorizontalFadeScroller/HorizontalFadeScroller'
import { fireEvent, render, screen } from '~/test-utils/render'

const SCROLLER_WIDTH_PX = 300
const SCROLL_WIDTH_PX = 600
/** 24px fade + 32px peek */
const SCROLL_PADDING_PX = 56

function stubRect(element: Element, left: number, width: number): void {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ left, right: left + width } as DOMRect)
}

function renderRow(onPress = vi.fn()): HTMLElement {
  render(
    <HorizontalFadeScroller testID="scroller">
      <TouchableArea onPress={onPress}>first</TouchableArea>
      <TouchableArea onPress={onPress}>second</TouchableArea>
    </HorizontalFadeScroller>,
  )
  const scroller = screen.getByTestId('scroller')
  Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: SCROLLER_WIDTH_PX })
  Object.defineProperty(scroller, 'scrollWidth', { configurable: true, value: SCROLL_WIDTH_PX })
  stubRect(scroller, 0, SCROLLER_WIDTH_PX)
  return scroller
}

describe('HorizontalFadeScroller', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('scrolls a pressed item clear of the edge fade, even when the press stops propagation', () => {
    const onPress = vi.fn()
    const scroller = renderRow(onPress)
    stubRect(screen.getByRole('button', { name: 'second' }), 260, 80)

    fireEvent.click(screen.getByText('second'))
    vi.advanceTimersByTime(500)

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(scroller.scrollLeft).toBe(260 + 80 - (SCROLLER_WIDTH_PX - SCROLL_PADDING_PX))
  })

  it('leaves the scroll position alone for an item already in view', () => {
    const scroller = renderRow()
    stubRect(screen.getByRole('button', { name: 'first' }), 100, 80)

    fireEvent.click(screen.getByText('first'))
    vi.advanceTimersByTime(500)

    expect(scroller.scrollLeft).toBe(0)
  })

  it('ignores clicks that are not on a pressable', () => {
    render(
      <HorizontalFadeScroller testID="scroller">
        <span>label</span>
      </HorizontalFadeScroller>,
    )
    const scroller = screen.getByTestId('scroller')
    const getRect = vi.spyOn(scroller, 'getBoundingClientRect')

    fireEvent.click(screen.getByText('label'))

    expect(getRect).not.toHaveBeenCalled()
  })
})
