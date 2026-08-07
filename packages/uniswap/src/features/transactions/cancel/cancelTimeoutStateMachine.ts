import { TradingApi } from '@universe/api'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

/** T1: how long after broadcast a cancel tx may go without a receipt before it is considered timed out. */
export const CANCEL_TX_TIMEOUT_MS = 120_000

/** T2: how long a `Cancelling` order without a broadcast cancel tx may linger before it is considered timed out. */
export const ORPHAN_CANCEL_TIMEOUT_MS = 300_000

export type CancelTimeoutCause = 'no-receipt' | 'orphan-no-hash' | 'legacy-record'

export type CancelEvaluation =
  /** Nothing to do this tick */
  | { kind: 'none' }
  /** Legacy/orphan record detected: persist the orphan deadline (dispatch `stampOrphanCancelTimeout`) */
  | { kind: 'stamp-orphan-timeout' }
  /** Deadline passed and a cancel tx hash exists: fetch its receipt, then re-evaluate with the result */
  | { kind: 'check-receipt'; cancelTxHash: string }
  /** Cancel tx receipt found on-chain: dispatch `orderCancelTxMined` (never finalize the order from a receipt) */
  | { kind: 'cancel-tx-mined' }
  /** Timed out and the order is still live per the backend: surface the alert + Revert CTA */
  | { kind: 'timeout-alert'; cause: CancelTimeoutCause }
  /** Backend adjudicated CANCELLED: the earlier cancellation went through */
  | { kind: 'order-cancelled' }
  /** Backend adjudicated FILLED: order succeeded; cancellation did not apply */
  | { kind: 'order-filled' }
  /** Backend adjudicated EXPIRED: silently clear the cancel flow */
  | { kind: 'order-expired' }
  /** Backend adjudicated ERROR (terminal): silently clear the cancel flow */
  | { kind: 'order-errored' }

export interface CancelEvaluationInput {
  order: UniswapXOrderDetails
  /** Fresh backend status from the same poll tick (backend is authoritative) */
  freshBackendStatus: TradingApi.OrderStatus | undefined
  /**
   * Result of the one-shot receipt lookup for `order.cancelTxHash`.
   * `undefined` = not fetched yet (the machine will ask for it via `check-receipt`).
   */
  cancelTxReceiptStatus?: 'mined' | 'not-found'
  nowMs: number
  /** Backend order deadline (unix seconds) used as expiry fallback when the local record lacks one */
  backendDeadline?: number
}

/**
 * Derived predicate: the cancellation is timed out. Never stored — evaluated from persisted fields.
 */
export function isCancelTimedOut(order: UniswapXOrderDetails, nowMs: number = Date.now()): boolean {
  return (
    order.status === TransactionStatus.Cancelling &&
    order.cancelTimeoutAtMs != null &&
    nowMs > order.cancelTimeoutAtMs &&
    !order.cancelTxMined
  )
}

/** Derived predicate: `Cancelling` with no broadcast cancel tx (legacy/pre-broadcast records). */
export function isOrphanCancel(order: UniswapXOrderDetails): boolean {
  return order.status === TransactionStatus.Cancelling && !order.cancelTxHash
}

function getTimeoutCause(order: UniswapXOrderDetails): CancelTimeoutCause {
  if (order.cancelTxHash) {
    return 'no-receipt'
  }
  // New-flow orphans carry the cancelRequest written by the `cancelTransaction` dispatch;
  // pre-upgrade stuck records generally do not. Analytics-only distinction.
  return order.cancelRequest ? 'orphan-no-hash' : 'legacy-record'
}

/**
 * `order.expiry === undefined` is treated as NOT expired (a naive `undefined > now` gate would
 * suppress the alert for exactly the oldest stuck records). Falls back to the backend deadline.
 */
function isOrderExpired({
  order,
  nowMs,
  backendDeadline,
}: {
  order: UniswapXOrderDetails
  nowMs: number
  backendDeadline?: number
}): boolean {
  const expirySeconds = order.expiry ?? backendDeadline
  if (expirySeconds === undefined) {
    return false
  }
  return expirySeconds * 1000 < nowMs
}

/**
 * Pure cancel-timeout state machine, shared by the web order poller (`updateOrders`) and the
 * wallet `OrderWatcher`. Evaluated on poll ticks against persisted deadlines — never in-memory
 * timers — so refresh/new-tab/rehydrate all resume correctly.
 *
 * Order of operations at deadline expiry: one-shot receipt check first (closes the
 * backend-lag false alarm), then branch on the fresh backend status.
 */
export function evaluateCancelState(input: CancelEvaluationInput): CancelEvaluation {
  const { order, freshBackendStatus, cancelTxReceiptStatus, nowMs, backendDeadline } = input

  if (order.status !== TransactionStatus.Cancelling || order.cancelTxMined) {
    return { kind: 'none' }
  }

  // Legacy / orphan records: lazily persist the T2 deadline once, then follow normal evaluation.
  if (order.cancelTimeoutAtMs == null) {
    if (!order.cancelTxHash) {
      return { kind: 'stamp-orphan-timeout' }
    }
    // Defensive: broadcast writes the deadline atomically, so this should not happen.
    return { kind: 'none' }
  }

  if (nowMs <= order.cancelTimeoutAtMs) {
    return { kind: 'none' }
  }

  // Deadline passed — receipt first.
  if (order.cancelTxHash) {
    if (cancelTxReceiptStatus === undefined) {
      return { kind: 'check-receipt', cancelTxHash: order.cancelTxHash }
    }
    if (cancelTxReceiptStatus === 'mined') {
      return { kind: 'cancel-tx-mined' }
    }
  }

  // Then the backend branch. Never re-submit automatically; the alert is soft and auto-resolving.
  switch (freshBackendStatus) {
    case TradingApi.OrderStatus.OPEN:
    case TradingApi.OrderStatus.INSUFFICIENT_FUNDS:
      // INSUFFICIENT_FUNDS is provably non-final (orders return to open); treat as open, no exit from Cancelling.
      if (isOrderExpired({ order, nowMs, backendDeadline })) {
        return { kind: 'none' }
      }
      return { kind: 'timeout-alert', cause: getTimeoutCause(order) }
    case TradingApi.OrderStatus.CANCELLED:
      return { kind: 'order-cancelled' }
    case TradingApi.OrderStatus.FILLED:
      return { kind: 'order-filled' }
    case TradingApi.OrderStatus.EXPIRED:
      return { kind: 'order-expired' }
    case TradingApi.OrderStatus.ERROR:
      return { kind: 'order-errored' }
    default:
      return { kind: 'none' }
  }
}
