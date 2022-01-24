import { renderHook } from '@testing-library/react-hooks'
import { DEFAULT_DELAY, useDebounceWithStatus } from 'src/utils/timing'

jest.useFakeTimers()

describe('useDebounceWithStatus', () => {
  it('correctly delays updating the value', () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useDebounceWithStatus(value))

    expect(result.current[0]).toEqual('first')
    value = 'second'

    rerender()
    expect(result.current[0]).toEqual('first')

    jest.advanceTimersByTime(DEFAULT_DELAY)
    rerender()
    expect(result.current[0]).toEqual('second')
  })

  it('correctly returns debounce state', () => {
    let value = 'first'
    const { result, rerender } = renderHook(() => useDebounceWithStatus(value))

    expect(result.current[1]).toEqual(true)
    value = 'second'

    rerender()
    expect(result.current[1]).toEqual(true)

    jest.advanceTimersByTime(DEFAULT_DELAY / 2)
    rerender()
    expect(result.current[1]).toEqual(true)

    jest.advanceTimersByTime(DEFAULT_DELAY / 2)
    rerender()
    expect(result.current[1]).toEqual(false)
  })
})
