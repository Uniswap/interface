import { useDocumentScrollLock } from '~/features/Liquidity/hooks/useDocumentScrollLock'
import { renderHook } from '~/test-utils/render'

function stubRootClientWidth(value: number): void {
  Object.defineProperty(document.documentElement, 'clientWidth', { value, configurable: true })
}

afterEach(() => {
  // Removing the own property restores jsdom's prototype getter
  Reflect.deleteProperty(document.documentElement, 'clientWidth')
})

describe('useDocumentScrollLock', () => {
  it('locks scroll and reserves the gutter when a scrollbar occupied layout', () => {
    stubRootClientWidth(window.innerWidth - 15)
    const { unmount } = renderHook(() => useDocumentScrollLock(true))
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.documentElement.style.scrollbarGutter).toBe('stable')
    unmount()
    expect(document.documentElement.style.overflow).toBe('')
    // jsdom leaves the unimplemented property undefined rather than ''
    expect(document.documentElement.style.scrollbarGutter).toBeFalsy()
  })

  it('skips the gutter when the page had no scrollbar', () => {
    stubRootClientWidth(window.innerWidth)
    const { unmount } = renderHook(() => useDocumentScrollLock(true))
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.documentElement.style.scrollbarGutter).toBeFalsy()
    unmount()
  })

  it('does nothing while disabled', () => {
    const { unmount } = renderHook(() => useDocumentScrollLock(false))
    expect(document.documentElement.style.overflow).toBe('')
    unmount()
  })

  it('holds the lock until the last holder releases', () => {
    stubRootClientWidth(window.innerWidth)
    const first = renderHook(() => useDocumentScrollLock(true))
    const second = renderHook(() => useDocumentScrollLock(true))
    first.unmount()
    expect(document.documentElement.style.overflow).toBe('hidden')
    second.unmount()
    expect(document.documentElement.style.overflow).toBe('')
  })
})
