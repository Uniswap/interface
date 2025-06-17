import { renderHook } from '@testing-library/react'
import useInterval from 'lib/hooks/useInterval'

describe('useInterval', () => {
  const spy = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('with no interval it does not run', () => {
    renderHook(() => useInterval(spy, null))
    expect(spy).toHaveBeenCalledTimes(0)
  })

  describe('with a synchronous function', () => {
    it('runs on an interval', () => {
      vi.useFakeTimers()

      renderHook(() => useInterval(spy, 100))
      expect(spy).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('with an async funtion', () => {
    it('runs on an interval exclusive of fn resolving', async () => {
      vi.useFakeTimers()
      spy.mockImplementation(() => Promise.resolve(undefined))

      renderHook(() => useInterval(spy, 100))
      expect(spy).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      expect(spy).toHaveBeenCalledTimes(1)

      await spy.mock.results[0].value
      vi.advanceTimersByTime(100)
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })
})
