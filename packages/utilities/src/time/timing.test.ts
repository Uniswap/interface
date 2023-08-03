import { renderHook } from '@testing-library/react-hooks'
import { act } from 'react-test-renderer'
import { DEFAULT_DELAY, useDebounceWithStatus } from './timing'

jest.useFakeTimers()

describe('useDebounceWithStatus', () => {
  it('correctly delays updating the value', async () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useDebounceWithStatus(value))

    expect(result.current[0]).toEqual('first')
    value = 'second'

    rerender()
    expect(result.current[0]).toEqual('first')

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DELAY)
    })
    rerender()
    expect(result.current[0]).toEqual('second')
  })

  it('correctly returns debounce state', async () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useDebounceWithStatus(value))

    expect(result.current[1]).toEqual(true)
    value = 'second'

    rerender()
    expect(result.current[1]).toEqual(true)

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DELAY / 2)
    })
    rerender()
    expect(result.current[1]).toEqual(true)

    await act(() => {
      jest.advanceTimersByTime(DEFAULT_DELAY / 2)
    })
    rerender()
    expect(result.current[1]).toEqual(false)
  })
})
