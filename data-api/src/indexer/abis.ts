/**
 * v2 pair event ABIs + topic hashes + typed parse helpers for the HookSwap Phase-2 indexer.
 *
 * Mirrors the v3 `PoolCreated` pattern in ../onchain.ts (ethers v5 `Interface` + `getEventTopic`).
 * A UniswapV2 pair emits exactly two events we care about for prices/volume:
 *   - Swap(sender, amount0In, amount1In, amount0Out, amount1Out, to) — realized trade amounts.
 *   - Sync(reserve0, reserve1) — the pool's reserves AFTER every mint/burn/swap (the price source).
 * Both are canonical UniswapV2Pair events; HookSwap's v2 factory deploys canonical pair bytecode
 * (init-code hash verified == canonical, CLAUDE.md 2026-07-03 / 07-08), so these signatures match
 * on every HookSwap chain.
 *
 * The parse helpers return the schema row shapes MINUS the fields the ingest layer fills from context:
 * `chainId` + `pool` (the scan target) and `blockNumber` + `timestamp` (from the log / block header).
 * Big integers are returned as decimal strings (never JS numbers) to preserve uint112/uint256 exactly.
 */

import { BigNumber, ethers } from 'ethers'
import { SwapEventRow, SyncEventRow } from './schema'

// Canonical UniswapV2Pair event signatures (indexed topics: Swap.sender, Swap.to).
const V2_PAIR_EVENT_ABI = [
  'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
  'event Sync(uint112 reserve0, uint112 reserve1)',
]

/** ethers Interface for the two v2 pair events (used for topic derivation + log parsing). */
export const v2PairIface = new ethers.utils.Interface(V2_PAIR_EVENT_ABI)

/** topic0 for the Swap event (verified against ethers at build time via getEventTopic). */
export const SWAP_TOPIC = v2PairIface.getEventTopic('Swap')
/** topic0 for the Sync event. */
export const SYNC_TOPIC = v2PairIface.getEventTopic('Sync')

/** Swap fields derivable from the log alone — ingest adds chainId/pool/blockNumber/timestamp. */
export type ParsedSwap = Omit<SwapEventRow, 'chainId' | 'pool' | 'blockNumber' | 'timestamp'>
/** Sync fields derivable from the log alone — ingest adds chainId/pool/blockNumber/timestamp. */
export type ParsedSync = Omit<SyncEventRow, 'chainId' | 'pool' | 'blockNumber' | 'timestamp'>

/**
 * Parse a raw log as a v2 Swap. Returns undefined if the log isn't a well-formed Swap (never throws,
 * never fabricates). `logIndex`/`txHash` come straight off the log; amounts are exact decimal strings.
 */
export function parseSwapLog(log: ethers.providers.Log): ParsedSwap | undefined {
  try {
    const parsed = v2PairIface.parseLog(log)
    if (parsed.name !== 'Swap') {
      return undefined
    }
    return {
      logIndex: log.logIndex,
      txHash: log.transactionHash,
      sender: parsed.args.sender as string,
      recipient: parsed.args.to as string,
      amount0In: (parsed.args.amount0In as BigNumber).toString(),
      amount1In: (parsed.args.amount1In as BigNumber).toString(),
      amount0Out: (parsed.args.amount0Out as BigNumber).toString(),
      amount1Out: (parsed.args.amount1Out as BigNumber).toString(),
    }
  } catch {
    return undefined
  }
}

/**
 * Parse a raw log as a v2 Sync. Returns undefined if the log isn't a well-formed Sync (never throws,
 * never fabricates). Reserves are exact decimal strings (uint112).
 */
export function parseSyncLog(log: ethers.providers.Log): ParsedSync | undefined {
  try {
    const parsed = v2PairIface.parseLog(log)
    if (parsed.name !== 'Sync') {
      return undefined
    }
    return {
      logIndex: log.logIndex,
      reserve0: (parsed.args.reserve0 as BigNumber).toString(),
      reserve1: (parsed.args.reserve1 as BigNumber).toString(),
    }
  } catch {
    return undefined
  }
}
