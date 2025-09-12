import { act, renderHook } from '@testing-library/react'
import { useDispatch } from 'react-redux'
import { prepareAndSignDappTransactionActions } from 'src/app/features/dappRequests/configuredSagas'
import { useConditionalPreSignDelay } from 'src/app/features/dappRequests/hooks/useConditionalPreSignDelay'
import { usePrepareAndSignDappTransaction } from 'src/app/features/dappRequests/hooks/usePrepareAndSignDappTransaction'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  isValidTransactionRequest,
  ValidatedTransactionRequest,
} from 'uniswap/src/features/transactions/types/transactionRequests'
import { logger } from 'utilities/src/logger/logger'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'

// Mock dependencies
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}))

jest.mock('src/app/features/dappRequests/hooks/useConditionalPreSignDelay', () => ({
  useConditionalPreSignDelay: jest.fn(),
}))

jest.mock('src/app/features/dappRequests/configuredSagas', () => ({
  prepareAndSignDappTransactionActions: {
    trigger: jest.fn((payload) => ({ type: 'test/trigger', payload })),
    cancel: jest.fn(() => ({ type: 'test/cancel' })),
  },
}))

jest.mock('uniswap/src/features/transactions/types/transactionRequests', () => ({
  isValidTransactionRequest: jest.fn(),
}))

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

// Typed mocks
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>
const mockUseConditionalPreSignDelay = useConditionalPreSignDelay as jest.MockedFunction<
  typeof useConditionalPreSignDelay
>
const mockIsValidTransactionRequest = isValidTransactionRequest as jest.MockedFunction<typeof isValidTransactionRequest>
const mockLogger = logger as jest.Mocked<typeof logger>

describe('usePrepareAndSignDappTransaction', () => {
  const mockDispatch = jest.fn()

  const mockAccount: SignerMnemonicAccount = {
    type: AccountType.SignerMnemonic,
    address: '0x1234567890123456789012345678901234567890',
    derivationIndex: 0,
    mnemonicId: 'test-mnemonic-id',
    timeImportedMs: 0,
    pushNotificationsEnabled: false,
  }

  const mockChainId = UniverseChainId.Mainnet

  const mockRequest: ValidatedTransactionRequest = {
    to: '0xabcdef1234567890123456789012345678901234',
    value: '1000000000000000000', // 1 ETH
    data: '0x',
    chainId: mockChainId,
  }

  const mockSignedTransaction: SignedTransactionRequest = {
    request: mockRequest,
    signedRequest: '0xsignedtransaction',
    timestampBeforeSign: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseDispatch.mockReturnValue(mockDispatch)
    mockIsValidTransactionRequest.mockReturnValue(true)

    // Default mock for useConditionalPreSignDelay - captures the callback for manual execution
    let capturedCallback: (() => void) | undefined
    mockUseConditionalPreSignDelay.mockImplementation(({ callback }) => {
      capturedCallback = callback
      // Expose callback for test control
      ;(mockUseConditionalPreSignDelay as any)._capturedCallback = capturedCallback
    })
  })

  describe('initial state', () => {
    it('should return undefined preSignedTransaction initially', () => {
      const { result } = renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      expect(result.current.preSignedTransaction).toBeUndefined()
    })

    it('should set up useConditionalPreSignDelay with correct params', () => {
      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      expect(mockUseConditionalPreSignDelay).toHaveBeenCalledWith({
        callback: expect.any(Function),
        chainId: mockChainId,
      })
    })
  })

  describe('dependency changes', () => {
    it('should reset preSignedTransaction when chainId changes', () => {
      const { result, rerender } = renderHook((props) => usePrepareAndSignDappTransaction(props), {
        initialProps: {
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        },
      })

      // Simulate having a pre-signed transaction
      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'test/trigger' && action.payload?.onSuccess) {
          action.payload.onSuccess(mockSignedTransaction)
        }
      })

      // Trigger preparation
      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      act(() => {
        callback?.()
      })

      expect(result.current.preSignedTransaction).toBe(mockSignedTransaction)

      // Change chainId
      rerender({
        request: mockRequest,
        account: mockAccount,
        chainId: UniverseChainId.Polygon,
      })

      expect(result.current.preSignedTransaction).toBeUndefined()
    })

    it('should reset preSignedTransaction when request changes', () => {
      const { result, rerender } = renderHook((props) => usePrepareAndSignDappTransaction(props), {
        initialProps: {
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        },
      })

      // Simulate having a pre-signed transaction
      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'test/trigger' && action.payload?.onSuccess) {
          action.payload.onSuccess(mockSignedTransaction)
        }
      })

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      act(() => {
        callback?.()
      })

      expect(result.current.preSignedTransaction).toBe(mockSignedTransaction)

      // Change request
      const newRequest = { ...mockRequest, value: '2000000000000000000' }
      rerender({
        request: newRequest,
        account: mockAccount,
        chainId: mockChainId,
      })

      expect(result.current.preSignedTransaction).toBeUndefined()
    })

    it('should call cancel on ongoing preparation when dependencies change', () => {
      const { rerender } = renderHook((props) => usePrepareAndSignDappTransaction(props), {
        initialProps: {
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        },
      })

      // Start a preparation
      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      callback?.()

      expect(mockDispatch).toHaveBeenCalledWith(prepareAndSignDappTransactionActions.trigger(expect.any(Object)))

      // Change chainId to trigger cancellation
      rerender({
        request: mockRequest,
        account: mockAccount,
        chainId: UniverseChainId.Polygon,
      })

      expect(mockDispatch).toHaveBeenCalledWith(prepareAndSignDappTransactionActions.cancel())
    })
  })

  describe('prepareAndSignTransaction function', () => {
    it('should not prepare when preparation is already in progress', () => {
      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback

      // Start first preparation
      callback?.()
      expect(mockDispatch).toHaveBeenCalledTimes(1)

      // Try to start second preparation while first is in progress
      callback?.()
      expect(mockDispatch).toHaveBeenCalledTimes(1) // Should still be 1
    })

    it('should not prepare when chainId is missing', () => {
      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: undefined,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      callback?.()

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should not prepare when account is not SignerMnemonic type', () => {
      const readOnlyAccount: Account = {
        ...mockAccount,
        type: AccountType.Readonly,
      }

      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: readOnlyAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      callback?.()

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should not prepare when request is missing', () => {
      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: undefined,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      callback?.()

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should not prepare when request is invalid', () => {
      mockIsValidTransactionRequest.mockReturnValue(false)

      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      callback?.()

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should dispatch prepare action with correct parameters when conditions are met', () => {
      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      callback?.()

      expect(mockDispatch).toHaveBeenCalledWith(
        prepareAndSignDappTransactionActions.trigger({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
          onSuccess: expect.any(Function),
          onFailure: expect.any(Function),
        }),
      )
    })

    it('should set preSignedTransaction when preparation succeeds', () => {
      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'test/trigger' && action.payload?.onSuccess) {
          action.payload.onSuccess(mockSignedTransaction)
        }
      })

      const { result } = renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      act(() => {
        callback?.()
      })

      expect(result.current.preSignedTransaction).toBe(mockSignedTransaction)
    })

    it('should handle preparation failure and log error', async () => {
      const mockError = new Error('Preparation failed')

      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'test/trigger' && action.payload?.onFailure) {
          // Simulate async failure
          setTimeout(() => action.payload.onFailure(mockError), 0)
        }
      })

      const { result } = renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      callback?.()

      // Wait for async error handling
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(result.current.preSignedTransaction).toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalledWith(mockError, {
        tags: { file: 'usePrepareAndSignDappTransaction', function: 'prepareAndSignTransaction' },
        extra: { request: mockRequest },
      })
    })

    it('should handle non-Error failures and create proper Error object', async () => {
      const mockNonError = 'String error'

      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'test/trigger' && action.payload?.onFailure) {
          setTimeout(() => action.payload.onFailure(mockNonError), 0)
        }
      })

      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback
      callback?.()

      // Wait for async error handling
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unknown preparation error',
        }),
        {
          tags: { file: 'usePrepareAndSignDappTransaction', function: 'prepareAndSignTransaction' },
          extra: { request: mockRequest },
        },
      )
    })

    it('should clean up preparation state after completion', async () => {
      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'test/trigger' && action.payload?.onSuccess) {
          action.payload.onSuccess(mockSignedTransaction)
        }
      })

      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback

      // First preparation should work
      callback?.()
      expect(mockDispatch).toHaveBeenCalledTimes(1)

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Second preparation should also work (not blocked by previous state)
      callback?.()
      expect(mockDispatch).toHaveBeenCalledTimes(2)
    })

    it('should clean up preparation state after error', async () => {
      const mockError = new Error('Preparation failed')

      mockDispatch.mockImplementation((action: any) => {
        if (action.type === 'test/trigger' && action.payload?.onFailure) {
          setTimeout(() => action.payload.onFailure(mockError), 0)
        }
      })

      renderHook(() =>
        usePrepareAndSignDappTransaction({
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        }),
      )

      const callback = (mockUseConditionalPreSignDelay as any)._capturedCallback

      // First preparation should work
      callback?.()
      expect(mockDispatch).toHaveBeenCalledTimes(1)

      // Wait for error handling and cleanup
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Second preparation should also work (not blocked by previous state)
      callback?.()
      expect(mockDispatch).toHaveBeenCalledTimes(2)
    })
  })

  describe('useConditionalPreSignDelay integration', () => {
    it('should update useConditionalPreSignDelay when chainId changes', () => {
      const { rerender } = renderHook((props) => usePrepareAndSignDappTransaction(props), {
        initialProps: {
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        },
      })

      expect(mockUseConditionalPreSignDelay).toHaveBeenCalledWith({
        callback: expect.any(Function),
        chainId: mockChainId,
      })

      const newChainId = UniverseChainId.Polygon
      rerender({
        request: mockRequest,
        account: mockAccount,
        chainId: newChainId,
      })

      expect(mockUseConditionalPreSignDelay).toHaveBeenLastCalledWith({
        callback: expect.any(Function),
        chainId: newChainId,
      })
    })

    it('should pass the same callback function across re-renders when dependencies do not change', () => {
      const { rerender } = renderHook((props) => usePrepareAndSignDappTransaction(props), {
        initialProps: {
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        },
      })

      const firstCallback = mockUseConditionalPreSignDelay.mock.calls[0]![0].callback

      // Re-render with same props
      rerender({
        request: mockRequest,
        account: mockAccount,
        chainId: mockChainId,
      })

      const secondCallback = mockUseConditionalPreSignDelay.mock.calls[1]![0].callback

      expect(firstCallback).toBe(secondCallback)
    })

    it('should create new callback function when dependencies change', () => {
      const { rerender } = renderHook((props) => usePrepareAndSignDappTransaction(props), {
        initialProps: {
          request: mockRequest,
          account: mockAccount,
          chainId: mockChainId,
        },
      })

      const firstCallback = mockUseConditionalPreSignDelay.mock.calls[0]![0].callback

      // Re-render with different account
      const newAccount = { ...mockAccount, address: '0x9876543210987654321098765432109876543210' }
      rerender({
        request: mockRequest,
        account: newAccount,
        chainId: mockChainId,
      })

      const secondCallback = mockUseConditionalPreSignDelay.mock.calls[1]![0].callback

      expect(firstCallback).not.toBe(secondCallback)
    })
  })
})
