import { renderHook } from '@testing-library/react'
import { usePreviousWithLayoutEffect } from 'utilities/src/react/usePreviousWithLayoutEffect'

describe('usePreviousWithLayoutEffect', () => {
  it('should return the value that was passed in on initial call', () => {
    const initialValue = 0

    const { result } = renderHook(({ value }) => usePreviousWithLayoutEffect(value), {
      initialProps: { value: initialValue },
    })
    expect(result.current).toBe(initialValue)
  })

  it('should return the previous value after update', () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousWithLayoutEffect(value), {
      initialProps: { value: 0 },
    })

    rerender({ value: 1 })
    expect(result.current).toBe(0)

    rerender({ value: 2 })
    expect(result.current).toBe(1)
  })

  it('should handle non-primitive values', () => {
    const initialObject = { a: 1 }
    const updatedObject = { a: 2 }

    const { result, rerender } = renderHook(({ value }) => usePreviousWithLayoutEffect(value), {
      initialProps: { value: initialObject },
    })

    rerender({ value: updatedObject })
    expect(result.current).toBe(initialObject)
  })
})
