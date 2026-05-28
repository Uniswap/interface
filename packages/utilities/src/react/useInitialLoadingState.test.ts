import { renderHook } from '@testing-library/react'
import { useInitialLoadingState } from 'utilities/src/react/useInitialLoadingState'

describe('useInitialLoadingState', () => {
  it('should return true when initially loading', () => {
    const { result } = renderHook(() => useInitialLoadingState(true))
    expect(result.current).toBe(true)
  })

  it('should return false when initially not loading', () => {
    const { result } = renderHook(() => useInitialLoadingState(false))
    expect(result.current).toBe(false)
  })

  it('should return false after loading completes', () => {
    const { result, rerender } = renderHook(({ isLoading }) => useInitialLoadingState(isLoading), {
      initialProps: { isLoading: true },
    })
    expect(result.current).toBe(true)
    rerender({ isLoading: false })
    expect(result.current).toBe(false)
    rerender({ isLoading: false })
    expect(result.current).toBe(false)
    rerender({ isLoading: true })
    expect(result.current).toBe(false)
  })
})
