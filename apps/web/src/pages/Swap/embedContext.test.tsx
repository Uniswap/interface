import { useEmbedSession } from '~/pages/Swap/embedContext'
import { renderHook } from '~/test-utils/render'

function setLocation(pathname: string, search = ''): void {
  Object.defineProperty(window, 'location', {
    value: { pathname, search },
    writable: true,
  })
}

describe('useEmbedSession', () => {
  const original = window.location

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: original, writable: true })
  })

  it('captures embedded=true and the surface for an /embed document at mount', () => {
    setLocation('/embed')
    expect(renderHook(() => useEmbedSession()).result.current).toEqual({ embedded: true, view: 'full' })

    setLocation('/embed', '?view=swap')
    expect(renderHook(() => useEmbedSession()).result.current).toEqual({ embedded: true, view: 'swap' })
  })

  it('captures embedded=false for a direct top-level load', () => {
    setLocation('/swap')
    expect(renderHook(() => useEmbedSession()).result.current).toEqual({ embedded: false, view: 'full' })
  })

  it('stays sticky when the router pathname changes after mount', () => {
    setLocation('/embed', '?view=swap')
    const { result, rerender } = renderHook(() => useEmbedSession())
    expect(result.current).toEqual({ embedded: true, view: 'swap' })

    // Simulate in-frame client-side nav to a real route that drops /embed and the view param.
    setLocation('/swap')
    rerender()
    expect(result.current).toEqual({ embedded: true, view: 'swap' })
  })
})
