import { createStore, Store } from 'redux'
import type { GetCapabilitiesResult } from 'state/walletCapabilities/lib/types'
import reducer, {
  handleResetWalletCapabilitiesState,
  selectIsAtomicBatchingSupported,
  selectIsAtomicBatchingSupportedByChainId,
  selectNeedsToCheckCapabilities,
  setCapabilitiesByChain,
  setCapabilitiesNotSupported,
} from 'state/walletCapabilities/reducer'
import { GetCapabilitiesStatus, WalletCapabilitiesState } from 'state/walletCapabilities/types'

describe('walletCapabilities reducer', () => {
  let store: Store<WalletCapabilitiesState>

  // Helper to create state object expected by selectors
  const getState = () => ({ walletCapabilities: store.getState() })

  // Mock capabilities with proper structure matching the expected data flow
  // In the reducer, isAtomicBatchingSupported receives chainCapabilities?.atomic?.status
  const mockCapabilities: GetCapabilitiesResult = {
    '0x1': {
      atomic: {
        status: 'supported', // Will pass chainCapabilities?.atomic?.status to isAtomicBatchingSupported
      },
    },
    '0x2': {
      atomic: {
        status: 'ready', // Will pass chainCapabilities?.atomic?.status to isAtomicBatchingSupported
      },
    },
    '0x3': {
      atomic: {
        status: 'unsupported', // Will pass chainCapabilities?.atomic?.status to isAtomicBatchingSupported
      },
    },
    '0x4': {
      someOtherCapability: {
        feature: 'value',
      }, // This chain doesn't have atomic capability
    },
  }

  beforeEach(() => {
    store = createStore(reducer)
  })

  it('should have the correct initial state', () => {
    expect(store.getState()).toEqual({
      getCapabilitiesStatus: 'Unknown',
      byChain: {},
    })
  })

  describe('reducer actions', () => {
    it('should handle all actions correctly', () => {
      // Test setCapabilitiesNotSupported
      store.dispatch(setCapabilitiesNotSupported())
      expect(store.getState().getCapabilitiesStatus).toBe(GetCapabilitiesStatus.Unsupported)

      // Test setCapabilitiesByChain
      store = createStore(reducer) // Reset store
      store.dispatch(setCapabilitiesByChain(mockCapabilities))
      expect(store.getState()).toEqual({
        getCapabilitiesStatus: 'Supported',
        byChain: mockCapabilities,
      })

      // Test handleResetWalletCapabilitiesState
      store.dispatch(handleResetWalletCapabilitiesState())
      expect(store.getState()).toEqual({
        getCapabilitiesStatus: 'Unknown',
        byChain: {},
      })
    })
  })

  describe('selectors', () => {
    describe('selectNeedsToCheckCapabilities', () => {
      it('should return the correct value based on status', () => {
        // Unknown status (initial)
        expect(selectNeedsToCheckCapabilities(getState())).toBe(true)

        // After setting to not supported
        store.dispatch(setCapabilitiesNotSupported())
        expect(selectNeedsToCheckCapabilities(getState())).toBe(false)
      })
    })

    describe('selectIsAtomicBatchingSupported', () => {
      it('should correctly detect atomic batching support', () => {
        // No chains support atomic batching (initial)
        expect(selectIsAtomicBatchingSupported(getState())).toBe(false)

        // Some chains support atomic batching
        store.dispatch(setCapabilitiesByChain(mockCapabilities))
        expect(selectIsAtomicBatchingSupported(getState())).toBe(true)

        // No chains support atomic batching (all unsupported)
        store = createStore(reducer)
        store.dispatch(
          setCapabilitiesByChain({
            '0x1': {
              atomic: {
                status: 'unsupported', // This will fail the isAtomicBatchingSupported check
              },
            },
            '0x2': {
              atomic: {
                status: 'unsupported', // This will fail the isAtomicBatchingSupported check
              },
            },
          }),
        )
        expect(selectIsAtomicBatchingSupported(getState())).toBe(false)
      })
    })

    describe('selectIsAtomicBatchingSupportedByChainId', () => {
      it('should handle different capability states', () => {
        // Initial state (Unknown)
        const initialSelector = selectIsAtomicBatchingSupportedByChainId(getState())
        expect(initialSelector(1)).toBeUndefined()

        // Unsupported
        store.dispatch(setCapabilitiesNotSupported())
        const unsupportedSelector = selectIsAtomicBatchingSupportedByChainId(getState())
        expect(unsupportedSelector(1)).toBe(false)

        // With capabilities
        store = createStore(reducer)
        store.dispatch(setCapabilitiesByChain(mockCapabilities))
        const selector = selectIsAtomicBatchingSupportedByChainId(getState())

        // Test various chain IDs
        expect(selector(1)).toBe(true) // Chain 1 has status 'supported'
        expect(selector(2)).toBe(true) // Chain 2 has status 'ready'
        expect(selector(3)).toBe(false) // Chain 3 has status 'unsupported'
        expect(selector(4)).toBe(false) // Chain 4 has no atomic capability
        expect(selector(999)).toBe(false) // Chain 999 not in map
      })
    })
  })

  describe('isAtomicBatchingSupported helper', () => {
    it('should correctly identify supported status values', () => {
      // Test cases to verify the isAtomicBatchingSupported function's behavior
      // This tests that the internal helper correctly evaluates string values
      const testCases = [
        { chainId: '0x1', atomicStatus: 'supported', expected: true },
        { chainId: '0x2', atomicStatus: 'ready', expected: true },
        { chainId: '0x3', atomicStatus: 'unsupported', expected: false },
        { chainId: '0x4', atomicStatus: 'something-else', expected: false },
        { chainId: '0x5', atomicStatus: undefined, expected: false },
      ]

      testCases.forEach(({ chainId, atomicStatus, expected }) => {
        store = createStore(reducer)
        // Create capabilities where the .atomic.status will be passed to isAtomicBatchingSupported
        const capabilities: GetCapabilitiesResult = {
          [chainId]:
            atomicStatus !== undefined
              ? {
                  atomic: {
                    status: atomicStatus,
                  },
                }
              : {},
        }
        store.dispatch(setCapabilitiesByChain(capabilities))

        // Test if the specific chain is supported
        const selector = selectIsAtomicBatchingSupportedByChainId(getState())
        expect(selector(parseInt(chainId.substring(2), 16))).toBe(expected)
      })
    })
  })
})
