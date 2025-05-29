/** @jsxImportSource react */
import { act, renderHook } from '@testing-library/react-hooks'
import { render, screen } from '@testing-library/react-native'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { errorShakeAnimation } from 'ui/src/animations/errorShakeAnimation'
import { useShakeAnimation } from 'ui/src/animations/hooks/useShakeAnimation'

// Mock the errorShakeAnimation function
jest.mock('ui/src/animations/errorShakeAnimation', () => ({
  errorShakeAnimation: jest.fn(),
}))

// Test component that uses useShakeAnimation
const TestShakeComponent = () => {
  const { shakeStyle, triggerShakeAnimation } = useShakeAnimation()
  return (
    <Animated.View testID="shake-container" style={shakeStyle}>
      <View testID="shake-button" onTouchEnd={triggerShakeAnimation}>
        Shake Me
      </View>
    </Animated.View>
  )
}

describe('useShakeAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return shakeStyle and triggerShakeAnimation', () => {
    // Arrange & Act
    const { result } = renderHook(() => useShakeAnimation())

    // Assert
    expect(result.current.shakeStyle).toBeDefined()
    expect(typeof result.current.triggerShakeAnimation).toBe('function')
  })

  it('should initialize with translateX: 0 and update after shake', () => {
    // Arrange
    render(<TestShakeComponent />)
    const container = screen.getByTestId('shake-container')

    // Assert initial state
    expect(container.props.style.transform[0].translateX).toBe(0)

    // Act - trigger the shake animation
    act(() => {
      screen.getByTestId('shake-button').props.onTouchEnd()
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
    expect(result.current.shakeStyle).toBe(initialShakeStyle)
    expect(result.current.triggerShakeAnimation).toBe(initialTriggerShakeAnimation)
  })
})
