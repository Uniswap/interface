import { call, select } from 'typed-redux-saga'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { getStatsigClient } from 'uniswap/src/features/gating/sdk/statsig'
import { PrepareSwapParams } from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isBridge, isClassic, isUniswapX, isWrap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { PrepareTransactionParams } from 'wallet/src/features/transactions/executeTransaction/services/TransactionService/transactionService'
import { createTransactionServices } from 'wallet/src/features/transactions/swap/factories/createTransactionServices'
import {
  PreSignedSwapTransaction,
  SignedTransactionRequest,
} from 'wallet/src/features/transactions/swap/types/preSignedTransaction'
import { SwapSagaDependencies } from 'wallet/src/features/transactions/swap/types/swapSagaDependencies'
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
export function createPrepareAndSignSwapSaga(dependencies: SwapSagaDependencies) {
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

    const { transactionSigner, transactionService } = yield* call(createTransactionServices, dependencies, {
      account,
      chainId,
      submitViaPrivateRpc,
      includesDelegation,
    })

    try {
      // Calculate nonce using TransactionService
      const calculatedNonce = yield* call(transactionService.getNextNonce, {
        account,
        chainId,
        submitViaPrivateRpc,
      })

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
        const prepareTransactionParams: PrepareTransactionParams = {
          chainId,
          account,
          request: { ...swapTxContext.approveTxRequest, nonce: getCurrentNonce() },
          submitViaPrivateRpc,
        }
        signedApproveTx = yield* call(transactionService.prepareAndSignTransaction, prepareTransactionParams)
        nonceIncrement = nonceIncrement + 1
      }

      // Permit transaction preparation (smart account mismatch case)
      if (isClassic(swapTxContext) && swapTxContext.permit?.method === PermitMethod.Transaction) {
        const prepareTransactionParams: PrepareTransactionParams = {
          chainId,
          account,
          request: { ...swapTxContext.permit.txRequest, nonce: getCurrentNonce() },
          submitViaPrivateRpc,
        }
        signedPermitTx = yield* call(transactionService.prepareAndSignTransaction, prepareTransactionParams)
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
        const prepareTransactionParams: PrepareTransactionParams = {
          chainId,
          account,
          request: { ...swapTxContext.txRequests?.[0], nonce: getCurrentNonce() },
          submitViaPrivateRpc,
        }

        const signedSwapTx = yield* call(transactionService.prepareAndSignTransaction, prepareTransactionParams)

        preSignedSwapTx = {
          signedApproveTx,
          signedPermitTx,
          signedSwapTx,
          swapTxContext,
          metadata: {
            timestampBeforeSign,
            timestampAfterSign: Date.now(),
            submitViaPrivateRpc,
          },
          chainId,
          account,
        }
      } else {
        throw new Error('Unsupported routing type for transaction preparation')
      }

      onSuccess?.(preSignedSwapTx)
      return preSignedSwapTx
    } catch (error) {
      const errorMessage = `Failed to prepare and sign transaction: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`

      dependencies.logger.error(error, {
        tags: { file: 'prepareAndSignSwapSaga', function: 'prepareAndSignSwapTransaction' },
        extra: { chainId },
      })

      onFailure?.(new Error(errorMessage))
      throw new Error(errorMessage, { cause: error })
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
