import { useDeferredCaret } from 'uniswap/src/components/CurrencyInputPanel/hooks/useDeferredCaret'
import { act, renderHook } from 'uniswap/src/test/test-utils'

describe(useDeferredCaret, () => {
  it('applies a caret right away when no value is named', () => {
    const { result } = renderHook(useDeferredCaret, { initialProps: ['12'] })

    act(() => result.current.setCaret({ start: 1 }))

    expect(result.current.selection).toEqual({ start: 1, end: 1 })
  })

  it('applies a caret right away when it names the value already on screen', () => {
    const { result } = renderHook(useDeferredCaret, { initialProps: ['12'] })

    act(() => result.current.setCaret({ start: 0, end: 2, value: '12' }))

    expect(result.current.selection).toEqual({ start: 0, end: 2 })
  })

  it('holds a caret until the render that carries the value it names', () => {
    const { result, rerender } = renderHook(useDeferredCaret, { initialProps: ['12'] })

    act(() => result.current.setCaret({ start: 3, value: '123' }))
    expect(result.current.selection).toBeUndefined()

    rerender(['123'])
    expect(result.current.selection).toEqual({ start: 3, end: 3 })
  })

  it('flushes a held caret when the value moves on without it', () => {
    const { result, rerender } = renderHook(useDeferredCaret, { initialProps: ['12'] })

    act(() => result.current.setCaret({ start: 3, value: '123' }))
    rerender(['9'])

    expect(result.current.selection).toEqual({ start: 3, end: 3 })
  })

  it('drops a held caret superseded by an immediate one', () => {
    const { result, rerender } = renderHook(useDeferredCaret, { initialProps: ['12'] })

    // a rejected keypress: the caret names a value that never arrives
    act(() => result.current.setCaret({ start: 3, value: '123' }))
    act(() => result.current.setCaret({ start: 0 }))
    expect(result.current.selection).toEqual({ start: 0, end: 0 })

    rerender(['5'])
    expect(result.current.selection).toEqual({ start: 0, end: 0 })
  })

  it('follows a caret the user moved natively', () => {
    const { result } = renderHook(useDeferredCaret, { initialProps: ['12'] })

    act(() => result.current.followNativeSelection({ start: 1, end: 2 }))

    expect(result.current.selection).toEqual({ start: 1, end: 2 })
  })
})
