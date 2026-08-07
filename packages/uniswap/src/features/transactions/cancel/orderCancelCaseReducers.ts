import { Draft, PayloadAction } from '@reduxjs/toolkit'
import {
  CANCEL_TX_TIMEOUT_MS,
  ORPHAN_CANCEL_TIMEOUT_MS,
} from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  ChainIdToTxIdToDetails,
  TransactionId,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'

// Structural twin of TransactionsState (importing it from slice.ts would create a cycle)
type CancelCaseReducerState = Partial<Record<Address, ChainIdToTxIdToDetails>>

/**
 * The only statuses a failed/rejected cancellation may revert an order to — the captured
 * pre-cancel status of a cancellable order (`isLimitCancellable`: `Pending` or `InsufficientFunds`).
 */
export type CancelRevertStatus = TransactionStatus.Pending | TransactionStatus.InsufficientFunds

/**
 * Maps a captured pre-cancel status onto the revert target — never blanket-`Pending`s an
 * `InsufficientFunds`-originated cancel.
 */
export function toCancelRevertStatus(preCancelStatus: TransactionStatus): CancelRevertStatus {
  return preCancelStatus === TransactionStatus.InsufficientFunds
    ? TransactionStatus.InsufficientFunds
    : TransactionStatus.Pending
}

/**
 * Id-keyed CAS write: records the broadcast cancel tx on a `Cancelling` UniswapX order and
 * starts the persisted T1 deadline. No-ops unless the order is still `Cancelling`.
 */
export function orderCancelBroadcastedReducer(
  state: Draft<CancelCaseReducerState>,
  {
    payload: { chainId, id, address, cancelTxHash, broadcastTimeMs },
  }: PayloadAction<TransactionId & { address: string; cancelTxHash: string; broadcastTimeMs: number }>,
): void {
  const tx = state[address]?.[chainId]?.[id]
  if (!tx || !isUniswapX(tx) || tx.status !== TransactionStatus.Cancelling) {
    return
  }
  tx.cancelTxHash = cancelTxHash
  tx.cancelBroadcastTimeMs = broadcastTimeMs
  tx.cancelTimeoutAtMs = broadcastTimeMs + CANCEL_TX_TIMEOUT_MS
}

/**
 * Id-keyed CAS write: the cancel attempt never made it on-chain (user rejection or broadcast
 * failure). Clears the cancel fields and restores the captured pre-cancel status.
 * No-ops unless the order is still `Cancelling`.
 */
export function orderCancelFailedReducer(
  state: Draft<CancelCaseReducerState>,
  {
    payload: { chainId, id, address, revertToStatus },
  }: PayloadAction<
    TransactionId & {
      address: string
      reason: 'rejected' | 'broadcast-failed'
      revertToStatus: CancelRevertStatus
    }
  >,
): void {
  const tx = state[address]?.[chainId]?.[id]
  if (!tx || !isUniswapX(tx) || tx.status !== TransactionStatus.Cancelling) {
    return
  }
  tx.status = revertToStatus
  if ('cancelRequest' in tx) {
    delete tx.cancelRequest
  }
  delete tx.cancelTxHash
  delete tx.cancelBroadcastTimeMs
  delete tx.cancelTimeoutAtMs
  delete tx.cancelInitiatedTimeMs
  delete tx.cancelAlertShownAtMs
}

/**
 * Id-keyed CAS write: the cancel tx has a receipt on-chain. Marks the order as
 * confirmed-finalizing; the backend adjudicates the final CANCELLED vs FILLED outcome —
 * this never finalizes the order directly. Re-entrant: if a late receipt lands after the
 * order was reverted to `Pending`/`InsufficientFunds` (poll-exhaustion race), the order is
 * re-marked toward cancelled — its nonce is consumed, so a fake-Pending order would be worse.
 */
export function orderCancelTxMinedReducer(
  state: Draft<CancelCaseReducerState>,
  { payload: { chainId, id, address } }: PayloadAction<TransactionId & { address: string }>,
): void {
  const tx = state[address]?.[chainId]?.[id]
  if (!tx || !isUniswapX(tx)) {
    return
  }
  if (tx.status === TransactionStatus.Cancelling) {
    tx.cancelTxMined = true
  } else if (tx.status === TransactionStatus.Pending || tx.status === TransactionStatus.InsufficientFunds) {
    tx.status = TransactionStatus.Cancelling
    tx.cancelTxMined = true
  }
}

/**
 * Id-keyed CAS write: lazily persists the T2 orphan deadline for `Cancelling` records with no
 * broadcast cancel tx (pre-upgrade stuck records, mid-approval reloads, dialog closed without
 * broadcast). The stamp persists so the clock never restarts on reload.
 */
export function stampOrphanCancelTimeoutReducer(
  state: Draft<CancelCaseReducerState>,
  { payload: { chainId, id, address, nowMs } }: PayloadAction<TransactionId & { address: string; nowMs: number }>,
): void {
  const tx = state[address]?.[chainId]?.[id]
  if (
    !tx ||
    !isUniswapX(tx) ||
    tx.status !== TransactionStatus.Cancelling ||
    tx.cancelTxHash ||
    tx.cancelTimeoutAtMs != null
  ) {
    return
  }
  tx.cancelInitiatedTimeMs ??= nowMs
  // T2 is anchored at cancelInitiatedTimeMs (spec §2.2): a new-flow record that reloaded
  // mid-approval keeps its original clock — a record already past T2 alerts on the first tick.
  // Legacy records with no field anchor at detection (never mass-alarm a fleet of old records).
  tx.cancelTimeoutAtMs = tx.cancelInitiatedTimeMs + ORPHAN_CANCEL_TIMEOUT_MS
}

/**
 * Id-keyed one-time write from the poller's timeout-alert arm. The timed-out treatment itself is
 * derived (`isCancelTimedOut`) and never stored — but deadline passage writes nothing to redux,
 * so memoized rows keyed on the order object would never re-render. This benign stamp gives the
 * record a fresh reference exactly once per deadline. No-ops unless still timed-out `Cancelling`.
 */
export function stampCancelAlertShownReducer(
  state: Draft<CancelCaseReducerState>,
  { payload: { chainId, id, address, nowMs } }: PayloadAction<TransactionId & { address: string; nowMs: number }>,
): void {
  const tx = state[address]?.[chainId]?.[id]
  if (
    !tx ||
    !isUniswapX(tx) ||
    tx.status !== TransactionStatus.Cancelling ||
    tx.cancelTxMined ||
    tx.cancelTimeoutAtMs == null ||
    nowMs <= tx.cancelTimeoutAtMs ||
    tx.cancelAlertShownAtMs != null
  ) {
    return
  }
  tx.cancelAlertShownAtMs = nowMs
}

/**
 * Id-keyed CAS write for the Revert flow: swaps in the replacement cancel tx after a
 * successful broadcast. Refuses unless the order is still `Cancelling` and timed out
 * (guards against a status change mid-prompt). The superseded hash stays watched — the
 * first receipt on either tx stops the timer.
 */
export function revertCancelSwapReducer(
  state: Draft<CancelCaseReducerState>,
  {
    payload: { chainId, id, address, newCancelTxHash, broadcastTimeMs },
  }: PayloadAction<TransactionId & { address: string; newCancelTxHash: string; broadcastTimeMs: number }>,
): void {
  const tx = state[address]?.[chainId]?.[id]
  if (
    !tx ||
    !isUniswapX(tx) ||
    tx.status !== TransactionStatus.Cancelling ||
    tx.cancelTxMined ||
    tx.cancelTimeoutAtMs == null ||
    broadcastTimeMs <= tx.cancelTimeoutAtMs
  ) {
    return
  }
  if (tx.cancelTxHash) {
    tx.supersededCancelTxHashes = [...(tx.supersededCancelTxHashes ?? []), tx.cancelTxHash]
  }
  tx.cancelTxHash = newCancelTxHash
  tx.cancelBroadcastTimeMs = broadcastTimeMs
  tx.cancelTimeoutAtMs = broadcastTimeMs + CANCEL_TX_TIMEOUT_MS
  // Fresh deadline → fresh alert cycle (the stamp is one-shot per deadline)
  delete tx.cancelAlertShownAtMs
}
