import { act, renderHook } from '@testing-library/react'
import type { LayoutChangeEvent } from 'react-native'
import {
  DEFAULT_MIN_HEIGHT,
  DEFAULT_MIN_WIDTH,
  useAutoDimensions,
} from 'ui/src/components/touchable/TouchableArea/useAutoDimensions'
import { describe, expect, it, vi } from 'vitest'

// We're testing the mobile version of this hook
vi.mock('utilities/src/platform', () => ({
  isMobileApp: true,
}))

// Helper to create a mock LayoutChangeEvent
const createLayoutChangeEvent = (width: number, height: number): LayoutChangeEvent => {
  return {
    nativeEvent: {
      layout: { x: 0, y: 0, width, height },
    },
  } as LayoutChangeEvent
}

describe('useAutoDimensions', () => {
  it('should return initial undefined dimensions and onLayout handler when shouldConsiderMinimumDimensions is true', () => {
    const { result } = renderHook(() => useAutoDimensions({ shouldConsiderMinimumDimensions: true }))

    expect(result.current.width).toBeUndefined()
    expect(result.current.height).toBeUndefined()
    expect(typeof result.current.onLayout).toBe('function')
  })

  it('should return dimensions from params when shouldConsiderMinimumDimensions is false', () => {
    const widthParam = 100
    const heightParam = 200
    const { result } = renderHook(() =>
      useAutoDimensions({ width: widthParam, height: heightParam, shouldConsiderMinimumDimensions: false }),
    )

    expect(result.current.width).toBe(widthParam)
    expect(result.current.height).toBe(heightParam)
  })

  it('should not update internal dimensions onLayout when shouldConsiderMinimumDimensions is false', () => {
    const widthParam = 100
    const heightParam = 200
    const { result } = renderHook(() =>
      useAutoDimensions({ width: widthParam, height: heightParam, shouldConsiderMinimumDimensions: false }),
    )

    act(() => {
      result.current.onLayout(createLayoutChangeEvent(50, 60))
    })

    // Dimensions should still come from params
    expect(result.current.width).toBe(widthParam)
    expect(result.current.height).toBe(heightParam)
  })

  it('should not update dimensions when layout is above minimums and shouldConsiderMinimumDimensions is true', () => {
    const { result } = renderHook(() => useAutoDimensions({ shouldConsiderMinimumDimensions: true }))

    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH + 10, DEFAULT_MIN_HEIGHT + 10))
    })

    expect(result.current.width).toBeUndefined()
    expect(result.current.height).toBeUndefined()
  })

  it('should update width to minimum when layout width is below minimum and shouldConsiderMinimumDimensions is true', () => {
    const { result } = renderHook(() => useAutoDimensions({ shouldConsiderMinimumDimensions: true }))

    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH - 10, DEFAULT_MIN_HEIGHT + 10))
    })

    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBeUndefined() // Height should remain undefined as it was above min
  })

  it('should update height to minimum when layout height is below minimum and shouldConsiderMinimumDimensions is true', () => {
    const { result } = renderHook(() => useAutoDimensions({ shouldConsiderMinimumDimensions: true }))

    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH + 10, DEFAULT_MIN_HEIGHT - 10))
    })

    expect(result.current.width).toBeUndefined() // Width should remain undefined
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)
  })

  it('should update both width and height to minimums when layout dimensions are below minimums and shouldConsiderMinimumDimensions is true', () => {
    const { result } = renderHook(() => useAutoDimensions({ shouldConsiderMinimumDimensions: true }))

    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH - 10, DEFAULT_MIN_HEIGHT - 10))
    })

    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)
  })

  it('should call the provided onLayout callback', () => {
    const mockOnLayout = vi.fn()
    const { result } = renderHook(() =>
      useAutoDimensions({ onLayout: mockOnLayout, shouldConsiderMinimumDimensions: true }),
    )
    const layoutEvent = createLayoutChangeEvent(50, 50)

    act(() => {
      result.current.onLayout(layoutEvent)
    })

    expect(mockOnLayout).toHaveBeenCalledTimes(1)
    expect(mockOnLayout).toHaveBeenCalledWith(layoutEvent)
  })

  it('should clear dimensions when component grows larger than minimums', () => {
    const { result } = renderHook(() => useAutoDimensions({ shouldConsiderMinimumDimensions: true }))

    // First make component small to set minimum dimensions
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH - 10, DEFAULT_MIN_HEIGHT - 10))
    })

    // Check that minimum dimensions are applied
    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)

    // Now make component larger than minimums
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH + 10, DEFAULT_MIN_HEIGHT + 10))
    })

    // Dimensions should be cleared
    expect(result.current.width).toBeUndefined()
    expect(result.current.height).toBeUndefined()
  })

  it('should clear only width when only width grows larger than minimum', () => {
    const { result } = renderHook(() => useAutoDimensions({ shouldConsiderMinimumDimensions: true }))

    // First make component small to set minimum dimensions
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH - 10, DEFAULT_MIN_HEIGHT - 10))
    })

    // Check that minimum dimensions are applied
    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)

    // Now make only width larger than minimum
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH + 10, DEFAULT_MIN_HEIGHT - 5))
    })

    // Only width should be cleared
    expect(result.current.width).toBeUndefined()
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)
  })

  it('should clear only height when only height grows larger than minimum', () => {
    const { result } = renderHook(() => useAutoDimensions({ shouldConsiderMinimumDimensions: true }))

    // First make component small to set minimum dimensions
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH - 10, DEFAULT_MIN_HEIGHT - 10))
    })

    // Check that minimum dimensions are applied
    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)

    // Now make only height larger than minimum
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH - 5, DEFAULT_MIN_HEIGHT + 10))
    })

    // Only height should be cleared
    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBeUndefined()
  })

  it('should prioritize internal dimensions over params when shouldConsiderMinimumDimensions is true and dimensions are set', () => {
    const widthParam = 100
    const heightParam = 200
    const { result } = renderHook(() =>
      useAutoDimensions({ width: widthParam, height: heightParam, shouldConsiderMinimumDimensions: true }),
    )

    // Initial dimensions are undefined
    expect(result.current.width).toBeUndefined()
    expect(result.current.height).toBeUndefined()

    // Trigger layout below minimums
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH - 10, DEFAULT_MIN_HEIGHT - 10))
    })

    // Dimensions should be updated to minimums, ignoring params
    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)

    // Trigger layout above minimums again
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH + 10, DEFAULT_MIN_HEIGHT + 10))
    })

    // Dimensions should now be cleared
    expect(result.current.width).toBeUndefined()
    expect(result.current.height).toBeUndefined()
  })

  it('should handle layout event updates correctly', () => {
    const { result, rerender } = renderHook(
      ({ shouldConsiderMinimumDimensions }) => useAutoDimensions({ shouldConsiderMinimumDimensions }),
      { initialProps: { shouldConsiderMinimumDimensions: true } },
    )

    // Layout below minimums
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH - 5, DEFAULT_MIN_HEIGHT - 5))
    })
    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)

    // Rerender with different props (though shouldConsiderMinimumDimensions doesn't change the logic *after* first layout)
    rerender({ shouldConsiderMinimumDimensions: true })

    // Layout above minimums - state should now be cleared
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH + 5, DEFAULT_MIN_HEIGHT + 5))
    })
    expect(result.current.width).toBeUndefined()
    expect(result.current.height).toBeUndefined()

    // Layout below minimums again - state should be set to minimums again
    act(() => {
      result.current.onLayout(createLayoutChangeEvent(DEFAULT_MIN_WIDTH - 1, DEFAULT_MIN_HEIGHT - 1))
    })
    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)
  })

  it('should handle edge case with zero dimensions correctly', () => {
    const { result } = renderHook(() => useAutoDimensions({ shouldConsiderMinimumDimensions: true }))

    act(() => {
      result.current.onLayout(createLayoutChangeEvent(0, 0))
    })

    // Zero dimensions should be replaced with minimum dimensions
    expect(result.current.width).toBe(DEFAULT_MIN_WIDTH)
    expect(result.current.height).toBe(DEFAULT_MIN_HEIGHT)
  })
})
