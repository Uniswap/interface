import { act, renderHook } from '@testing-library/react'
import { useFreezeWhileSubmitting } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useFreezeWhileSubmitting'

describe('useFreezeWhileSubmitting', () => {
  it('should return latest value when not submitting', () => {
    const { result } = renderHook(() => useFreezeWhileSubmitting('initial', false))

    expect(result.current).toBe('initial')
  })

  it('should return latest value when isSubmitting changes from false to false', () => {
    let latestValue = 'initial'
    const isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    expect(result.current).toBe('initial')

    // Change latest value but keep isSubmitting false
    latestValue = 'updated'
    act(() => {
      rerender()
    })

    expect(result.current).toBe('updated')
  })

  it('should freeze value when submission starts', () => {
    let latestValue = 'initial'
    let isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    expect(result.current).toBe('initial')

    // Start submitting - should freeze the current value
    isSubmitting = true
    act(() => {
      rerender()
    })

    expect(result.current).toBe('initial')

    // Update latest value while submitting - should still return frozen value
    latestValue = 'updated-while-submitting'
    act(() => {
      rerender()
    })

    expect(result.current).toBe('initial')
  })

  it('should unfreeze and return latest value when submission ends', () => {
    let latestValue = 'initial'
    let isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    // Start submitting
    isSubmitting = true
    act(() => {
      rerender()
    })

    expect(result.current).toBe('initial')

    // Update latest value while submitting
    latestValue = 'updated-while-submitting'
    act(() => {
      rerender()
    })

    expect(result.current).toBe('initial')

    // Stop submitting - should return latest value
    isSubmitting = false
    act(() => {
      rerender()
    })

    expect(result.current).toBe('updated-while-submitting')
  })

  it('should handle multiple submission cycles', () => {
    let latestValue = 'initial'
    let isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    // First submission cycle
    isSubmitting = true
    act(() => {
      rerender()
    })
    expect(result.current).toBe('initial')

    latestValue = 'first-update'
    act(() => {
      rerender()
    })
    expect(result.current).toBe('initial')

    isSubmitting = false
    act(() => {
      rerender()
    })
    expect(result.current).toBe('first-update')

    // Second submission cycle
    latestValue = 'second-update'
    act(() => {
      rerender()
    })
    expect(result.current).toBe('second-update')

    isSubmitting = true
    act(() => {
      rerender()
    })
    expect(result.current).toBe('second-update')

    latestValue = 'third-update'
    act(() => {
      rerender()
    })
    expect(result.current).toBe('second-update')

    isSubmitting = false
    act(() => {
      rerender()
    })
    expect(result.current).toBe('third-update')
  })

  it('should handle undefined values', () => {
    let latestValue: string | undefined
    let isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    expect(result.current).toBe(undefined)

    // Start submitting with undefined value
    isSubmitting = true
    act(() => {
      rerender()
    })

    expect(result.current).toBe(undefined)

    // Update to defined value while submitting
    latestValue = 'defined'
    act(() => {
      rerender()
    })

    expect(result.current).toBe(undefined)

    // Stop submitting
    isSubmitting = false
    act(() => {
      rerender()
    })

    expect(result.current).toBe('defined')
  })

  it('should handle object values correctly', () => {
    const initialObject = { id: 1, name: 'initial' }
    const updatedObject = { id: 2, name: 'updated' }

    let latestValue = initialObject
    let isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    expect(result.current).toBe(initialObject)

    // Start submitting
    isSubmitting = true
    act(() => {
      rerender()
    })
    expect(result.current).toBe(initialObject)

    // Update object while submitting
    latestValue = updatedObject
    act(() => {
      rerender()
    })
    expect(result.current).toBe(initialObject)

    // Stop submitting
    isSubmitting = false
    act(() => {
      rerender()
    })
    expect(result.current).toBe(updatedObject)
  })

  it('should handle numeric values', () => {
    let latestValue = 0
    let isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    expect(result.current).toBe(0)

    // Start submitting
    isSubmitting = true
    act(() => {
      rerender()
    })
    expect(result.current).toBe(0)

    // Update value while submitting
    latestValue = 42
    act(() => {
      rerender()
    })
    expect(result.current).toBe(0)

    // Stop submitting
    isSubmitting = false
    act(() => {
      rerender()
    })
    expect(result.current).toBe(42)
  })

  it('should handle boolean values', () => {
    let latestValue = false
    let isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    expect(result.current).toBe(false)

    // Start submitting
    isSubmitting = true
    act(() => {
      rerender()
    })
    expect(result.current).toBe(false)

    // Update value while submitting
    latestValue = true
    act(() => {
      rerender()
    })
    expect(result.current).toBe(false)

    // Stop submitting
    isSubmitting = false
    act(() => {
      rerender()
    })
    expect(result.current).toBe(true)
  })

  it('should handle rapid state changes', () => {
    let latestValue = 'initial'
    let isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    // Rapid changes: start submitting, update value, stop submitting
    isSubmitting = true
    latestValue = 'rapid-update'
    isSubmitting = false

    act(() => {
      rerender()
    })

    // Should return the latest value since we're not submitting
    expect(result.current).toBe('rapid-update')
  })

  it('should maintain referential equality for frozen values', () => {
    const initialObject = { id: 1, name: 'initial' }
    let latestValue = initialObject
    let isSubmitting = false

    const { result, rerender } = renderHook(() => useFreezeWhileSubmitting(latestValue, isSubmitting))

    const firstResult = result.current
    expect(firstResult).toBe(initialObject)

    // Start submitting
    isSubmitting = true
    act(() => {
      rerender()
    })

    const frozenResult = result.current
    expect(frozenResult).toBe(initialObject)
    expect(frozenResult).toBe(firstResult)

    // Update latest value while submitting
    latestValue = { id: 2, name: 'updated' }
    act(() => {
      rerender()
    })

    const stillFrozenResult = result.current
    expect(stillFrozenResult).toBe(initialObject)
    expect(stillFrozenResult).toBe(frozenResult)
  })
})
