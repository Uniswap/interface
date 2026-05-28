import { act, renderHook } from '@testing-library/react'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

describe('useBooleanState', () => {
  it('should initialize to `false` when using the default value', () => {
    const { result } = renderHook(() => useBooleanState())
    expect(result.current.value).toBe(false)
  })

  it('should initialize with the provided initial value', () => {
    const { result } = renderHook(() => useBooleanState(true))
    expect(result.current.value).toBe(true)
  })

  it('`setTrue` should set value to `true`', () => {
    const { result } = renderHook(() => useBooleanState())

    act(() => {
      result.current.setTrue()
    })

    expect(result.current.value).toBe(true)
  })

  it('`setFalse` should set value to `false`', () => {
    const { result } = renderHook(() => useBooleanState(true))

    act(() => {
      result.current.setFalse()
    })

    expect(result.current.value).toBe(false)
  })

  it('`toggle` should toggle value', () => {
    const { result } = renderHook(() => useBooleanState())

    act(() => {
      result.current.toggle()
    })

    expect(result.current.value).toBe(true)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.value).toBe(false)
  })

  it('`setValue` should set value to a specific boolean', () => {
    const { result } = renderHook(() => useBooleanState())

    act(() => {
      result.current.setValue(true)
    })

    expect(result.current.value).toBe(true)

    act(() => {
      result.current.setValue(false)
    })

    expect(result.current.value).toBe(false)
  })
})
