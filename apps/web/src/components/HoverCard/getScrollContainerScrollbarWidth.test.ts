import { getScrollContainerScrollbarWidth } from '~/components/HoverCard/getScrollContainerScrollbarWidth'

function setLayoutWidths(
  el: HTMLElement,
  { offsetWidth, clientWidth }: { offsetWidth: number; clientWidth: number },
): void {
  Object.defineProperty(el, 'offsetWidth', { value: offsetWidth, configurable: true })
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
}

function mount(...chain: HTMLElement[]): HTMLElement {
  chain.reduce((parent, child) => {
    parent.append(child)
    return child
  })
  document.body.append(chain[0]!)
  return chain[chain.length - 1]!
}

describe('getScrollContainerScrollbarWidth', () => {
  beforeEach(() => {
    // jsdom's computed style omits overflow-y; the inline declaration stands in for it.
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => (el as HTMLElement).style)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('returns the scrollbar width of the nearest scroll container, skipping clipped ancestors', () => {
    const scroller = document.createElement('div')
    scroller.style.overflowY = 'auto'
    setLayoutWidths(scroller, { offsetWidth: 638, clientWidth: 623 })
    const clipped = document.createElement('div')
    clipped.style.overflowY = 'hidden'
    setLayoutWidths(clipped, { offsetWidth: 623, clientWidth: 600 })
    const row = mount(scroller, clipped, document.createElement('div'))

    expect(getScrollContainerScrollbarWidth(row)).toBe(15)
  })

  it('does not count the scroll container borders as scrollbar', () => {
    const scroller = document.createElement('div')
    scroller.style.overflowY = 'scroll'
    scroller.style.borderLeftWidth = '1px'
    scroller.style.borderRightWidth = '1px'
    setLayoutWidths(scroller, { offsetWidth: 640, clientWidth: 623 })
    const row = mount(scroller, document.createElement('div'))

    expect(getScrollContainerScrollbarWidth(row)).toBe(15)
  })

  it('returns 0 for overlay scrollbars', () => {
    const scroller = document.createElement('div')
    scroller.style.overflowY = 'auto'
    setLayoutWidths(scroller, { offsetWidth: 638, clientWidth: 638 })
    const row = mount(scroller, document.createElement('div'))

    expect(getScrollContainerScrollbarWidth(row)).toBe(0)
  })

  it('returns 0 without a scroll container', () => {
    const row = mount(document.createElement('div'), document.createElement('div'))

    expect(getScrollContainerScrollbarWidth(row)).toBe(0)
    expect(getScrollContainerScrollbarWidth(null)).toBe(0)
  })
})
