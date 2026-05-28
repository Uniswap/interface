import { act, renderHook } from '@testing-library/react'
import { useIsKeyboardOpen } from 'utilities/src/device/keyboard/useIsKeyboardOpen.web'
import { vi } from 'vitest'

describe('useIsKeyboardOpen', () => {
  // Mock the visualViewport object
  const originalVisualViewport = window.visualViewport

  beforeEach(() => {
    Object.defineProperty(window.screen, 'height', {
      configurable: true, // Allow the property to be redefined
      writable: true,
      value: 960, // Default screen height
    })

    const listeners: { [key: string]: Array<(event: Event) => void> } = {}

    // @ts-expect-error no need to mock everything
    window.visualViewport = {
      height: 800,
      addEventListener: vi.fn((event: string, callback: (event: Event) => void) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(callback)
      }),
      dispatchEvent: (event: Event): boolean => {
        if (listeners[event.type]) {
          listeners[event.type]?.forEach((listener) => listener(event))
        }

        return true
      },
    }
  })

  afterEach(() => {
    window.visualViewport = originalVisualViewport
  })

  it('should initially set isKeyboardOpen to false when keyboard is closed', () => {
    const { result } = renderHook(() => useIsKeyboardOpen())
    expect(result.current).toBe(false)
  })

  it('should detect keyboard already open on mount', () => {
    // Simulate keyboard already open (viewport height significantly reduced)
    if (window.visualViewport) {
      Object.defineProperty(window.visualViewport, 'height', {
        configurable: true,
        value: 400, // screen.height (960) - 400 = 560 > 270, so keyboard should be detected
      })
    }

    const { result } = renderHook(() => useIsKeyboardOpen(270))
    expect(result.current).toBe(true)
  })

  it('should set isKeyboardOpen to true when the keyboard opens', () => {
    const { result } = renderHook(() => useIsKeyboardOpen(300))

    act(() => {
      if (window.visualViewport) {
        Object.defineProperty(window.visualViewport, 'height', {
          value: 500,
        })
        window.visualViewport.dispatchEvent(new Event('resize'))
      }
    })

    expect(result.current).toBe(true)
  })

  it('should set isKeyboardOpen to false when the keyboard closes', () => {
    const { result } = renderHook(() => useIsKeyboardOpen(300))

    // Simulate keyboard opening
    act(() => {
      if (window.visualViewport) {
        Object.defineProperty(window.visualViewport, 'height', {
          value: 500,
        })
        window.visualViewport.dispatchEvent(new Event('resize'))
      }
    })

    // Simulate keyboard closing
    act(() => {
      if (window.visualViewport) {
        Object.defineProperty(window.visualViewport, 'height', {
          value: 800,
        })
        window.visualViewport.dispatchEvent(new Event('resize'))
      }
    })

    expect(result.current).toBe(false)
  })
})
