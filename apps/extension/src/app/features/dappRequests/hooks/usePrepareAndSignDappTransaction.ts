import { TransactionRequest } from '@ethersproject/providers'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { prepareAndSignDappTransactionActions } from 'src/app/features/dappRequests/configuredSagas'
import { useConditionalPreSignDelay } from 'src/app/features/dappRequests/hooks/useConditionalPreSignDelay'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isValidTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { logger } from 'utilities/src/logger/logger'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'

interface UsePrepareAndSignDappTransactionParams {
  /** Dependencies that when changed, cancel ongoing preparations */
  request?: TransactionRequest
  /** The account to use for signing */
  account: Account
  /** The chain ID for the transaction */
  chainId?: UniverseChainId
}

/**
 * Shared hook for the common prepare and sign transaction pattern
 */
export function usePrepareAndSignDappTransaction({
  request,
  account,
  chainId,
}: UsePrepareAndSignDappTransactionParams): {
  preSignedTransaction: SignedTransactionRequest | undefined
} {
  const dispatch = useDispatch()
  const [preSignedTransaction, setPreSignedTransaction] = useState<SignedTransactionRequest | undefined>(undefined)
  const currentPreparationRef = useRef<{ cancel: () => void } | null>(null)

  // Cancel ongoing preparations when dependencies change
  // biome-ignore lint/correctness/useExhaustiveDependencies: chainId and request changes should reset preparation state
  useEffect(() => {
    currentPreparationRef.current?.cancel()
    currentPreparationRef.current = null
    setPreSignedTransaction(undefined)
  }, [chainId, request])

  const prepareAndSignTransaction = useCallback(async (): Promise<void> => {
    if (
      currentPreparationRef.current ||
      !chainId ||
      account.type !== AccountType.SignerMnemonic ||
      !request ||
      !isValidTransactionRequest(request)
    ) {
      return
    }

    // Mark that we're currently preparing
    currentPreparationRef.current = { cancel: () => dispatch(prepareAndSignDappTransactionActions.cancel()) }

    try {
      // Create the promise for preparing and signing
      const preparePromise = new Promise<SignedTransactionRequest>((resolve, reject) => {
        dispatch(
          prepareAndSignDappTransactionActions.trigger({
            request,
            account,
            chainId,
            onSuccess: (result: SignedTransactionRequest) => {
              setPreSignedTransaction(result)
              resolve(result)
            },
            onFailure: (error: Error) => {
              reject(error)
            },
          }),
        )
      })

      await preparePromise
    } catch (error) {
      const prepError = error instanceof Error ? error : new Error('Unknown preparation error')
      logger.error(prepError, {
        tags: { file: 'usePrepareAndSignDappTransaction', function: 'prepareAndSignTransaction' },
        extra: { request },
      })
    } finally {
      // Clean up preparation state
      currentPreparationRef.current = null
    }
  }, [account, chainId, dispatch, request])

  // Automatically prepare and sign transaction when conditions change
  // Apply delay only when a transaction was just confirmed on the same chain
  useConditionalPreSignDelay({
    callback: prepareAndSignTransaction,
    chainId,
  })

  return {
    preSignedTransaction,
  }
}
