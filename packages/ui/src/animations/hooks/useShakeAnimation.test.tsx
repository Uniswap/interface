import { act, render, renderHook } from '@testing-library/react'
import { errorShakeAnimation } from 'ui/src/animations/errorShakeAnimation'
import { useShakeAnimation } from 'ui/src/animations/hooks/useShakeAnimation'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the errorShakeAnimation function
vi.mock('ui/src/animations/errorShakeAnimation', () => ({
  errorShakeAnimation: vi.fn(),
}))

// Test component that uses useShakeAnimation
const TestShakeComponent = () => {
  const { triggerShakeAnimation } = useShakeAnimation()
  return (
    <div data-testid="shake-container">
      <button data-testid="shake-button" onClick={triggerShakeAnimation}>
        Shake Me
      </button>
    </div>
  )
}

describe('useShakeAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return shakeStyle and triggerShakeAnimation', () => {
    // Arrange & Act
    const { result } = renderHook(() => useShakeAnimation())

    // Assert
    expect(result.current.shakeStyle).toBeDefined()
    expect(typeof result.current.triggerShakeAnimation).toBe('function')
  })

  it('should initialize and trigger shake animation', () => {
    // Arrange
    const result = render(<TestShakeComponent />)
    const container = result.getByTestId('shake-container')
    const button = result.getByTestId('shake-button')

    // Assert initial state
    expect(container.style).toBeDefined()

    // Act - trigger the shake animation
    act(() => {
      button.click()
    })

    // Assert - verify errorShakeAnimation was called
    expect(errorShakeAnimation).toHaveBeenCalled()
  })

  it('should maintain consistent references for returned values', () => {
    // Arrange
    const { result, rerender } = renderHook(() => useShakeAnimation())
    const initialShakeStyle = result.current.shakeStyle
    const initialTriggerShakeAnimation = result.current.triggerShakeAnimation

    // Act
    rerender()

    // Assert
    // shakeStyle might be recreated but should have the same structure
    expect(result.current.shakeStyle).toStrictEqual(initialShakeStyle)
    // triggerShakeAnimation should maintain reference due to useEvent
    expect(result.current.triggerShakeAnimation).toBe(initialTriggerShakeAnimation)
  })
})
