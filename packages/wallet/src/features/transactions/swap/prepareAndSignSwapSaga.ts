import { call, select } from 'typed-redux-saga'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { getStatsigClient } from 'uniswap/src/features/gating/sdk/statsig'
import { PrepareSwapParams } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isBridge, isClassic, isUniswapX, isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import {
  handleTransactionPreparationError,
  prepareTransactionServices,
  signSingleTransaction,
} from 'wallet/src/features/transactions/shared/baseTransactionPreparationSaga'
import { PreSignedSwapTransaction } from 'wallet/src/features/transactions/swap/types/preSignedTransaction'
import { TransactionSagaDependencies } from 'wallet/src/features/transactions/types/transactionSagaDependencies'
import { selectWalletSwapProtectionSetting } from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

export type PrepareAndSignSwapSagaParams = PrepareSwapParams & {
  account: SignerMnemonicAccountMeta
  onSuccess?: (result: PreSignedSwapTransaction) => void
  onFailure?: (error: Error) => void
}

/**
 * Factory function that creates a prepare and sign swap saga with injected dependencies
 */
export function createPrepareAndSignSwapSaga(dependencies: TransactionSagaDependencies) {
  /**
   * Core business logic for preparing and signing swap transactions
   * Handles all transaction types required for swap: approval, permit, UniswapX, classic, bridge, and wrap
   */
  return function* prepareAndSignSwapTransaction(params: PrepareAndSignSwapSagaParams) {
    const { swapTxContext, account, onSuccess, onFailure } = params
    const chainId = swapTxContext.trade.inputAmount.currency.chainId

    // MEV protection is not needed for UniswapX approval and/or wrap transactions.
    // We disable for bridge to avoid any potential issues with BE checking status.
    const submitViaPrivateRpc = isClassic(swapTxContext) && (yield* call(shouldSubmitViaPrivateRpc, chainId))
    const includesDelegation = swapTxContext.includesDelegation ?? false

    try {
      // Use shared service preparation utility
      const { transactionService, transactionSigner, calculatedNonce } = yield* call(
        prepareTransactionServices,
        dependencies,
        {
          account,
          chainId,
          submitViaPrivateRpc,
          includesDelegation,
        },
      )

      const timestampBeforeSign = Date.now()

      let nonceIncrement = 0
      const getCurrentNonce = () => {
        if (calculatedNonce) {
          return calculatedNonce.nonce + nonceIncrement
        }

        return undefined
      }

      let signedApproveTx: SignedTransactionRequest | undefined
      let signedPermitTx: SignedTransactionRequest | undefined

      // Approval transaction preparation (if needed)
      if (swapTxContext.approveTxRequest) {
        const approvalResult = yield* signSingleTransaction(transactionService, {
          chainId,
          account,
          request: swapTxContext.approveTxRequest,
          nonce: getCurrentNonce(),
          submitViaPrivateRpc,
        })
        signedApproveTx = approvalResult.signedTransaction
        nonceIncrement = nonceIncrement + 1
      }

      // Permit transaction preparation (smart account mismatch case)
      if (isClassic(swapTxContext) && swapTxContext.permit?.method === PermitMethod.Transaction) {
        const permitResult = yield* signSingleTransaction(transactionService, {
          chainId,
          account,
          request: swapTxContext.permit.txRequest,
          nonce: getCurrentNonce(),
          submitViaPrivateRpc,
        })
        signedPermitTx = permitResult.signedTransaction
        nonceIncrement = nonceIncrement + 1
      }

      let preSignedSwapTx: PreSignedSwapTransaction
      // Main transaction preparation based on routing type
      if (isUniswapX(swapTxContext)) {
        // UniswapX - Sign typed data for order
        const { permit } = swapTxContext

        const signedTypedData = yield* call(transactionSigner.signTypedData, {
          domain: permit.typedData.domain,
          types: permit.typedData.types,
          value: permit.typedData.values,
        })

        const signedSwapPermit = {
          permit: permit.typedData,
          signedData: signedTypedData,
        }

        preSignedSwapTx = {
          signedApproveTx,
          signedPermitTx,
          signedSwapPermit,
          swapTxContext,
          metadata: {
            timestampBeforeSign,
            timestampAfterSign: Date.now(),
            submitViaPrivateRpc,
          },
          chainId,
          account,
        }
      } else if (isClassic(swapTxContext) || isBridge(swapTxContext) || isWrap(swapTxContext)) {
        // Classic, Bridge, and Wrap transactions - All use regular transaction preparation
        const txRequest = swapTxContext.txRequests?.[0]
        if (!txRequest) {
          throw new Error('Transaction request is required for swap execution')
        }
        const swapResult = yield* signSingleTransaction(transactionService, {
          chainId,
          account,
          request: txRequest,
          nonce: getCurrentNonce(),
          submitViaPrivateRpc,
        })

        preSignedSwapTx = {
          signedApproveTx,
          signedPermitTx,
          signedSwapTx: swapResult.signedTransaction,
          swapTxContext,
          metadata: swapResult.metadata,
          chainId,
          account,
        }
      } else {
        throw new Error('Unsupported routing type for transaction preparation')
      }

      onSuccess?.(preSignedSwapTx)
      return preSignedSwapTx
    } catch (error) {
      const formattedError = handleTransactionPreparationError(dependencies, {
        error,
        chainId,
        errorConfig: {
          sagaName: 'prepareAndSignSwapSaga',
          functionName: 'prepareAndSignSwapTransaction',
        },
        onFailure,
      })
      throw formattedError
    }
  }
}

export function* shouldSubmitViaPrivateRpc(chainId: number) {
  const swapProtectionSetting = yield* select(selectWalletSwapProtectionSetting)
  const swapProtectionOn = swapProtectionSetting === SwapProtectionSetting.On
  const privateRpcFeatureEnabled = getStatsigClient().checkGate(getFeatureFlagName(FeatureFlags.PrivateRpc))
  const privateRpcSupportedOnChain = chainId ? isPrivateRpcSupportedOnChain(chainId) : false
  return Boolean(swapProtectionOn && privateRpcSupportedOnChain && privateRpcFeatureEnabled)
}
