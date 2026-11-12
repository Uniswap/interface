import { act, renderHook } from '@testing-library/react'
import { useIsWindowVisible } from 'utilities/src/react/useIsWindowVisible.web'

function setVisibilityState(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

function hideOrShowTab(state: DocumentVisibilityState): void {
  act(() => {
    setVisibilityState(state)
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

describe(useIsWindowVisible, () => {
  afterEach(() => {
    setVisibilityState('visible')
  })

  it('returns true while the tab is visible', () => {
    setVisibilityState('visible')

    const { result } = renderHook(() => useIsWindowVisible())

    expect(result.current).toBe(true)
  })

  it('returns false when the tab starts hidden', () => {
    setVisibilityState('hidden')

    const { result } = renderHook(() => useIsWindowVisible())

    expect(result.current).toBe(false)
  })

  it('follows visibilitychange events', () => {
    setVisibilityState('visible')
    const { result } = renderHook(() => useIsWindowVisible())

    hideOrShowTab('hidden')
    expect(result.current).toBe(false)

    hideOrShowTab('visible')
    expect(result.current).toBe(true)
  })

  it('stops listening after unmount', () => {
    const removeListener = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useIsWindowVisible())

    unmount()

    expect(removeListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    removeListener.mockRestore()
  })
})
