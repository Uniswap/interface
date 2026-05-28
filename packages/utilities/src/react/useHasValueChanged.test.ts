import { renderHook } from '@testing-library/react'
import { useHasValueChanged } from 'utilities/src/react/useHasValueChanged'

describe('useHasValueChanged', () => {
  it('should return false on initial render', () => {
    const { result } = renderHook(() => useHasValueChanged(0))
    expect(result.current).toBe(false)
  })

  it('should return true when value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useHasValueChanged(value), { initialProps: { value: 0 } })

    rerender({ value: 1 })
    expect(result.current).toBe(true)
  })

  it('should return false when value remains the same', () => {
    const { result, rerender } = renderHook(({ value }) => useHasValueChanged(value), { initialProps: { value: 0 } })

    rerender({ value: 0 })
    expect(result.current).toBe(false)
  })

  it('should handle non-primitive values', () => {
    const initialObject = { a: 1 }
    const updatedObject = { a: 2 }

    const { result, rerender } = renderHook(({ value }) => useHasValueChanged(value), {
      initialProps: { value: initialObject },
    })

    rerender({ value: updatedObject })
    expect(result.current).toBe(true)

    rerender({ value: updatedObject })
    expect(result.current).toBe(false)
  })
})
