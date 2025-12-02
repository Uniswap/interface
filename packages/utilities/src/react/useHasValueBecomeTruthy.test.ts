import { renderHook } from '@testing-library/react'
import { useHasValueBecomeTruthy } from 'utilities/src/react/useHasValueBecomeTruthy'

describe('useHasValueBecomeTruthy', () => {
  it('should return false on initial render with truthy value', () => {
    const { result } = renderHook(() => useHasValueBecomeTruthy(true))
    expect(result.current).toBe(false)
  })

  it('should return false on initial render with falsy value', () => {
    const { result } = renderHook(() => useHasValueBecomeTruthy(false))
    expect(result.current).toBe(false)
  })

  it('should return true when value changes from falsy to truthy', () => {
    const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
      initialProps: { value: false },
    })

    rerender({ value: true })
    expect(result.current).toBe(true)
  })

  it('should return false when value changes from truthy to falsy', () => {
    const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
      initialProps: { value: true },
    })

    rerender({ value: false })
    expect(result.current).toBe(false)
  })

  it('should return false when value remains truthy', () => {
    const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
      initialProps: { value: true },
    })

    rerender({ value: true })
    expect(result.current).toBe(false)
  })

  it('should return false when value remains falsy', () => {
    const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
      initialProps: { value: false },
    })

    rerender({ value: false })
    expect(result.current).toBe(false)
  })

  describe('with different falsy values', () => {
    it('should handle transition from null to truthy value', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: null as string | null },
      })

      rerender({ value: 'truthy' })
      expect(result.current).toBe(true)
    })

    it('should handle transition from undefined to truthy value', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: undefined as number | undefined },
      })

      rerender({ value: 1 })
      expect(result.current).toBe(true)
    })

    it('should handle transition from 0 to truthy value', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: 0 },
      })

      rerender({ value: 1 })
      expect(result.current).toBe(true)
    })

    it('should handle transition from empty string to truthy value', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: '' },
      })

      rerender({ value: 'text' })
      expect(result.current).toBe(true)
    })
  })

  describe('with different truthy values', () => {
    it('should handle non-zero numbers', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: 0 },
      })

      rerender({ value: 42 })
      expect(result.current).toBe(true)

      rerender({ value: 100 })
      expect(result.current).toBe(false)
    })

    it('should handle strings', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: '' },
      })

      rerender({ value: 'hello' })
      expect(result.current).toBe(true)

      rerender({ value: 'world' })
      expect(result.current).toBe(false)
    })

    it('should handle objects', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: null as { a: number } | null },
      })

      rerender({ value: { a: 1 } })
      expect(result.current).toBe(true)

      rerender({ value: { a: 2 } })
      expect(result.current).toBe(false)
    })

    it('should handle arrays', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: null as number[] | null },
      })

      rerender({ value: [1, 2, 3] })
      expect(result.current).toBe(true)

      rerender({ value: [4, 5, 6] })
      expect(result.current).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle multiple transitions between falsy and truthy', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: false },
      })

      // false -> true (should be true)
      rerender({ value: true })
      expect(result.current).toBe(true)

      // true -> false (should be false)
      rerender({ value: false })
      expect(result.current).toBe(false)

      // false -> true (should be true again)
      rerender({ value: true })
      expect(result.current).toBe(true)

      // true -> true (should be false)
      rerender({ value: true })
      expect(result.current).toBe(false)
    })

    it('should handle transition between different falsy values', () => {
      const { result, rerender } = renderHook(({ value }) => useHasValueBecomeTruthy(value), {
        initialProps: { value: null as string | null | undefined },
      })

      rerender({ value: undefined })
      expect(result.current).toBe(false)

      rerender({ value: '' })
      expect(result.current).toBe(false)

      rerender({ value: 'truthy' as string })
      expect(result.current).toBe(true)
    })
  })
})
