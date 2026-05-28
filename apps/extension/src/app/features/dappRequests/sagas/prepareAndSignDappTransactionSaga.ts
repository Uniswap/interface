import type { PrepareAndSignDappTransactionParams } from 'src/app/features/dappRequests/types/preSignedDappTransaction'
import { call } from 'typed-redux-saga'
import {
  handleTransactionPreparationError,
  prepareTransactionServices,
  signSingleTransaction,
} from 'wallet/src/features/transactions/shared/baseTransactionPreparationSaga'
import {
  DelegationType,
  type TransactionSagaDependencies,
} from 'wallet/src/features/transactions/types/transactionSagaDependencies'

/**
 * Factory function that creates a prepare and sign dapp transaction saga with injected dependencies
 */
export function createPrepareAndSignDappTransactionSaga(dependencies: TransactionSagaDependencies) {
  return function* prepareAndSignDappTransaction(params: PrepareAndSignDappTransactionParams) {
    const { account, chainId, onSuccess, onFailure, request } = params

    try {
      // Use shared service preparation utility
      const { transactionService, calculatedNonce } = yield* call(prepareTransactionServices, dependencies, {
        account,
        chainId,
        submitViaPrivateRpc: false,
        delegationType: DelegationType.Auto,
        request,
      })

      // Use shared transaction signing utility
      const signingResult = yield* call(signSingleTransaction, transactionService, {
        chainId,
        account,
        request,
        nonce: calculatedNonce?.nonce,
        submitViaPrivateRpc: false,
      })

      // Call success callback if provided
      onSuccess?.(signingResult.signedTransaction)

      return signingResult.signedTransaction
    } catch (error) {
      // Handle error using shared error handling utility
      const formattedError = handleTransactionPreparationError(dependencies, {
        error,
        chainId,
        errorConfig: {
          sagaName: 'prepareAndSignDappTransactionSaga',
          functionName: 'prepareAndSignDappTransaction',
        },
        onFailure,
      })

      // Re-throw the formatted error to maintain saga error propagation
      throw formattedError
    }
  }
}
