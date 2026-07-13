import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import type { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import type { OnChainTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Pure builders for SWAP-2471 nonce telemetry. Kept side-effect-free (no Date.now() — `nowMs`
 * is injected) so they are deterministically unit-testable. Call sites pass `Date.now()`.
 */

// Bound the per-event arrays so a large stuck backlog can't produce an unbounded payload.
const MAX_INFLATING_TXS_LOGGED = 10

/** Minimal shape of a local Pending private-RPC tx used for inflation diagnostics. */
export interface PrivatePendingTxSummaryInput {
  id: string
  hash?: string
  nonce?: number
  addedTime: number
  status: string
}

interface PrivatePendingTxSummary {
  inflating_tx_count: number
  oldest_inflating_tx_age_ms: number
  inflating_tx_ids: string[]
  inflating_tx_hashes: string[]
}

export function summarizePrivatePendingTxs(input: {
  txs: PrivatePendingTxSummaryInput[]
  nowMs: number
}): PrivatePendingTxSummary {
  const { txs, nowMs } = input
  if (txs.length === 0) {
    return { inflating_tx_count: 0, oldest_inflating_tx_age_ms: 0, inflating_tx_ids: [], inflating_tx_hashes: [] }
  }
  const oldestAddedTime = Math.min(...txs.map((tx) => tx.addedTime))
  const capped = txs.slice(0, MAX_INFLATING_TXS_LOGGED)
  return {
    inflating_tx_count: txs.length,
    oldest_inflating_tx_age_ms: nowMs - oldestAddedTime,
    inflating_tx_ids: capped.map((tx) => tx.id),
    inflating_tx_hashes: capped.map((tx) => tx.hash).filter((hash): hash is string => Boolean(hash)),
  }
}

export function buildNonceCalculatedProperties(input: {
  chainId: UniverseChainId
  address: string
  submitViaPrivateRpc: boolean
  onChainPendingNonce: number
  pendingPrivateTxCount: number
  privateRpcSupported: boolean
  inflatingTxs: PrivatePendingTxSummaryInput[]
  nowMs: number
}): UniverseEventProperties[WalletEventName.NonceCalculated] {
  const {
    chainId,
    address,
    submitViaPrivateRpc,
    onChainPendingNonce,
    pendingPrivateTxCount,
    privateRpcSupported,
    inflatingTxs,
    nowMs,
  } = input

  const base = {
    chain_id: chainId,
    address,
    submit_via_private_rpc: submitViaPrivateRpc,
    on_chain_pending_nonce: onChainPendingNonce,
    pending_private_tx_count: pendingPrivateTxCount,
    final_nonce: onChainPendingNonce + pendingPrivateTxCount,
    private_rpc_supported: privateRpcSupported,
  }

  // The inflating-tx ids/hashes are the causal-proof fields: they let an analyst link a stuck
  // tx to the LATER tx whose nonce it inflated. Only emitted when the local count is non-zero.
  if (pendingPrivateTxCount > 0) {
    return { ...base, ...summarizePrivatePendingTxs({ txs: inflatingTxs, nowMs }) }
  }
  return base
}

export function buildPendingTransactionStuckProperties(input: {
  transaction: OnChainTransactionDetails
  requestNonce?: number
  nextNonce?: number
  // Pass only where the provider was genuinely probed; omit otherwise so the field stays a measurement.
  providerKnowsTx?: boolean
  reason: UniverseEventProperties[WalletEventName.PendingTransactionStuck]['reason']
  nowMs: number
}): UniverseEventProperties[WalletEventName.PendingTransactionStuck] {
  const { transaction, requestNonce, nextNonce, providerKnowsTx, reason, nowMs } = input
  return {
    transaction_id: transaction.id,
    transaction_hash: transaction.hash,
    chain_id: transaction.chainId,
    request_nonce: requestNonce,
    next_nonce: nextNonce,
    ...(providerKnowsTx === undefined ? {} : { provider_knows_tx: providerKnowsTx }),
    submit_via_private_rpc: transaction.options.submitViaPrivateRpc,
    private_rpc_provider: transaction.options.privateRpcProvider,
    reason,
    age_ms: nowMs - transaction.addedTime,
  }
}

export function buildBacklogProperties(input: {
  totalIncomplete: number
  privatePending: { addedTime: number }[]
  nowMs: number
}): UniverseEventProperties[WalletEventName.PendingTransactionBacklogOnStartup] {
  const { totalIncomplete, privatePending, nowMs } = input
  return {
    total_incomplete: totalIncomplete,
    private_pending_count: privatePending.length,
    oldest_private_pending_age_ms: privatePending.length
      ? nowMs - Math.min(...privatePending.map((tx) => tx.addedTime))
      : 0,
  }
}
