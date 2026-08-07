import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { call } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { buildSingleCancellation } from 'uniswap/src/features/transactions/cancel/cancelOrderFactory'
import { isCancelTimedOut } from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import {
  addTransaction,
  orderCancelTxMined,
  revertCancelSwap,
  TransactionsState,
} from 'uniswap/src/features/transactions/slice'
import { getOrders } from 'uniswap/src/features/transactions/swap/orders'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  InterfaceTransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { useSelectChain } from '~/hooks/useSelectChain'
import store from '~/state'
import { fetchCancelTxReceiptStatus } from '~/state/activity/polling/cancelTimeouts'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { getSigner } from '~/state/sagas/transactions/utils'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

export interface RevertCancellationParams {
  /** Snapshot for identity only — the saga re-selects the fresh record (precondition CAS) */
  order: UniswapXOrderDetails
  selectChain: (chainId: number) => Promise<boolean>
}

function getFreshOrder({
  address,
  chainId,
  id,
}: {
  address: string
  chainId: UniverseChainId
  id: string
}): UniswapXOrderDetails | undefined {
  const tx = (store.getState() as { transactions: TransactionsState }).transactions[address]?.[chainId]?.[id]
  return tx && isUniswapX(tx) ? tx : undefined
}

/**
 * Revert flow for a timed-out cancellation: submits a NEW Permit2 invalidation (new account
 * nonce — not a replacement; the original stays in the mempool) and swaps the tracked cancel
 * fields via a CAS write on successful broadcast only. The order holds `Cancelling` across the
 * whole bundle — restoring `Pending` mid-flow would re-enable both cancel entry points and
 * invite a parallel double-cancel.
 */
async function handleRevertCancellation({
  order: orderSnapshot,
  selectChain,
}: RevertCancellationParams): Promise<void> {
  if (!getFeatureFlag(FeatureFlags.LimitCancelTimeout)) {
    return
  }

  const orderId = { address: orderSnapshot.from, chainId: orderSnapshot.chainId, id: orderSnapshot.id }

  // 1. Precondition CAS: abort unless the fresh record is still timed-out Cancelling.
  //    (The saga wrapper processes one revert at a time, so a double-click's second trigger
  //    re-runs this check after the first attempt updated the record.)
  const order = getFreshOrder(orderId)
  if (!order?.orderHash || !isCancelTimedOut(order, Date.now())) {
    return
  }
  const { orderHash } = order

  sendAnalyticsEvent(InterfaceEventName.LimitCancelRevertClicked, { order_hash: orderHash, chain_id: order.chainId })

  try {
    // 2. Fresh backend pre-check, branching on the raw status for per-branch messaging.
    //    (getCancelOrderTxRequest cannot be reused here — it collapses every non-OPEN status
    //    into an indistinguishable null.)
    // `.at(0)` keeps the undefined in the type — the API can legitimately return an empty array
    const apiOrder = (await getOrders([orderHash])).orders.at(0)
    if (!apiOrder) {
      // Backend returned nothing for the hash — nothing was attempted (no wallet prompt), so no
      // failure analytics; give a neutral retry message and keep the alerted state
      popupRegistry.addPopup(
        { type: PopupType.Error, error: i18n.t('limits.cancel.broadcastFailed') },
        `revert-precheck-unavailable-${order.id}`,
      )
      return
    }
    switch (apiOrder.orderStatus) {
      case TradingApi.OrderStatus.FILLED:
        popupRegistry.addPopup(
          { type: PopupType.Error, error: i18n.t('limits.cancel.alreadyFilled') },
          `revert-already-filled-${order.id}`,
        )
        return
      case TradingApi.OrderStatus.CANCELLED:
        popupRegistry.addPopup(
          { type: PopupType.Success, message: i18n.t('limits.cancel.lateSuccess') },
          `revert-late-success-${order.id}`,
        )
        return
      case TradingApi.OrderStatus.EXPIRED:
      case TradingApi.OrderStatus.ERROR:
        // Silent clear — nothing failed; the order died naturally. The poller converges the row.
        return
      default:
        // OPEN / INSUFFICIENT_FUNDS (non-final, treated as open) / unknown → proceed
        break
    }

    // 3. Last-second receipt check on the original cancel tx (skipped for legacy no-hash records)
    if (order.cancelTxHash) {
      const receiptStatus = await fetchCancelTxReceiptStatus({
        chainId: order.chainId,
        cancelTxHash: order.cancelTxHash,
      })
      if (receiptStatus === 'mined') {
        store.dispatch(orderCancelTxMined(orderId))
        popupRegistry.addPopup(
          { type: PopupType.Success, message: i18n.t('limits.cancel.finalizing') },
          `revert-original-confirmed-${order.id}`,
        )
        return
      }
      if (receiptStatus === 'rpc-error') {
        // The whole point of this check is proving the original cancel is unmined before paying
        // for a second invalidation. An RPC outage proves nothing — abort instead of risking the
        // double-gas case; the user can retry once the RPC recovers. No failure analytics: no
        // broadcast was attempted.
        popupRegistry.addPopup(
          { type: PopupType.Error, error: i18n.t('limits.cancel.broadcastFailed') },
          `revert-receipt-unavailable-${order.id}`,
        )
        return
      }
    }

    // 4. Chain switch, then wallet prompt for the new invalidation
    const chainSwitched = await selectChain(order.chainId)
    if (!chainSwitched) {
      return
    }

    const encodedOrder = order.encodedOrder ?? apiOrder.encodedOrder
    if (!encodedOrder) {
      logger.error(new Error('Cannot revert cancellation: missing encodedOrder'), {
        tags: { file: 'revertCancellationSaga', function: 'handleRevertCancellation' },
        extra: { orderHash },
      })
      return
    }

    const cancelRequest = await buildSingleCancellation(
      { encodedOrder, routing: order.routing, chainId: order.chainId, orderHash },
      order.from,
    )
    if (!cancelRequest) {
      logger.error(new Error('Cannot revert cancellation: failed to build cancellation tx'), {
        tags: { file: 'revertCancellationSaga', function: 'handleRevertCancellation' },
        extra: { orderHash },
      })
      return
    }

    const signer = await getSigner(order.from)
    const response = await signer.sendTransaction(cancelRequest)

    // 5. CAS record-swap on successful broadcast ONLY: refuses if the order left the timed-out
    //    state mid-prompt; the old hash moves to supersededCancelTxHashes and stays watched.
    store.dispatch(revertCancelSwap({ ...orderId, newCancelTxHash: response.hash, broadcastTimeMs: Date.now() }))

    const trackedCancelTx: InterfaceTransactionDetails = {
      id: response.hash,
      hash: response.hash,
      chainId: order.chainId,
      from: order.from,
      routing: TradingApi.Routing.CLASSIC,
      status: TransactionStatus.Pending,
      addedTime: Date.now(),
      transactionOriginType: TransactionOriginType.Internal,
      typeInfo: { type: TransactionType.UniswapXCancel, orderHashes: [orderHash] },
      options: { request: cancelRequest },
    }
    store.dispatch(addTransaction(trackedCancelTx))

    sendAnalyticsEvent(InterfaceEventName.LimitCancelBroadcast, {
      order_hash: orderHash,
      chain_id: order.chainId,
      route: 'revert',
    })
  } catch (error) {
    // Record untouched — the order stays in the alerted state
    const rejected = didUserReject(error)
    sendAnalyticsEvent(InterfaceEventName.LimitCancelBroadcastFailed, {
      order_hash: orderHash,
      chain_id: order.chainId,
      reason: rejected ? 'rejection' : 'failure',
      route: 'revert',
    })
    if (rejected) {
      return
    }
    popupRegistry.addPopup(
      { type: PopupType.Error, error: i18n.t('limits.cancel.broadcastFailed') },
      `revert-broadcast-failed-${order.id}`,
    )
    logger.error(error, {
      tags: { file: 'revertCancellationSaga', function: 'handleRevertCancellation' },
      extra: { orderHash },
    })
  }
}

function* revertCancellation(params: RevertCancellationParams) {
  yield* call(handleRevertCancellation, params)
}

export const revertCancellationSaga = createSaga(revertCancellation, 'revertCancellation')

export function useRevertCancellationCallback(): (order: UniswapXOrderDetails) => void {
  const dispatch = useDispatch()
  const selectChain = useSelectChain()

  return useCallback(
    (order: UniswapXOrderDetails) => {
      dispatch(revertCancellationSaga.actions.trigger({ order, selectChain }))
    },
    [dispatch, selectChain],
  )
}
