import type { TransactionRequest } from '@ethersproject/abstract-provider'
import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { call, take } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CancelRevertStatus } from 'uniswap/src/features/transactions/cancel/orderCancelCaseReducers'
import {
  addTransaction,
  cancelTransaction,
  orderCancelBroadcasted,
  orderCancelFailed,
  TransactionsState,
} from 'uniswap/src/features/transactions/slice'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  InterfaceTransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import store from '~/state'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { getSigner } from '~/state/sagas/transactions/utils'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

interface CancelOrderPayload {
  chainId: UniverseChainId
  id: string
  address: string
  cancelRequest: TransactionRequest
  cancelInitiatedTimeMs?: number
  revertToStatus?: CancelRevertStatus
}

/**
 * Saga that watches for `cancelTransaction` Redux actions on web and submits the
 * cancellation transaction on-chain.
 *
 * For UniswapX orders, this submits a permit2 nonce invalidation transaction.
 * For classic/bridge transactions, this submits a replacement transaction.
 *
 * This is the web equivalent of the mobile `cancelTransactionSaga` in
 * `packages/wallet/src/features/transactions/cancelTransactionSaga.ts`.
 */
export function* cancelOrderSaga() {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof cancelTransaction>>(cancelTransaction.type)
    yield* call(handleCancelOrder, payload)
  }
}

function getOrderFromState({ address, chainId, id }: { address: string; chainId: UniverseChainId; id: string }) {
  const transaction = (store.getState() as { transactions: TransactionsState }).transactions[address]?.[chainId]?.[id]
  return transaction && isUniswapX(transaction) ? transaction : undefined
}

/** Registers the broadcast cancel tx as a tracked, plain-hash Pending tx so the web poller finalizes it. */
function registerTrackedCancelTx({
  payload,
  hash,
  orderHash,
}: {
  payload: CancelOrderPayload
  hash: string
  orderHash: string
}): void {
  const { chainId, address, cancelRequest } = payload
  const trackedCancelTx: InterfaceTransactionDetails = {
    id: hash,
    hash,
    chainId,
    from: address,
    routing: TradingApi.Routing.CLASSIC,
    // Pending (not Cancelling) — a Cancelling row would be invisible to the web tx poller;
    // the updater remaps its Success receipt to Canceled. Plain hash tx: never batchInfo.
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: { type: TransactionType.UniswapXCancel, orderHashes: [orderHash] },
    options: { request: cancelRequest },
  }
  store.dispatch(addTransaction(trackedCancelTx))
}

export async function handleCancelOrder(payload: CancelOrderPayload): Promise<void> {
  const { cancelRequest, address, chainId, id } = payload
  const order = getOrderFromState({ address, chainId, id })

  try {
    const signer = await getSigner(address)

    logger.debug('cancelOrderSaga', 'handleCancelOrder', 'Submitting cancellation transaction', {
      chainId,
      id,
    })

    const response = await signer.sendTransaction(cancelRequest)

    logger.debug('cancelOrderSaga', 'handleCancelOrder', 'Cancellation transaction submitted', {
      chainId,
      id,
      hash: response.hash,
    })

    // Persist the broadcast: cancelTxHash + the T1 deadline (CAS — no-ops if the order left Cancelling)
    store.dispatch(
      orderCancelBroadcasted({ address, chainId, id, cancelTxHash: response.hash, broadcastTimeMs: Date.now() }),
    )

    if (getFeatureFlag(FeatureFlags.LimitCancelTimeout)) {
      if (order?.orderHash) {
        registerTrackedCancelTx({ payload, hash: response.hash, orderHash: order.orderHash })
        sendAnalyticsEvent(InterfaceEventName.LimitCancelBroadcast, {
          order_hash: order.orderHash,
          chain_id: chainId,
          route: 'pathA-converged',
        })
      }
    }

    // The order poller (+ the finalization listener for the tracked cancel tx) converge the
    // order's final status from here.
  } catch (error) {
    // Rejection ≠ broadcast failure ≠ FailedCancel: nothing reached the chain, so the order
    // reverts to its captured pre-cancel status. Only a confirmed on-chain terminal condition
    // may ever write FailedCancel.
    const rejected = didUserReject(error)
    store.dispatch(
      orderCancelFailed({
        address,
        chainId,
        id,
        reason: rejected ? 'rejected' : 'broadcast-failed',
        revertToStatus: payload.revertToStatus ?? TransactionStatus.Pending,
      }),
    )

    if (order?.orderHash) {
      sendAnalyticsEvent(InterfaceEventName.LimitCancelBroadcastFailed, {
        order_hash: order.orderHash,
        chain_id: chainId,
        reason: rejected ? 'rejection' : 'failure',
        route: 'pathA-converged',
      })
    }

    if (rejected) {
      // Quiet revert — the user changed their mind; no error surface
      return
    }

    popupRegistry.addPopup(
      { type: PopupType.Error, error: i18n.t('limits.cancel.broadcastFailed') },
      `cancel-broadcast-failed-${id}`,
    )
    logger.error(error, {
      tags: { file: 'cancelOrderSaga', function: 'handleCancelOrder' },
      extra: { chainId, id },
    })
  }
}
