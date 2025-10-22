import { act, renderHook } from '@testing-library/react'
import type { LayoutChangeEvent } from 'react-native'
import { getHitSlop, useAutoHitSlop } from 'ui/src/components/touchable/TouchableArea/useAutoHitSlop'
import { isIOS } from 'utilities/src/platform'
import { describe, expect, it, vi } from 'vitest'

// Mock the isIOS value to test both iOS and Android cases
vi.mock('utilities/src/platform', () => ({
  isIOS: false,
}))

// Helper function to create LayoutChangeEvent objects
function createLayoutEvent({
  width,
  height,
  x = 0,
  y = 0,
}: {
  width: number
  height: number
  x?: number
  y?: number
}): LayoutChangeEvent {
  return {
    nativeEvent: {
      layout: { x, y, width, height },
    },
  } as LayoutChangeEvent
}

// Helper constants
const MIN_WIDTH_IOS = 44
const MIN_WIDTH_ANDROID = 48

describe('getHitSlop', () => {
  it('returns undefined when frame size meets minimum requirements', () => {
    // Arrange
    const frameSize = { width: 50, height: 50 }

    const hitSlop = getHitSlop(frameSize)

    // Assert
    expect(hitSlop).toBeUndefined()
  })

  it('returns hit slop when width is smaller than minimum width', () => {
    // Arrange
    const MIN_WIDTH = isIOS ? MIN_WIDTH_IOS : MIN_WIDTH_ANDROID
    const frameSize = { width: MIN_WIDTH - 10, height: 50 }

    const hitSlop = getHitSlop(frameSize)

    // Assert
    expect(hitSlop).toEqual({
      top: 0,
      right: 5,
      bottom: 0,
      left: 5,
    })
  })

  it('returns hit slop when height is smaller than minimum height', () => {
    // Arrange
    const MIN_HEIGHT = isIOS ? MIN_WIDTH_IOS : MIN_WIDTH_ANDROID
    const frameSize = { width: 50, height: MIN_HEIGHT - 10 }

    // Act
    const hitSlop = getHitSlop(frameSize)

    // Assert
    expect(hitSlop).toEqual({
      top: 5,
      right: 0,
      bottom: 5,
      left: 0,
    })
  })

  it('returns hit slop when both dimensions are smaller than minimum requirements', () => {
    // Arrange
    const MIN_SIZE = isIOS ? MIN_WIDTH_IOS : MIN_WIDTH_ANDROID
    const frameSize = { width: MIN_SIZE - 10, height: MIN_SIZE - 10 }

    // Act
    const hitSlop = getHitSlop(frameSize)

    // Assert
    expect(hitSlop).toEqual({
      top: 5,
      right: 5,
      bottom: 5,
      left: 5,
    })
  })

  it.skip('calculates hit slop for iOS devices correctly', () => {
    // Skip this test as dynamic module mocking doesn't work the same way in Vitest
    // The MIN_WIDTH/MIN_HEIGHT constants are set at module level based on isIOS
    // and can't be changed after import
  })
})

describe('useAutoHitSlop', () => {
  it('returns undefined hit slop and an onLayout function initially', () => {
    // Arrange & Act
    const { result } = renderHook(() => useAutoHitSlop())

    // Assert
    expect(result.current[0]).toBeUndefined()
    expect(typeof result.current[1]).toBe('function')
  })

  it('updates hit slop when layout changes', async () => {
    // Arrange
    const { result } = renderHook(() => useAutoHitSlop())
    const onLayout = result.current[1]

    // Act - Simulate layout event with small dimensions
    await act(async () => {
      onLayout(createLayoutEvent({ width: 20, height: 50 }))
    })

    // Assert
    expect(result.current[0]).toEqual({
      top: 0,
      right: 14,
      bottom: 0,
      left: 14,
    })
  })

  it('calls the provided onLayout callback when layout changes', async () => {
    // Arrange
    const mockOnLayout = vi.fn()
    const { result } = renderHook(() => useAutoHitSlop(mockOnLayout))
    const onLayout = result.current[1]
    const layoutEvent = createLayoutEvent({ width: 20, height: 20 })

    // Act
    await act(async () => {
      onLayout(layoutEvent)
    })

    // Assert
    expect(mockOnLayout).toHaveBeenCalledWith(layoutEvent)
  })

  it('does not update state if layout dimensions have not changed', async () => {
    // Arrange
    const { result } = renderHook(() => useAutoHitSlop())
    const onLayout = result.current[1]
    const layoutEvent = createLayoutEvent({ width: 20, height: 20 })

    // Act - Call onLayout with same dimensions twice
    await act(async () => {
      onLayout(layoutEvent)
    })

    const hitSlopAfterFirstUpdate = result.current[0]

    await act(async () => {
      onLayout(layoutEvent) // Same dimensions again
    })

    // Assert - Hit slop should be the same object reference
    expect(result.current[0]).toBe(hitSlopAfterFirstUpdate)
  })
})
