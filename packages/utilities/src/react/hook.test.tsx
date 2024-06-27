import { render } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { createRef, forwardRef, useRef } from 'react'
import { act } from 'react-test-renderer'
import { useAsyncData, useForwardRef, useMemoCompare, usePrevious } from './hooks'

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

function createPromise<R>(response: R, timeout = 100): Promise<R> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response)
    }, timeout)
  })
}

describe('useAsyncData', () => {
  it('returns undefined and isLoading set to true before data is loaded', async () => {
    const asyncCallback = jest.fn().mockResolvedValue('data')

    const { result, waitForNextUpdate } = renderHook(() => useAsyncData(asyncCallback))

    expect(result.current).toEqual({ data: undefined, isLoading: true })
    await waitForNextUpdate() // Removes warning about not waiting for an update
  })

  it('returns the data and isLoading set to false after data is loaded', async () => {
    const asyncCallback = jest.fn().mockResolvedValue('data')

    const { result, waitForNextUpdate } = renderHook(() => useAsyncData(asyncCallback))

    expect(result.current).toEqual({ data: undefined, isLoading: true })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current).toEqual({ data: 'data', isLoading: false })
  })

  it('calls onCancel when the component is unmounted and the request is still pending', async () => {
    const asyncCallback = jest.fn().mockResolvedValue('data')
    const onCancel = jest.fn()

    const { unmount } = renderHook(() => useAsyncData(asyncCallback, onCancel))

    await act(() => {
      unmount()
    })

    expect(onCancel).toHaveBeenCalled()
  })

  it("doesn't call onCancel when the component is unmounted and the request is not pending", async () => {
    const asyncCallback = jest.fn().mockResolvedValue('data')
    const onCancel = jest.fn()

    const { unmount, rerender, waitForNextUpdate } = renderHook(() =>
      useAsyncData(asyncCallback, onCancel)
    )

    await act(async () => {
      rerender()
      await waitForNextUpdate()
      unmount()
    })

    expect(onCancel).not.toHaveBeenCalled()
  })

  it("doesn't cancel the callback when the hook is passed the same callback", async () => {
    // Long async callback that won't finish before the new callback is passed
    const initialCallback = jest.fn()
    const cancel = jest.fn()

    const { rerender, waitForNextUpdate } = renderHook(
      ({ asyncCallback, onCancel }) => useAsyncData(asyncCallback, onCancel),
      {
        initialProps: { asyncCallback: initialCallback, onCancel: cancel },
      }
    )

    expect(initialCallback).toHaveBeenCalledTimes(1)
    expect(cancel).not.toHaveBeenCalled()

    await act(async () => {
      rerender({ asyncCallback: initialCallback, onCancel: cancel })
      await waitForNextUpdate()
    })

    // When the hook rerenders and the same callback is passed, it should not cancel the previous one
    expect(initialCallback).toHaveBeenCalledTimes(1)
    expect(cancel).not.toHaveBeenCalled()
  })

  it('cancels the old callback and calls the new one when the callback attribute changes', async () => {
    // Long async callback that won't finish before the new callback is passed
    const initialCallback = jest.fn().mockImplementation(() => createPromise('data'))
    const cancel = jest.fn()
    const { rerender, waitForNextUpdate } = renderHook(
      ({ asyncCallback, onCancel }) => useAsyncData(asyncCallback, onCancel),
      {
        initialProps: { asyncCallback: initialCallback, onCancel: cancel },
      }
    )
    const newCallback = jest.fn().mockResolvedValue('data')

    expect(initialCallback).toHaveBeenCalledTimes(1)
    expect(cancel).toHaveBeenCalledTimes(0)

    await act(async () => {
      rerender({ asyncCallback: newCallback, onCancel: cancel })
      await waitForNextUpdate()
    })

    expect(initialCallback).toHaveBeenCalledTimes(1) // No more calls, the one previous remains
    expect(newCallback).toHaveBeenCalledTimes(1)
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('enters loading state and returns new callback result when the callback changes', async () => {
    const initialCallback = jest.fn().mockImplementation(() => createPromise('data1'))
    const { rerender, result, waitForNextUpdate } = renderHook(
      ({ asyncCallback }) => useAsyncData(asyncCallback),
      {
        initialProps: { asyncCallback: initialCallback },
      }
    )

    expect(result.current).toEqual({ data: undefined, isLoading: true })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current).toEqual({ data: 'data1', isLoading: false })

    // Re-render with a new callback
    const newCallback = jest.fn().mockImplementation(() => createPromise('data2'))

    await act(async () => {
      rerender({ asyncCallback: newCallback })
    })

    expect(result.current).toEqual({ data: undefined, isLoading: true })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current).toEqual({ data: 'data2', isLoading: false })
  })

  it("doesn't cause additional re-renders when the callback attribute changes", async () => {
    // Long async callback that won't finish before the new callback is passed
    const onCancel = jest.fn().mockImplementation(() => createPromise('data'))

    let rendersCount = 0

    const fn1 = jest.fn().mockImplementation(() => createPromise('data'))
    const { rerender, result, waitForNextUpdate } = renderHook(() => {
      rendersCount += 1
      return useAsyncData(fn1, onCancel)
    })

    expect(rendersCount).toBe(1)

    const fn2 = jest.fn().mockImplementation(() => createPromise('data'))
    await act(async () => {
      rerender({ asyncCallback: fn2, onCancel })
      await waitForNextUpdate()
    })

    // The hook should only re-render because of the new async callback
    // (it shouldn't update internal state to indicate loading)
    expect(rendersCount).toBe(2)
    expect(result.current).toEqual({ data: undefined, isLoading: true })
  })
})

describe('useMemoCompare', () => {
  it('returns the same value when the comparison function returns true', () => {
    const initialValue = { a: 1 }
    const { result, rerender } = renderHook(
      (props) =>
        useMemoCompare(
          () => props,
          () => true
        ),
      {
        initialProps: initialValue,
      }
    )

    rerender({ a: 1 })
    expect(result.current).toBe(initialValue) // Check that the reference is the same as the initial value
  })

  it('returns the new value when the comparison function returns false', () => {
    const { result, rerender } = renderHook(
      (props) =>
        useMemoCompare(
          () => props,
          () => false
        ),
      {
        initialProps: { a: 1 },
      }
    )

    const newValue = { a: 2 }
    rerender(newValue)
    expect(result.current).toEqual(newValue) // Check that the reference is the same as the new value
  })
})

describe('useForwardRef', () => {
  it('should forward localRef properties into forwardedRef', async () => {
    const fn1 = jest.fn()
    const refData = { prop1: 'value1', prop2: 'value2', fn1 }

    type RefType = typeof refData

    const TestComponent = forwardRef<RefType>(function TestComponent(_, ref) {
      const localRef = useRef<RefType>(refData)
      useForwardRef(ref, localRef)

      return null
    })

    const forwardedRef = createRef<RefType>()

    await act(async () => {
      render(<TestComponent ref={forwardedRef} />)
    })

    // Now check if forwardRef has the properties from the initial object
    expect(forwardedRef.current?.prop1).toEqual('value1')
    expect(forwardedRef.current?.prop2).toEqual('value2')
    expect(forwardedRef.current?.fn1).toEqual(fn1)
  })
})
