import { useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { PrepareSwapCallback, PrepareSwapParams } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { prepareAndSignSwapActions } from 'wallet/src/features/transactions/swap/configuredSagas'
import { PreSignedSwapTransaction } from 'wallet/src/features/transactions/swap/types/preSignedTransaction'

// Constants for validation
const PREPARED_TRANSACTION_STALENESS_MS = 5 * ONE_SECOND_MS // 5 seconds

interface CurrentlySigningTransaction {
  promise: Promise<PreSignedSwapTransaction>
  swapTxContext: ValidatedSwapTxContext
  startedAt: number
}

/**
 * Validates if a signed transaction is still valid for execution
 * Uses the same logic as requireAcceptNewTrade to determine if the trade has changed significantly
 */
function isValidSignedTransaction({
  signedContext,
  currentContext,
  signingStartedAt,
}: {
  signedContext: ValidatedSwapTxContext
  currentContext: ValidatedSwapTxContext
  signingStartedAt: number
}): boolean {
  // Check staleness
  if (Date.now() - signingStartedAt > PREPARED_TRANSACTION_STALENESS_MS) {
    return false
  }

  // Check if context has changed significantly
  // Compare trade routing - if routing changed, invalidate
  if (signedContext.routing !== currentContext.routing) {
    return false
  }

  // Use requireAcceptNewTrade logic to determine if the trade has changed significantly
  // If requireAcceptNewTrade returns true, it means we should discard the old trade and use the new trade
  const shouldAcceptNewTrade = requireAcceptNewTrade(signedContext.trade, currentContext.trade)

  // If we should accept the new trade, the signed transaction is invalid
  return !shouldAcceptNewTrade
}

export interface UseSwapSigningResult {
  prepareAndSign: PrepareSwapCallback
  getValidSignedTransaction: (swapTxContext: ValidatedSwapTxContext) => Promise<PreSignedSwapTransaction | undefined>
  clearSigningState: () => void
  markExecutionCalled: () => void
}

/**
 * Hook that manages the signing state and pre-signed transaction caching for swaps
 */
export function useSwapSigning(): UseSwapSigningResult {
  const dispatch = useDispatch()
  const account = useWallet().evmAccount

  const lastSignedTransactionRef = useRef<PreSignedSwapTransaction | null>(null)
  const currentlySigningRef = useRef<CurrentlySigningTransaction | null>(null)
  const executionCalledRef = useRef<boolean>(false)

  const prepareAndSign: PrepareSwapCallback = useCallback(
    async (params: PrepareSwapParams): Promise<void> => {
      // If execution has already been called, ignore new prepare requests
      if (executionCalledRef.current) {
        return
      }

      if (!account || !isSignerMnemonicAccountDetails(account)) {
        throw new Error('Account must support signing for transaction preparation')
      }

      const accountMeta: AccountMeta = { ...account, type: account.accountType }

      // Create the promise for preparing and signing
      const preparePromise = new Promise<PreSignedSwapTransaction>((resolve, reject) => {
        dispatch(
          prepareAndSignSwapActions.trigger({
            ...params,
            account: accountMeta,
            onSuccess: (result: PreSignedSwapTransaction) => resolve(result),
            onFailure: (error: Error) => reject(error),
          }),
        )
      })

      // Store the current signing operation
      const currentSigning: CurrentlySigningTransaction = {
        promise: preparePromise,
        swapTxContext: params.swapTxContext,
        startedAt: Date.now(),
      }
      currentlySigningRef.current = currentSigning

      // Wait for the promise to complete
      try {
        const preSignedTransaction = await preparePromise

        lastSignedTransactionRef.current = preSignedTransaction

        if (currentlySigningRef.current === currentSigning) {
          currentlySigningRef.current = null
        }
      } catch (error) {
        // If preparation fails, clear the current signing operation if this is still the current one
        if (currentlySigningRef.current === currentSigning) {
          currentlySigningRef.current = null
        }
        // Don't throw if the error is due to cancellation
        if (error instanceof Error && error.message !== 'Action was cancelled.') {
          throw error
        }
      }
    },
    [dispatch, account],
  )

  const getValidSignedTransaction = useCallback(
    async (swapTxContext: ValidatedSwapTxContext): Promise<PreSignedSwapTransaction | undefined> => {
      // Strategy: Try to use last signed transaction first, then fall back to currently signing
      const lastSigned = lastSignedTransactionRef.current
      if (
        lastSigned &&
        isValidSignedTransaction({
          signedContext: lastSigned.swapTxContext,
          currentContext: swapTxContext,
          signingStartedAt: lastSigned.metadata.timestampAfterSign,
        })
      ) {
        // Use the last signed transaction immediately if it's still valid
        return lastSigned
      }

      // No valid last signed transaction, check if we have something currently signing and it's still valid
      const currentlySigning = currentlySigningRef.current
      if (
        currentlySigning &&
        isValidSignedTransaction({
          signedContext: currentlySigning.swapTxContext,
          currentContext: swapTxContext,
          signingStartedAt: currentlySigning.startedAt,
        })
      ) {
        try {
          // Wait for the currently signing transaction to complete
          return await currentlySigning.promise
        } catch (_error) {
          // Signing failed or was cancelled
          return undefined
        }
      }

      return undefined
    },
    [],
  )

  const clearSigningState = useCallback(() => {
    // Cancel any pending signing operations and clear the caches
    dispatch(prepareAndSignSwapActions.cancel())
    lastSignedTransactionRef.current = null
    currentlySigningRef.current = null
  }, [dispatch])

  const markExecutionCalled = useCallback(() => {
    executionCalledRef.current = true
  }, [])

  return {
    prepareAndSign,
    getValidSignedTransaction,
    clearSigningState,
    markExecutionCalled,
  }
}
