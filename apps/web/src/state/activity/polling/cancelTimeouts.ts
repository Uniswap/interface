import { isValidHexString } from '@universe/encoding'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { getPublicClient } from '@wagmi/core'
import type { Dispatch } from 'redux'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  CancelEvaluation,
  evaluateCancelState,
} from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import {
  orderCancelTxMined,
  stampCancelAlertShown,
  stampOrphanCancelTimeout,
} from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { UniswapXBackendOrder } from '~/types/uniswapx'

// One alert-shown event per persisted deadline (survives poll ticks; resets naturally on Revert,
// which writes a new deadline). Bounded FIFO so the set never grows past long sessions /
// account switches — evicting an old key at worst re-fires one analytics event.
const MAX_ALERT_SHOWN_KEYS = 200
const alertShownKeys = new Set<string>()

function markAlertShown(key: string): void {
  if (alertShownKeys.size >= MAX_ALERT_SHOWN_KEYS) {
    const oldestKey = alertShownKeys.values().next().value
    if (oldestKey !== undefined) {
      alertShownKeys.delete(oldestKey)
    }
  }
  alertShownKeys.add(key)
}

export type CancelTxReceiptStatus = 'mined' | 'not-found' | 'rpc-error'

/**
 * One-shot receipt lookup for a cancel tx. `'not-found'` is a positive answer (the chain was
 * asked and knows no receipt); `'rpc-error'` means the chain could not be asked — callers must
 * not treat an outage as evidence the tx is unmined.
 */
export async function fetchCancelTxReceiptStatus({
  chainId,
  cancelTxHash,
}: {
  chainId: UniverseChainId
  cancelTxHash: string
}): Promise<CancelTxReceiptStatus> {
  if (!isValidHexString(cancelTxHash) || !isEVMChain(chainId)) {
    return 'not-found'
  }
  try {
    const client = getPublicClient(wagmiConfig, { chainId })
    if (!client) {
      return 'rpc-error'
    }
    // viem throws (TransactionReceiptNotFoundError) rather than returning null for unmined txs
    await client.getTransactionReceipt({ hash: cancelTxHash })
    return 'mined'
  } catch (error) {
    // viem throws TransactionReceiptNotFoundError while the tx is unmined; anything else
    // (network failure, rate limit) is an outage, not a "no receipt" answer
    if (error instanceof Error && error.name === 'TransactionReceiptNotFoundError') {
      return 'not-found'
    }
    return 'rpc-error'
  }
}

async function evaluateOrder({
  order,
  remoteOrder,
  dispatch,
}: {
  order: UniswapXOrderDetails
  remoteOrder?: UniswapXBackendOrder
  dispatch: Dispatch
}): Promise<void> {
  const input = {
    order,
    freshBackendStatus: remoteOrder?.orderStatus,
    nowMs: Date.now(),
    backendDeadline: remoteOrder?.deadline,
  }

  let evaluation: CancelEvaluation = evaluateCancelState(input)

  if (evaluation.kind === 'check-receipt') {
    // Receipt-first at deadline expiry: closes the backend-lag false alarm on an already-mined tx
    const cancelTxReceiptStatus = await fetchCancelTxReceiptStatus({
      chainId: order.chainId,
      cancelTxHash: evaluation.cancelTxHash,
    })
    if (cancelTxReceiptStatus === 'rpc-error') {
      // An RPC outage proves nothing about the cancel tx — never raise a false alert from it.
      // Skip this order for the tick; the next tick retries.
      return
    }
    evaluation = evaluateCancelState({ ...input, cancelTxReceiptStatus })
  }

  switch (evaluation.kind) {
    case 'stamp-orphan-timeout':
      dispatch(
        stampOrphanCancelTimeout({ address: order.from, chainId: order.chainId, id: order.id, nowMs: Date.now() }),
      )
      break
    case 'cancel-tx-mined':
      // Never finalizes the order — the backend adjudicates CANCELLED vs FILLED
      dispatch(orderCancelTxMined({ address: order.from, chainId: order.chainId, id: order.id }))
      if (order.orderHash) {
        sendAnalyticsEvent(InterfaceEventName.LimitCancelConfirmed, {
          order_hash: order.orderHash,
          chain_id: order.chainId,
        })
      }
      break
    case 'timeout-alert': {
      // The alert itself is derived state (isCancelTimedOut); this arm only (1) stamps a benign
      // one-time write so memoized rows re-render with the timed-out treatment and (2) fires the
      // analytics event
      if (order.cancelAlertShownAtMs == null) {
        dispatch(
          stampCancelAlertShown({ address: order.from, chainId: order.chainId, id: order.id, nowMs: Date.now() }),
        )
      }
      const key = `${order.orderHash}:${order.cancelTimeoutAtMs}`
      if (order.orderHash && !alertShownKeys.has(key)) {
        markAlertShown(key)
        sendAnalyticsEvent(InterfaceEventName.LimitCancelTimeoutAlertShown, {
          order_hash: order.orderHash,
          chain_id: order.chainId,
          cause: evaluation.cause,
        })
      }
      break
    }
    // Terminal arms (order-cancelled / order-filled / order-expired / order-errored) are converged
    // by the normal poller update path — final statuses always pass the Cancelling guard
    default:
      break
  }
}

/**
 * Flag-gated cancel-timeout tick for the web order pollers. Runs after fresh statuses arrive on
 * each tick — persisted deadlines, no in-memory timers, so refresh/new-tab resume correctly.
 * `pendingOrders` must be the subset of orders the tick is responsible for (the quick poller's
 * L2 orders / the standard poller's mainnet orders) so a quick L2 tick never spams receipt RPCs
 * for mainnet orders whose statuses it did not fetch.
 */
export async function evaluateCancelTimeouts({
  pendingOrders,
  statuses,
  dispatch,
}: {
  pendingOrders: UniswapXOrderDetails[]
  statuses: UniswapXBackendOrder[]
  dispatch: Dispatch
}): Promise<void> {
  try {
    if (!getFeatureFlag(FeatureFlags.LimitCancelTimeout)) {
      return
    }

    const cancellingOrders = pendingOrders.filter((order) => order.status === TransactionStatus.Cancelling)
    for (const order of cancellingOrders) {
      const remoteOrder = statuses.find((status) => status.orderHash === order.orderHash)
      await evaluateOrder({ order, remoteOrder, dispatch })
    }
  } catch (error) {
    // A persistent failure here silences the whole timeout feature — keep it visible
    logger.warn('cancelTimeouts', 'evaluateCancelTimeouts', 'Failed to evaluate cancel timeouts', error)
  }
}
