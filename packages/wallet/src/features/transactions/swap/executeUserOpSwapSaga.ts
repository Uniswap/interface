import { call, put } from 'typed-redux-saga'
import { AccountType } from 'uniswap/src/features/accounts/types'
import type { CAIP25Session } from 'uniswap/src/features/capabilities/caip25/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import type { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isUserOpSwap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { tradeToTransactionInfo } from 'uniswap/src/features/transactions/swap/utils/trade'
import { TransactionOriginType, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import {
  ExecuteUserOpParams,
  executeUserOpSaga,
} from 'wallet/src/features/transactions/executeTransaction/executeUserOpSaga'
import type { TransactionSagaDependencies } from 'wallet/src/features/transactions/types/transactionSagaDependencies'

export type UserOpSwapParams = {
  txId?: string
  address: string
  analytics: SwapTradeBaseProperties
  swapTxContext: ValidatedSwapTxContext
  caip25Info: CAIP25Session | undefined
} & SwapExecutionCallbacks

/* Factory that creates the wallet-initiated user op swap execution saga. */
export function createExecuteUserOpSwapSaga(dependencies: TransactionSagaDependencies) {
  return function* executeUserOpSwap(params: UserOpSwapParams) {
    const { address, txId, swapTxContext, analytics, onSuccess, onFailure } = params

    try {
      if (!isUserOpSwap(swapTxContext)) {
        throw new Error(`executeUserOpSwapSaga requires swapTxContext.unsignedUserOperation`)
      }
      const { unsignedUserOperation, paymasterService, trade, requestUniswapGasSponsorship } = swapTxContext

      const account = { address, type: AccountType.SignerMnemonic } as const
      const chainId = trade.inputAmount.currency.chainId
      const transactionId = txId ?? createTransactionId()

      const typeInfo = tradeToTransactionInfo({
        trade,
        transactedUSDValue: analytics.token_in_amount_usd,
        gasEstimate: swapTxContext.gasFeeEstimation.swapEstimate,
        swapStartTimestamp: analytics.swap_start_timestamp,
        isFinalStep: analytics.is_final_step,
      })

      // Surface the pending state before submission so the user sees an immediate
      // toast — paymaster + signing + bundler submission all happen below and may
      // each fail, so we treat the notification as "this swap is in flight."
      yield* put(
        pushNotification({
          type: AppNotificationType.TransactionPending,
          chainId,
        }),
      )

      const executeUserOpParams: ExecuteUserOpParams = {
        userOp: unsignedUserOperation,
        account,
        chainId,
        typeInfo,
        requestUniswapGasSponsorship,
        paymasterServiceContext: paymasterService?.context,
      }
      const { userOpHash } = yield* call(executeUserOpSaga, executeUserOpParams)

      yield* put(
        addTransaction({
          routing: trade.routing,
          id: transactionId,
          chainId,
          typeInfo,
          from: account.address,
          addedTime: Date.now(),
          status: TransactionStatus.Pending,
          userOpHash,
          options: { request: {} },
          transactionOriginType: TransactionOriginType.Internal,
        }),
      )

      yield* call(onSuccess)
    } catch (error) {
      dependencies.logger.error(error, {
        tags: { file: 'executeUserOpSwapSaga', function: 'executeUserOpSwap' },
        extra: { analytics: params.analytics },
      })
      yield* call(onFailure)
    }
  }
}
