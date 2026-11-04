import { act, renderHook } from '@testing-library/react'
import { useScrollClampGuard } from '~/features/Liquidity/hooks/useScrollClampGuard'

const HEADER_HEIGHT = 72
const VIEWPORT_HEIGHT = 800
const RESERVED_MIN_HEIGHT = `calc(100dvh - ${HEADER_HEIGHT}px)`

vi.mock('~/hooks/useAppHeaderHeight', () => ({
  useAppHeaderHeight: (): number => HEADER_HEIGHT,
}))

function elementWithRect(rect: Partial<DOMRect>): HTMLDivElement {
  return { getBoundingClientRect: (): DOMRect => rect as DOMRect } as unknown as HTMLDivElement
}

function stubWindowMetric(name: 'scrollY' | 'innerHeight', value: number): void {
  Object.defineProperty(window, name, { value, configurable: true })
}

function setup({ enabled = true }: { enabled?: boolean } = {}) {
  const hook = renderHook(({ on }) => useScrollClampGuard(on), { initialProps: { on: enabled } })
  const setLayout = ({ rootTop, contentBottom }: { rootTop: number; contentBottom: number }): void => {
    hook.result.current.rootRef.current = elementWithRect({ top: rootTop })
    hook.result.current.contentRef.current = elementWithRect({ bottom: contentBottom })
  }
  const scrollTo = (scrollY: number): void => {
    stubWindowMetric('scrollY', scrollY)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
  }
  return { hook, setLayout, scrollTo }
}

beforeEach(() => {
  stubWindowMetric('innerHeight', VIEWPORT_HEIGHT)
  stubWindowMetric('scrollY', 0)
})

afterEach(() => {
  // Removing the own properties restores jsdom's prototype getters
  Reflect.deleteProperty(window, 'innerHeight')
  Reflect.deleteProperty(window, 'scrollY')
  vi.restoreAllMocks()
})

describe('useScrollClampGuard', () => {
  it('reserves nothing at rest', () => {
    const { hook, setLayout, scrollTo } = setup()
    setLayout({ rootTop: 300, contentBottom: 600 })
    scrollTo(0)
    expect(hook.result.current.minHeight).toBeUndefined()
  })

  it('arms once the root is scrolled to the header line', () => {
    const { hook, setLayout, scrollTo } = setup()
    setLayout({ rootTop: HEADER_HEIGHT, contentBottom: 600 })
    scrollTo(500)
    expect(hook.result.current.minHeight).toBe(RESERVED_MIN_HEIGHT)
  })

  it('stays released while the root is below the header line', () => {
    const { hook, setLayout, scrollTo } = setup()
    setLayout({ rootTop: HEADER_HEIGHT + 50, contentBottom: VIEWPORT_HEIGHT + 100 })
    scrollTo(500)
    expect(hook.result.current.minHeight).toBeUndefined()
  })

  it('holds the reservation while releasing it would move the page', () => {
    const { hook, setLayout, scrollTo } = setup()
    setLayout({ rootTop: HEADER_HEIGHT, contentBottom: 600 })
    scrollTo(500)
    // Scrolled up past the header, but the short content ends above the viewport bottom: releasing
    // would shrink the document and clamp the scroll, so the guard must hold.
    setLayout({ rootTop: 200, contentBottom: 500 })
    scrollTo(100)
    expect(hook.result.current.minHeight).toBe(RESERVED_MIN_HEIGHT)
  })

  it('releases once the content reaches past the viewport bottom', () => {
    const { hook, setLayout, scrollTo } = setup()
    setLayout({ rootTop: HEADER_HEIGHT, contentBottom: 600 })
    scrollTo(500)
    setLayout({ rootTop: 200, contentBottom: VIEWPORT_HEIGHT + 100 })
    scrollTo(100)
    expect(hook.result.current.minHeight).toBeUndefined()
  })

  it('releases back at the top of the page', () => {
    const { hook, setLayout, scrollTo } = setup()
    setLayout({ rootTop: HEADER_HEIGHT, contentBottom: 600 })
    scrollTo(500)
    setLayout({ rootTop: 300, contentBottom: 500 })
    scrollTo(0)
    expect(hook.result.current.minHeight).toBeUndefined()
  })

  it('re-evaluates on resize', () => {
    const { hook, setLayout } = setup()
    setLayout({ rootTop: HEADER_HEIGHT, contentBottom: 600 })
    stubWindowMetric('scrollY', 500)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(hook.result.current.minHeight).toBe(RESERVED_MIN_HEIGHT)
  })

  it('does nothing while disabled', () => {
    const { hook, setLayout, scrollTo } = setup({ enabled: false })
    setLayout({ rootTop: 0, contentBottom: 400 })
    scrollTo(500)
    expect(hook.result.current.minHeight).toBeUndefined()
  })

  it('starts guarding when enabled flips on', () => {
    const { hook, setLayout, scrollTo } = setup({ enabled: false })
    setLayout({ rootTop: HEADER_HEIGHT, contentBottom: 600 })
    scrollTo(500)
    expect(hook.result.current.minHeight).toBeUndefined()
    hook.rerender({ on: true })
    scrollTo(500)
    expect(hook.result.current.minHeight).toBe(RESERVED_MIN_HEIGHT)
  })

  it('releases an armed reservation when enabled flips off', () => {
    const { hook, setLayout, scrollTo } = setup()
    setLayout({ rootTop: HEADER_HEIGHT, contentBottom: 600 })
    scrollTo(500)
    expect(hook.result.current.minHeight).toBe(RESERVED_MIN_HEIGHT)
    hook.rerender({ on: false })
    expect(hook.result.current.minHeight).toBeUndefined()
  })

  it('detaches its listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { hook } = setup()
    hook.unmount()
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
