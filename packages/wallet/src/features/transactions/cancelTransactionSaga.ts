/* oxlint-disable typescript/explicit-function-return-type */
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { providers } from 'ethers'
import { call, put, select } from 'typed-redux-saga'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  CancelRevertStatus,
  toCancelRevertStatus,
} from 'uniswap/src/features/transactions/cancel/orderCancelCaseReducers'
import {
  cancelRemoteUniswapXOrder,
  orderCancelBroadcasted,
  orderCancelFailed,
} from 'uniswap/src/features/transactions/slice'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import {
  ExecuteTransactionParams,
  executeTransaction,
} from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import { selectAccounts } from 'wallet/src/features/wallet/selectors'

type CancelRemoteUniswapXOrderAction = ReturnType<typeof cancelRemoteUniswapXOrder>
type SubmitPermit2CancelTransactionParams = CancelRemoteUniswapXOrderAction['payload'] & {
  /**
   * Present when the cancelled order exists in local state: enables durable cancel tracking
   * (broadcast/failure CAS writes keyed by the order's id).
   */
  localOrder?: {
    id: string
    revertToStatus: CancelRevertStatus
  }
}

// Note, transaction cancellation on Ethereum is inherently flaky
// The best we can do is replace the transaction and hope the original isn't mined first
// Inspiration: https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/controllers/transactions/index.js#L744
export function* attemptCancelTransaction(
  transaction: TransactionDetails,
  cancelRequest: providers.TransactionRequest,
) {
  if (isClassic(transaction) || isBridge(transaction)) {
    yield* call(attemptReplaceTransaction, { transaction, newTxRequest: cancelRequest, isCancellation: true })
  } else if (isUniswapX(transaction)) {
    yield* call(cancelOrder, transaction, cancelRequest)
  }
}

function* cancelOrder(order: UniswapXOrderDetails, cancelRequest: providers.TransactionRequest) {
  // `order` is the watcher's pre-cancel snapshot, so its status is the status to restore on failure
  yield* call(submitPermit2CancelTransaction, {
    chainId: order.chainId,
    address: order.from,
    orderHash: order.orderHash ?? '',
    cancelRequest,
    localOrder: { id: order.id, revertToStatus: toCancelRevertStatus(order.status) },
  })
}

function isUserRejectedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  const code = (error as { code?: unknown }).code
  return code === 4001 || code === 'ACTION_REJECTED'
}

/**
 * Submits a Permit2 nonce invalidation transaction to cancel a UniswapX order.
 * Used by both the local order cancel flow (via cancelOrder) and the remote order cancel flow
 * (via cancelRemoteUniswapXOrder action) for orders that only exist in the GraphQL activity feed.
 *
 * Never throws into the transaction watcher root — a failed cancel must not kill the watcher.
 */
function* submitPermit2CancelTransaction(params: SubmitPermit2CancelTransactionParams) {
  const { chainId, address, orderHash, cancelRequest, localOrder } = params

  if (!orderHash) {
    return
  }

  try {
    const accounts = yield* select(selectAccounts)
    const checksummedAddress = getValidAddress({
      address,
      chainId,
      withEVMChecksum: true,
      log: false,
    })
    if (!checksummedAddress) {
      throw new Error(`Cannot cancel order, address is invalid: ${checksummedAddress}`)
    }
    const account = accounts[checksummedAddress]
    if (!account || account.type !== AccountType.SignerMnemonic) {
      throw new Error(`Cannot cancel order, account missing: ${orderHash}`)
    }

    const isCancelTrackingEnabled = getFeatureFlag(FeatureFlags.LimitCancelTimeout)

    const executeTransactionParams: ExecuteTransactionParams = {
      chainId,
      account,
      options: {
        request: cancelRequest,
      },
      transactionOriginType: TransactionOriginType.Internal,
      // Register the cancel as a tracked (plain-hash) tx so the classic pipeline finalizes it as
      // `Canceled` and the finalization listener can flip the order; display suppresses it by type.
      ...(isCancelTrackingEnabled
        ? {
            typeInfo: { type: TransactionType.UniswapXCancel, orderHashes: [orderHash] },
            initialStatus: TransactionStatus.Cancelling,
          }
        : {}),
    }

    // UniswapX Orders are cancelled via submitting a transaction to invalidate the nonce of the permit2 signature used to fill the order.
    // If the permit2 tx is mined before a filler attempts to fill the order, the order is prevented; the cancellation is successful.
    // If the permit2 tx is mined after a filler successfully fills the order, the tx will succeed but have no effect; the cancellation is unsuccessful.
    const { transactionHash } = yield* call(executeTransaction, executeTransactionParams)

    if (isCancelTrackingEnabled) {
      // Sizes the "reached the wallet stack" cohort against web's pathA-converged/revert routes
      sendAnalyticsEvent(InterfaceEventName.LimitCancelBroadcast, {
        order_hash: orderHash,
        chain_id: chainId,
        route: 'wallet-shared',
      })
    }

    if (localOrder) {
      // On this stack the hash resolves at sign-and-detach time, not confirmed broadcast; a
      // post-hash broadcast failure is corrected by the finalization listener.
      yield* put(
        orderCancelBroadcasted({
          address,
          chainId,
          id: localOrder.id,
          cancelTxHash: transactionHash,
          broadcastTimeMs: Date.now(),
        }),
      )
    }
  } catch (error) {
    const rejected = isUserRejectedError(error)
    // Ungated on purpose (matches web): measures the ungated rejection/failure classification fix
    sendAnalyticsEvent(InterfaceEventName.LimitCancelBroadcastFailed, {
      order_hash: orderHash,
      chain_id: chainId,
      reason: rejected ? 'rejection' : 'failure',
      route: 'wallet-shared',
    })
    if (localOrder) {
      yield* put(
        orderCancelFailed({
          address,
          chainId,
          id: localOrder.id,
          reason: rejected ? 'rejected' : 'broadcast-failed',
          revertToStatus: localOrder.revertToStatus,
        }),
      )
      if (rejected) {
        // Quiet revert — a rejection is not an error
        return
      }
    }
    logger.error(error, {
      tags: { file: 'cancelTransactionSaga', function: 'submitPermit2CancelTransaction' },
      extra: { orderHash },
    })
  }
}

/**
 * Saga handler for cancelling UniswapX orders that only exist in the remote activity feed
 * (not in local Redux state). This bypasses the cancelTransaction reducer + watcher pipeline
 * and directly submits the Permit2 nonce invalidation transaction.
 */
export function* attemptCancelRemoteUniswapXOrder({ payload }: CancelRemoteUniswapXOrderAction) {
  yield* call(submitPermit2CancelTransaction, payload)
}
