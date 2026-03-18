import { ApolloError } from '@apollo/client'
import { usePersistedError } from 'uniswap/src/features/dataApi/utils/usePersistedError'
import { renderHook } from 'uniswap/src/test/test-utils'

describe(usePersistedError, () => {
  it('returns undefined when no error is passed', () => {
    const { result } = renderHook(() => usePersistedError(false))

    expect(result.current).toBeUndefined()
  })

  it('returns error when error is passed', () => {
    const error = new ApolloError({})
    const { result } = renderHook(() => usePersistedError(false, error))

    expect(result.current).toBe(error)
  })

  describe('when is not loading', () => {
    it('returns undefined if error was previously passed and undefined is passed later', () => {
      const error = new ApolloError({})
      const { result, rerender } = renderHook(usePersistedError, {
        initialProps: [false, error],
      })

      expect(result.current).toBe(error)

      rerender([false])

      expect(result.current).toBeUndefined()
    })

    it('returns new error if error was previously passed and new error is passed later', () => {
      const error1 = new ApolloError({})
      const error2 = new ApolloError({})
      const { result, rerender } = renderHook(usePersistedError, {
        initialProps: [false, error1],
      })

      expect(result.current).toBe(error1)

      rerender([false, error2])

      expect(result.current).toBe(error2)
    })
  })

  describe('when is loading', () => {
    it('returns undefined if error was previously passed and undefined is passed later when loading is finished', () => {
      const error = new ApolloError({})
      const { result, rerender } = renderHook(usePersistedError, {
        initialProps: [false, error],
      })

      expect(result.current).toBe(error)

      rerender([true])

      expect(result.current).toBe(error) // still retruns error as loading is not finished

      rerender([false])

      expect(result.current).toBeUndefined() // returns undefined as loading is finished
    })

    it('returns error if error was previously passed and new error is passed later', () => {
      const error1 = new ApolloError({})
      const error2 = new ApolloError({})
      const { result, rerender } = renderHook(usePersistedError, {
        initialProps: [false, error1],
      })

      expect(result.current).toBe(error1)

      rerender([true, error2])

      expect(result.current).toBe(error2) // returns the new error because it is passed
    })
  })
})
