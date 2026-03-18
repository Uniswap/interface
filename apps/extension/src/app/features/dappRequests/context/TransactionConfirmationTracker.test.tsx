import { act, render, renderHook, screen } from '@testing-library/react'
import { PropsWithChildren } from 'react'
import {
  TransactionConfirmationTrackerProvider,
  useTransactionConfirmationTracker,
} from 'src/app/features/dappRequests/context/TransactionConfirmationTracker'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Helper component to test the hook
function TestComponent({ children }: PropsWithChildren): JSX.Element {
  return <TransactionConfirmationTrackerProvider>{children}</TransactionConfirmationTrackerProvider>
}

// Helper component that uses the hook for testing
function TestHookConsumer(): JSX.Element {
  const { markTransactionConfirmed, getDelayForChainId, clearConfirmationTracking } =
    useTransactionConfirmationTracker()

  return (
    <div>
      <button data-testid="mark-confirmed-btn" onClick={() => markTransactionConfirmed(UniverseChainId.Mainnet)}>
        Mark Confirmed
      </button>
      <button
        data-testid="get-delay-btn"
        onClick={() => {
          const delay = getDelayForChainId(UniverseChainId.Mainnet, 5000)
          const element = document.createElement('div')
          element.setAttribute('data-testid', 'delay-result')
          element.textContent = delay.toString()
          document.body.appendChild(element)
        }}
      >
        Get Delay
      </button>
      <button data-testid="clear-tracking-btn" onClick={clearConfirmationTracking}>
        Clear Tracking
      </button>
    </div>
  )
}

describe('TransactionConfirmationTracker', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    // Clean up any elements added to document.body
    const delayResults = document.querySelectorAll('[data-testid="delay-result"]')
    delayResults.forEach((element) => element.remove())
  })

  describe('Provider', () => {
    it('should provide context value to children', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      expect(result.current).toHaveProperty('markTransactionConfirmed')
      expect(result.current).toHaveProperty('getDelayForChainId')
      expect(result.current).toHaveProperty('clearConfirmationTracking')
      expect(typeof result.current.markTransactionConfirmed).toBe('function')
      expect(typeof result.current.getDelayForChainId).toBe('function')
      expect(typeof result.current.clearConfirmationTracking).toBe('function')
    })

    it('should throw error when hook is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useTransactionConfirmationTracker())
      }).toThrow('useTransactionConfirmationTracker must be used within a TransactionConfirmationTrackerProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('Provider initialization with default state', () => {
    it('should return 0 delay for any chain when no transactions have been confirmed', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      const delay = result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)
      expect(delay).toBe(0)
    })

    it('should return 0 delay for multiple different chains', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)
      expect(result.current.getDelayForChainId(UniverseChainId.Polygon, 5000)).toBe(0)
      expect(result.current.getDelayForChainId(UniverseChainId.ArbitrumOne, 5000)).toBe(0)
    })
  })

  describe('markTransactionConfirmed functionality', () => {
    it('should mark a transaction as confirmed and affect subsequent delay calculations', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      // Initially no delay
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)

      // Mark transaction confirmed
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      // Now should have full delay
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(5000)
    })

    it('should update the confirmation timestamp when called multiple times', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      // Mark first transaction
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      // Advance time by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Mark second transaction (should reset the timestamp)
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      // Should have full delay again (not reduced by the previous 2 seconds)
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(5000)
    })

    it('should handle marking confirmations on different chains independently', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      // Mark transaction on Mainnet
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      // Mainnet should have delay, Polygon should not
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(5000)
      expect(result.current.getDelayForChainId(UniverseChainId.Polygon, 5000)).toBe(0)

      // Mark transaction on Polygon
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Polygon)
      })

      // Now both chains should have their own independent delays (no overwriting)
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(5000)
      expect(result.current.getDelayForChainId(UniverseChainId.Polygon, 5000)).toBe(5000)
    })

    it('should maintain independent timing for multiple chains', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      // Mark transaction on Mainnet at T=0
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      // Advance time by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Mark transaction on Polygon at T=2000
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Polygon)
      })

      // Advance time by 1 more second (total 3 seconds from start)
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // At T=3000: Mainnet should have 2000ms delay (5000-3000), Polygon should have 4000ms delay (5000-1000)
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(2000)
      expect(result.current.getDelayForChainId(UniverseChainId.Polygon, 5000)).toBe(4000)

      // Advance time by 3 more seconds (total 6 seconds from start)
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // At T=6000: Mainnet should have 0 delay (elapsed), Polygon should have 1000ms delay remaining
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)
      expect(result.current.getDelayForChainId(UniverseChainId.Polygon, 5000)).toBe(1000)
    })
  })

  describe('getDelayForChainId with various scenarios', () => {
    it('should return 0 for chain that has not been confirmed', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      // Mark transaction on Mainnet
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      // Check delay for different chain
      expect(result.current.getDelayForChainId(UniverseChainId.Polygon, 5000)).toBe(0)
    })

    it('should return full delay immediately after confirmation on same chain', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(5000)
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 3000)).toBe(3000)
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 10000)).toBe(10000)
    })

    it('should return reduced delay as time passes on same chain', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      // Advance time by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(3000)
    })

    it('should return 0 when delay period has fully elapsed', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      // Advance time beyond the delay period
      act(() => {
        jest.advanceTimersByTime(6000)
      })

      act(() => {
        expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)
      })

      // Subsequent calls should still return 0 (delay period has elapsed)
      act(() => {
        expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)
      })
    })

    it('should handle edge case where elapsed time equals max delay', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      // Advance time exactly to the delay period
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      act(() => {
        expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)
      })
    })

    it('should handle zero max delay correctly', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 0)).toBe(0)
    })

    it('should handle negative max delay correctly', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })

      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, -1000)).toBe(0)
    })
  })

  describe('clearConfirmationTracking functionality', () => {
    it('should clear tracking state and reset delays to 0', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      // Mark transaction and verify delay
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(5000)

      // Clear tracking
      act(() => {
        result.current.clearConfirmationTracking()
      })

      // Should now return 0 delay
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)
    })

    it('should work correctly when called multiple times', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      // Clear when there's no tracking (should not error)
      act(() => {
        result.current.clearConfirmationTracking()
      })

      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)

      // Mark transaction, clear, and clear again
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })
      act(() => {
        result.current.clearConfirmationTracking()
      })
      act(() => {
        result.current.clearConfirmationTracking()
      })

      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)
    })

    it('should not affect subsequent markTransactionConfirmed calls', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      // Mark, clear, then mark again
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })
      act(() => {
        result.current.clearConfirmationTracking()
      })
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Polygon)
      })

      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)
      expect(result.current.getDelayForChainId(UniverseChainId.Polygon, 5000)).toBe(5000)
    })

    it('should clear tracking state for all chains', () => {
      const { result } = renderHook(() => useTransactionConfirmationTracker(), {
        wrapper: TestComponent,
      })

      // Mark transactions on multiple chains
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Mainnet)
      })
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.Polygon)
      })
      act(() => {
        result.current.markTransactionConfirmed(UniverseChainId.ArbitrumOne)
      })

      // Verify all chains have delays
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(5000)
      expect(result.current.getDelayForChainId(UniverseChainId.Polygon, 5000)).toBe(5000)
      expect(result.current.getDelayForChainId(UniverseChainId.ArbitrumOne, 5000)).toBe(5000)

      // Clear all tracking
      act(() => {
        result.current.clearConfirmationTracking()
      })

      // All chains should now return 0 delay
      expect(result.current.getDelayForChainId(UniverseChainId.Mainnet, 5000)).toBe(0)
      expect(result.current.getDelayForChainId(UniverseChainId.Polygon, 5000)).toBe(0)
      expect(result.current.getDelayForChainId(UniverseChainId.ArbitrumOne, 5000)).toBe(0)
    })
  })

  describe('Integration with React components', () => {
    it('should work correctly when used in React components', () => {
      render(
        <TestComponent>
          <TestHookConsumer />
        </TestComponent>,
      )

      const markConfirmedBtn = screen.getByTestId('mark-confirmed-btn')
      const getDelayBtn = screen.getByTestId('get-delay-btn')
      const clearTrackingBtn = screen.getByTestId('clear-tracking-btn')

      // Initially should return 0 delay
      act(() => {
        getDelayBtn.click()
      })
      expect(screen.getByTestId('delay-result').textContent).toBe('0')

      // Mark transaction as confirmed
      act(() => {
        markConfirmedBtn.click()
      })

      // Clear previous result and check delay again
      screen.getByTestId('delay-result').remove()
      act(() => {
        getDelayBtn.click()
      })
      expect(screen.getByTestId('delay-result').textContent).toBe('5000')

      // Clear tracking
      act(() => {
        clearTrackingBtn.click()
      })

      // Should return 0 delay again
      screen.getByTestId('delay-result').remove()
      act(() => {
        getDelayBtn.click()
      })
      expect(screen.getByTestId('delay-result').textContent).toBe('0')
    })
  })
})
