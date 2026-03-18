import { renderHook } from '@testing-library/react'
import { useMemoCompare, usePrevious } from 'utilities/src/react/hooks'

describe('usePrevious', () => {
  it('returns undefined on first render', () => {
    const { result } = renderHook(() => usePrevious(1))

    expect(result.current).toBe(undefined)
  })

  it('returns the previous value', () => {
    const { result, rerender } = renderHook((props) => usePrevious(props), {
      initialProps: 1,
    })

    rerender(2)
    expect(result.current).toBe(1)

    rerender(3)
    expect(result.current).toBe(2)
  })
})

describe('useMemoCompare', () => {
  it('returns the same value when the comparison function returns true', () => {
    const initialValue = { a: 1 }
    const { result, rerender } = renderHook(
      (props) =>
        useMemoCompare(
          () => props,
          () => true,
        ),
      {
        initialProps: initialValue,
      },
    )

    rerender({ a: 1 })
    expect(result.current).toBe(initialValue) // Check that the reference is the same as the initial value
  })

  it('returns the new value when the comparison function returns false', () => {
    const { result, rerender } = renderHook(
      (props) =>
        useMemoCompare(
          () => props,
          () => false,
        ),
      {
        initialProps: { a: 1 },
      },
    )

    const newValue = { a: 2 }
    rerender(newValue)
    expect(result.current).toEqual(newValue) // Check that the reference is the same as the new value
  })
})
