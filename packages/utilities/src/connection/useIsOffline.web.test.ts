import { renderHook } from '@testing-library/react'
import { useIsOffline } from 'utilities/src/connection/useIsOffline.web'

describe('useIsOffline web hook', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: {
        onLine: true,
      },
    })
  })

  it('should return false when online', () => {
    const { result } = renderHook(() => useIsOffline())

    expect(result.current).toBe(false)
  })

  it('should return true when offline', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
    })

    const { result } = renderHook(() => useIsOffline())

    expect(result.current).toBe(true)
  })
})
