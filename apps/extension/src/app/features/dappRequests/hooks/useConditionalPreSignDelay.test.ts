import { renderHook } from '@testing-library/react'
import { useTransactionConfirmationTracker } from 'src/app/features/dappRequests/context/TransactionConfirmationTracker'
import { useConditionalPreSignDelay } from 'src/app/features/dappRequests/hooks/useConditionalPreSignDelay'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import type { MockInstance, Mocked, MockedFunction } from 'vitest'

// Mock the TransactionConfirmationTracker hook
vi.mock('src/app/features/dappRequests/context/TransactionConfirmationTracker', () => ({
  useTransactionConfirmationTracker: vi.fn(),
}))

// Mock the logger
vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

const mockUseTransactionConfirmationTracker = useTransactionConfirmationTracker as MockedFunction<
  typeof useTransactionConfirmationTracker
>

const mockLogger = logger as Mocked<typeof logger>

describe('useConditionalPreSignDelay', () => {
  const mockCallback = vi.fn()
  const mockGetDelayForChainId = vi.fn()

  // Mock timer functions
  let setTimeoutSpy: MockInstance
  let clearTimeoutSpy: MockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    // Default mock implementation
    mockUseTransactionConfirmationTracker.mockReturnValue({
      getDelayForChainId: mockGetDelayForChainId,
      markTransactionConfirmed: vi.fn(),
      clearConfirmationTracking: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    setTimeoutSpy.mockRestore()
    clearTimeoutSpy.mockRestore()
  })

  describe('when no delay is needed', () => {
    beforeEach(() => {
      mockGetDelayForChainId.mockReturnValue(0)
    })

    it('should execute callback immediately when delay is 0', () => {
      renderHook(() =>
        useConditionalPreSignDelay({
          callback: mockCallback,
          chainId: UniverseChainId.Mainnet,
        }),
      )

      expect(mockGetDelayForChainId).toHaveBeenCalledWith(UniverseChainId.Mainnet, 1500)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0)

      // Fast-forward timers to execute the callback
      vi.runAllTimers()

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should execute callback immediately when chainId is undefined', () => {
      renderHook(() =>
        useConditionalPreSignDelay({
          callback: mockCallback,
          chainId: undefined,
        }),
      )

      expect(mockGetDelayForChainId).not.toHaveBeenCalled()
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0)

      vi.runAllTimers()

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('when delay is needed', () => {
    beforeEach(() => {
      mockGetDelayForChainId.mockReturnValue(500) // 500ms delay
    })

    it('should execute callback after the specified delay', () => {
      renderHook(() =>
        useConditionalPreSignDelay({
          callback: mockCallback,
          chainId: UniverseChainId.Mainnet,
        }),
      )

      expect(mockGetDelayForChainId).toHaveBeenCalledWith(UniverseChainId.Mainnet, 1500)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500)

      // Callback should not be called immediately
      expect(mockCallback).not.toHaveBeenCalled()

      // Fast-forward half the delay
      vi.advanceTimersByTime(250)
      expect(mockCallback).not.toHaveBeenCalled()

      // Fast-forward the rest of the delay
      vi.advanceTimersByTime(250)
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should not execute callback if timer is cleared before delay completes', () => {
      const { unmount } = renderHook(() =>
        useConditionalPreSignDelay({
          callback: mockCallback,
          chainId: UniverseChainId.Mainnet,
        }),
      )

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500)

      // Unmount before delay completes
      unmount()

      // Should have cleared the timeout
      expect(clearTimeoutSpy).toHaveBeenCalled()

      // Fast-forward past the delay
      vi.runAllTimers()

      // Callback should not have been called
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('dependency changes', () => {
    it('should clear previous timeout and set new one when chainId changes', () => {
      mockGetDelayForChainId
        .mockReturnValueOnce(300) // First call returns 300ms
        .mockReturnValueOnce(500) // Second call returns 500ms

      const { rerender } = renderHook(
        ({ chainId }) =>
          useConditionalPreSignDelay({
            callback: mockCallback,
            chainId,
          }),
        {
          initialProps: { chainId: UniverseChainId.Mainnet },
        },
      )

      // Initial render should set timeout with 300ms
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300)
      expect(clearTimeoutSpy).not.toHaveBeenCalled()

      // Change chainId
      rerender({ chainId: UniverseChainId.Polygon })

      // Should clear previous timeout and set new one
      expect(clearTimeoutSpy).toHaveBeenCalled()
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500)
      expect(mockGetDelayForChainId).toHaveBeenCalledWith(UniverseChainId.Polygon, 1500)
    })

    it('should clear previous timeout and set new one when callback changes', () => {
      const secondCallback = vi.fn()
      mockGetDelayForChainId.mockReturnValue(200)

      const { rerender } = renderHook(
        ({ callback }) =>
          useConditionalPreSignDelay({
            callback,
            chainId: UniverseChainId.Mainnet,
          }),
        {
          initialProps: { callback: mockCallback },
        },
      )

      // Initial render
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200)
      const initialTimeoutCount = setTimeoutSpy.mock.calls.length

      // Change callback
      rerender({ callback: secondCallback })

      // Should clear previous timeout and set new one
      expect(clearTimeoutSpy).toHaveBeenCalled()
      expect(setTimeoutSpy).toHaveBeenCalledTimes(initialTimeoutCount + 1)

      // Fast-forward to execute the new callback
      vi.runAllTimers()

      expect(mockCallback).not.toHaveBeenCalled()
      expect(secondCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanup behavior', () => {
    it('should cleanup timeout on unmount', () => {
      mockGetDelayForChainId.mockReturnValue(1000)

      const { unmount } = renderHook(() =>
        useConditionalPreSignDelay({
          callback: mockCallback,
          chainId: UniverseChainId.Mainnet,
        }),
      )

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)

      // Unmount the component
      unmount()

      // Should have cleared the timeout
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should handle multiple rapid dependency changes without memory leaks', () => {
      mockGetDelayForChainId.mockReturnValue(100)

      const { rerender } = renderHook(
        ({ callback }) =>
          useConditionalPreSignDelay({
            callback,
            chainId: UniverseChainId.Mainnet,
          }),
        {
          initialProps: { callback: mockCallback },
        },
      )

      // Rapidly change callback multiple times
      const callbacks = [vi.fn(), vi.fn(), vi.fn()]
      callbacks.forEach((cb) => {
        rerender({ callback: cb })
      })

      // Should have cleared timeout for each change except the last one
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(callbacks.length)
    })
  })

  describe('edge cases', () => {
    it('should handle async callback without issues', async () => {
      const asyncCallback = vi.fn().mockResolvedValue('success')
      mockGetDelayForChainId.mockReturnValue(0)

      renderHook(() =>
        useConditionalPreSignDelay({
          callback: asyncCallback,
          chainId: UniverseChainId.Mainnet,
        }),
      )

      vi.runAllTimers()

      expect(asyncCallback).toHaveBeenCalledTimes(1)
    })

    it('should handle callback that throws an error gracefully', () => {
      const testError = new Error('Test error')
      const errorCallback = vi.fn().mockImplementation(() => {
        throw testError
      })
      mockGetDelayForChainId.mockReturnValue(0)

      // Should not throw - errors should be caught and handled
      expect(() => {
        renderHook(() =>
          useConditionalPreSignDelay({
            callback: errorCallback,
            chainId: UniverseChainId.Mainnet,
          }),
        )

        vi.runAllTimers()
      }).not.toThrow()

      expect(errorCallback).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith(testError, {
        tags: {
          file: 'useConditionalPreSignDelay.ts',
          function: 'executeCallback',
        },
      })
    })

    it('should use the correct delay constant (1500ms) when calling getDelayForChainId', () => {
      mockGetDelayForChainId.mockReturnValue(0)

      renderHook(() =>
        useConditionalPreSignDelay({
          callback: mockCallback,
          chainId: UniverseChainId.Polygon,
        }),
      )

      expect(mockGetDelayForChainId).toHaveBeenCalledWith(UniverseChainId.Polygon, 1500)
    })
  })
})
