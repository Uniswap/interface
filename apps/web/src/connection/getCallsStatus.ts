import { TradingApi } from '@universe/api'
import { ensure0xHex, numberToHex } from '@universe/encoding'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import type { GetCallsStatusResult } from 'wallet/src/features/dappRequests/types'

// Rank swap rows by how resolved they are. We query the batch id in both hash
// fields (see below), so the response carries up to two rows — the field that
// didn't match comes back NOT_FOUND. Keep the most-resolved row.
const SWAP_STATUS_RANK: Record<TradingApi.SwapStatus, number> = {
  [TradingApi.SwapStatus.SUCCESS]: 3,
  [TradingApi.SwapStatus.FAILED]: 3,
  [TradingApi.SwapStatus.EXPIRED]: 3,
  [TradingApi.SwapStatus.PENDING]: 2,
  [TradingApi.SwapStatus.NOT_FOUND]: 1,
}

/**
 * EIP-5792 `wallet_getCallsStatus` for the embedded wallet. The activity poller
 * hits this every 1s for each pending batch
 * (`apps/web/src/state/activity/polling/batch.ts`).
 *
 * A batch id is one of two 32-byte hex shapes, indistinguishable by format:
 *   - a `userOpHash` from a sponsored 4337 swap, or
 *   - a `transactionHash` from a non-sponsored 7702 Calibur multicall.
 *
 * Rather than probe a bundler RPC and fall back to a chain RPC, we resolve
 * status through the Trading API `/swaps` feed — the same source mobile and
 * extension swaps poll. It accepts both hash kinds, resolves a userOpHash to
 * its on-chain txHash, and reports EXPIRED for a userOp that never landed
 * (which the receipt-probe approach could only ever report as perpetually
 * pending). We pass the id in both fields and keep whichever row resolves.
 * Stateless and refresh-resilient.
 */
export async function getEmbeddedWalletCallsStatus({
  batchId,
  chainId,
}: {
  batchId: string | undefined
  chainId: UniverseChainId
}): Promise<GetCallsStatusResult> {
  if (!batchId) {
    throw new Error('wallet_getCallsStatus: missing batchId')
  }
  const base = {
    version: '2.0.0',
    id: batchId,
    chainId: ensure0xHex(numberToHex(chainId)),
    atomic: true,
  }

  const swap = await fetchSwapStatus(batchId, chainId)
  if (!swap) {
    // `/swaps` unreachable, or no row resolved yet — keep the batch pending so
    // the poller retries instead of counting a hard failure.
    return { ...base, status: 100 }
  }

  switch (swap.status) {
    case TradingApi.SwapStatus.SUCCESS:
      // A confirmed swap should always carry its on-chain tx hash. If `/swaps` hasn't
      // resolved it yet, stay pending and let the poller retry — don't fall back to
      // `batchId`, which for a sponsored swap is a userOpHash, not a transaction hash.
      if (!swap.txHash) {
        return { ...base, status: 100 }
      }
      return {
        ...base,
        status: 200,
        receipts: [{ transactionHash: swap.txHash, status: '0x1' }],
      }
    case TradingApi.SwapStatus.FAILED:
      // Reverted on-chain. Surface a receipt when `/swaps` resolved the tx hash.
      return {
        ...base,
        status: 400,
        ...(swap.txHash ? { receipts: [{ transactionHash: swap.txHash, status: '0x0' }] } : {}),
      }
    case TradingApi.SwapStatus.EXPIRED:
      // Never included on-chain — definitively failed, no receipt.
      return { ...base, status: 400 }
    case TradingApi.SwapStatus.PENDING:
    case TradingApi.SwapStatus.NOT_FOUND:
    default:
      return { ...base, status: 100 }
  }
}

/**
 * Resolve a batch id against the Trading API `/swaps` feed. The id may be a
 * userOpHash or a txHash, so we query both fields and return the most-resolved
 * row (the non-matching field comes back NOT_FOUND). Returns undefined when the
 * feed is unreachable, so the caller can treat the batch as still pending.
 */
async function fetchSwapStatus(
  batchId: string,
  chainId: UniverseChainId,
): Promise<{ status: TradingApi.SwapStatus; txHash?: string } | undefined> {
  const tradingApiChainId = toTradingApiSupportedChainId(chainId)
  if (!tradingApiChainId) {
    return undefined
  }
  try {
    const data = await TradingApiClient.fetchSwaps({
      txHashes: [batchId],
      userOpHashes: [batchId],
      chainId: tradingApiChainId,
    })
    const swaps = data.swaps ?? []
    const best = swaps.reduce<(typeof swaps)[number] | undefined>((bestSoFar, row) => {
      if (!row.status) {
        return bestSoFar
      }
      if (!bestSoFar?.status || SWAP_STATUS_RANK[row.status] > SWAP_STATUS_RANK[bestSoFar.status]) {
        return row
      }
      return bestSoFar
    }, undefined)
    return best?.status ? { status: best.status, txHash: best.txHash } : undefined
  } catch {
    return undefined
  }
}
