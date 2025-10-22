import { act, renderHook } from '@testing-library/react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { I18nManager } from 'react-native'
import { useForceRTL } from 'utilities/src/storybook/hooks/useForceRTL'

// Mock the I18nManager to control the isRTL property
vi.mock('react-native', () => ({
  I18nManager: {
    isRTL: false,
  },
}))

describe('useForceRTL', () => {
  afterEach(() => {
    // Reset the isRTL to its original state after each test
    I18nManager.isRTL = false
  })

  it('should start with RTL if startWithRTL is true', () => {
    const { result } = renderHook(() => useForceRTL(true))
    expect(result.current.isRTL).toBe(true)
    expect(I18nManager.isRTL).toBe(true)
  })

  it('should not start with RTL if startWithRTL is false', () => {
    const { result } = renderHook(() => useForceRTL(false))
    expect(result.current.isRTL).toBe(false)
    expect(I18nManager.isRTL).toBe(false)
  })

  it('should toggle RTL state', () => {
    const { result } = renderHook(() => useForceRTL(false))
    act(() => {
      result.current.toggleRTL()
    })
    expect(result.current.isRTL).toBe(true)
    expect(I18nManager.isRTL).toBe(true)
    act(() => {
      result.current.toggleRTL()
    })
    expect(result.current.isRTL).toBe(false)
    expect(I18nManager.isRTL).toBe(false)
  })

  it('should reset RTL state on unmount', () => {
    const { result, unmount } = renderHook(() => useForceRTL(true))
    expect(result.current.isRTL).toBe(true)
    expect(I18nManager.isRTL).toBe(true)
    unmount()
    expect(I18nManager.isRTL).toBe(false)
  })
})
