import { PayloadAction } from '@reduxjs/toolkit'
import {
  getHandleOnSetActiveChainId,
  getHandleOnUpdateDelegatedState,
} from 'uniswap/src/features/smartWallet/delegation/effects'
import { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'

describe('effects', () => {
  describe('getHandleOnUpdateDelegatedState', () => {
    const mockOnDelegationDetected = jest.fn()
    const mockOnNewDelegateState = jest.fn()

    const defaultOriginalState = {
      delegation: {
        delegations: {
          '1': '0xexistingAddress1',
          '2': '0xexistingAddress2',
        },
        activeChainId: 1,
      } satisfies DelegatedState,
    }

    let getOriginalState: jest.Mock
    let getState: jest.Mock

    beforeEach(() => {
      jest.clearAllMocks()
      getOriginalState = jest.fn().mockReturnValue(defaultOriginalState)
      getState = jest.fn()
    })

    test.each([
      // Scenario 1: Adding a new delegation
      {
        description: 'adding a new delegation',
        currentState: {
          delegation: {
            delegations: {
              '1': '0xexistingAddress1',
              '2': '0xexistingAddress2',
              '3': '0xnewAddress',
            },
            activeChainId: 1,
          } satisfies DelegatedState,
        },
        action: { chainId: '3', address: '0xnewAddress' },
        expectedIsActiveChain: false,
      },
      // Scenario 2: Updating an existing delegation
      {
        description: 'updating an existing delegation',
        currentState: {
          delegation: {
            delegations: {
              '1': '0xupdatedAddress',
              '2': '0xexistingAddress2',
            },
            activeChainId: 1,
          } satisfies DelegatedState,
        },
        action: { chainId: '1', address: '0xupdatedAddress' },
        expectedIsActiveChain: true,
      },
    ])('should trigger callbacks when $description', ({ currentState, action, expectedIsActiveChain }) => {
      // Setup
      getState.mockReturnValue(currentState)

      const handler = getHandleOnUpdateDelegatedState({
        getOriginalState,
        getState,
        onDelegationDetected: mockOnDelegationDetected,
        onNewDelegateState: mockOnNewDelegateState,
      })

      // Execute
      handler({ action: { payload: action } as PayloadAction<{ chainId: string; address: string }> })

      // Verify
      expect(mockOnNewDelegateState).toHaveBeenCalledWith({
        delegations: currentState.delegation.delegations,
      })

      expect(mockOnDelegationDetected).toHaveBeenCalledWith({
        chainId: parseInt(action.chainId, 10),
        address: action.address,
        isActiveChain: expectedIsActiveChain,
      })
    })

    test.each([
      // Scenario 3: No change to existing delegation
      {
        description: 'no change to existing delegation',
        currentState: {
          delegation: {
            delegations: {
              '1': '0xexistingAddress1',
              '2': '0xexistingAddress2',
            },
            activeChainId: 1,
          } satisfies DelegatedState,
        },
        action: { chainId: '1', address: '0xexistingAddress1' },
      },
    ])('should not trigger callbacks when $description', ({ currentState, action }) => {
      // Setup
      getState.mockReturnValue(currentState)

      const handler = getHandleOnUpdateDelegatedState({
        getOriginalState,
        getState,
        onDelegationDetected: mockOnDelegationDetected,
        onNewDelegateState: mockOnNewDelegateState,
      })

      // Execute
      handler({ action: { payload: action } as PayloadAction<{ chainId: string; address: string }> })

      // Verify
      expect(mockOnNewDelegateState).not.toHaveBeenCalled()
      expect(mockOnDelegationDetected).not.toHaveBeenCalled()
    })
  })

  describe('getHandleOnSetActiveChainId', () => {
    const mockOnDelegationDetected = jest.fn()

    const defaultState = {
      delegation: {
        delegations: {
          '1': '0xdelegatedAddress1',
          '2': '0xdelegatedAddress2',
        },
        activeChainId: 1,
      } satisfies DelegatedState,
    }

    let getState: jest.Mock

    beforeEach(() => {
      jest.clearAllMocks()
      getState = jest.fn().mockReturnValue(defaultState)
    })

    test.each([
      // Scenario 1: Chain with delegation
      {
        description: 'chain with delegation',
        chainId: 1,
        expectedArgs: {
          chainId: 1,
          address: '0xdelegatedAddress1',
          isActiveChain: true,
        },
      },
      // Scenario 2: Another chain with delegation
      {
        description: 'another chain with delegation',
        chainId: 2,
        expectedArgs: {
          chainId: 2,
          address: '0xdelegatedAddress2',
          isActiveChain: true,
        },
      },
    ])('should trigger callback for $description', ({ chainId, expectedArgs }) => {
      // Setup
      const handler = getHandleOnSetActiveChainId({
        getState,
        onDelegationDetected: mockOnDelegationDetected,
      })

      // Execute
      handler({ action: { payload: { chainId } } as PayloadAction<{ chainId?: number }> })

      // Verify
      expect(mockOnDelegationDetected).toHaveBeenCalledWith(expectedArgs)
    })

    test.each([
      // Scenario 3: Chain without delegation
      {
        description: 'chain without delegation',
        chainId: 3,
      },
      // Scenario 4: Undefined chainId
      {
        description: 'undefined chainId',
        chainId: undefined,
      },
    ])('should not trigger callback for $description', ({ chainId }) => {
      // Setup
      const handler = getHandleOnSetActiveChainId({
        getState,
        onDelegationDetected: mockOnDelegationDetected,
      })

      // Execute
      handler({ action: { payload: { chainId } } as PayloadAction<{ chainId?: number }> })

      // Verify
      expect(mockOnDelegationDetected).not.toHaveBeenCalled()
    })
  })
})
