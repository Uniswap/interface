import { act, render, renderHook } from '@testing-library/react'
import { useShakeAnimation } from 'ui/src/animations/hooks/useShakeAnimation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Test component that uses useShakeAnimation
const TestShakeComponent = () => {
  const { shakeStyle, triggerShakeAnimation } = useShakeAnimation()
  return (
    <div data-testid="shake-container" style={shakeStyle as React.CSSProperties}>
      <button data-testid="shake-button" onClick={triggerShakeAnimation}>
        Shake Me
      </button>
    </div>
  )
}

describe('useShakeAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    // Clean up injected styles
    const styleElement = document.getElementById('uniswap-shake-animation')
    if (styleElement) {
      styleElement.remove()
    }
  })

  it('should return shakeStyle and triggerShakeAnimation', () => {
    // Arrange & Act
    const { result } = renderHook(() => useShakeAnimation())

    // Assert
    expect(result.current.shakeStyle).toBeDefined()
    expect(typeof result.current.triggerShakeAnimation).toBe('function')
  })

  it('should inject CSS keyframes and apply shake animation on trigger', () => {
    // Arrange
    const result = render(<TestShakeComponent />)
    const container = result.getByTestId('shake-container')
    const button = result.getByTestId('shake-button')

    // Assert initial state - no animation
    expect(container.style.animation).toBeFalsy()

    // Act - trigger the shake animation
    act(() => {
      button.click()
    })

    // Assert - verify CSS keyframes were injected (web implementation)
    const styleElement = document.getElementById('uniswap-shake-animation')
    expect(styleElement).toBeTruthy()
    expect(styleElement?.textContent).toContain('@keyframes')
    expect(styleElement?.textContent).toContain('translateX')

    // Assert - animation style is applied
    expect(container.style.animation).toContain('uniswap-shake-animation')

    // Act - advance timers to complete animation
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Assert - animation is cleared after completion
    expect(container.style.animation).toBeFalsy()
  })

  it('should maintain consistent triggerShakeAnimation reference', () => {
    // Arrange
    const { result, rerender } = renderHook(() => useShakeAnimation())
    const initialTriggerShakeAnimation = result.current.triggerShakeAnimation

    // Act
    rerender()

    // Assert - triggerShakeAnimation should maintain reference due to useCallback
    expect(result.current.triggerShakeAnimation).toBe(initialTriggerShakeAnimation)
  })
})
