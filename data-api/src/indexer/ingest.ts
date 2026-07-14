/**
 * Event ingest for the HookSwap Phase-2 indexer.
 *
 * Discovers real v2 pools per chain (onchain.getV2Pairs — factory enumeration + seeded CREATE2, all
 * on-chain-verified with live reserves), records their token metadata (pool_meta), then scans each
 * pool's Swap + Sync logs into SQLite. Everything stored comes from a real on-chain log or read —
 * nothing is fabricated.
 *
 * BACKFILL + TAIL + RESUME:
 *   - First pass for a pool with no cursor starts at `latest - INDEXER_BACKFILL_BLOCKS` (default
 *     200_000), clamped to >= 0. The bounded start is LOGGED (no silent truncation) so it's clear how
 *     far back history goes; a pool's Sync/Swap history before that window is simply absent (metrics
 *     honestly return undefined/empty rather than guessing).
 *   - Scanning is CHUNKED (INDEXER_LOG_CHUNK blocks per eth_getLogs, mirroring onchain.ts's v3 scanner)
 *     and RESUMABLE: after each chunk the cursor is persisted (setCursor = last fully-scanned block),
 *     so an interrupted or restarted process resumes from `cursor + 1` and never rescans/duplicates
 *     (inserts are idempotent via INSERT OR IGNORE anyway).
 *   - The tail loop (startIngestLoop) re-runs runIngestOnce on an interval; each pass only scans
 *     cursor+1..latest, i.e. new blocks since the previous pass.
 *
 * Error policy: per-chain and per-pool work is wrapped so a single bad RPC/pool never aborts the pass
 * — runIngestOnce always resolves (never throws out of the loop).
 */

import { ethers } from 'ethers'
import { getProvider, getV2Pairs } from '../onchain'
import { supportedChainIds } from '../chains'
import {
  getCursor,
  getDb,
  insertSwapEvents,
  insertSyncEvents,
  setCursor,
  SwapEventRow,
  SyncEventRow,
  upsertPoolMeta,
} from './schema'
import { parseSwapLog, parseSyncLog, SWAP_TOPIC, SYNC_TOPIC } from './abis'

/** Blocks per eth_getLogs window. Public RPCs commonly cap ranges; 9_500 matches onchain.ts's v3 scanner. */
const INDEXER_LOG_CHUNK = 9_500

/** How far back the FIRST scan of a never-seen pool reaches (blocks). Overridable via env. */
function backfillBlocks(): number {
  const env = process.env.INDEXER_BACKFILL_BLOCKS
  if (env && /^\d+$/.test(env.trim())) {
    return Number(env.trim())
  }
  return 200_000
}

/**
 * Effective set of chainIds to ingest this pass. `INDEXER_CHAINS` (comma-separated chainIds, e.g.
 * `4663` for Robinhood-only) SCOPES ingest to just those chains, intersected with the supported set —
 * this lets prod index only Robinhood without hammering all 6 public RPCs. Unset/blank/all-invalid →
 * the full supported set (unchanged default behavior). Error-safe: bad tokens are ignored, never throw.
 */
function ingestChainIds(): number[] {
  const supported = supportedChainIds()
  const env = process.env.INDEXER_CHAINS
  if (!env || !env.trim()) {
    return supported
  }
  const requested = env
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map(Number)
  const filtered = supported.filter((id) => requested.includes(id))
  // If the env named only unsupported/invalid ids, fall back to all supported (never ingest nothing
  // silently due to a typo). The effective set is logged by the caller.
  return filtered.length > 0 ? filtered : supported
}

/** Per-pass ingest result (rows NEWLY inserted this pass). */
export interface IngestPoolResult {
  chainId: number
  pool: string
  swaps: number
  syncs: number
}

/**
 * Fetch (and cache) the unix-second timestamp for a set of block numbers on one chain. Block numbers
 * are unique within a chain, so the cache is keyed by block number only. Failed fetches are simply
 * left out of the cache (the caller skips any row whose block timestamp is unavailable rather than
 * storing a fabricated time).
 */
async function loadBlockTimestamps(
  provider: ethers.providers.JsonRpcProvider,
  blocks: number[],
  cache: Map<number, number>,
): Promise<void> {
  const missing = Array.from(new Set(blocks)).filter((b) => !cache.has(b))
  await Promise.all(
    missing.map(async (b) => {
      try {
        const blk = await provider.getBlock(b)
        if (blk && typeof blk.timestamp === 'number') {
          cache.set(b, blk.timestamp)
        }
      } catch {
        // RPC hiccup — leave uncached; rows for this block are skipped (never timestamped with a fake).
      }
    }),
  )
}

/**
 * Resolve the tx-origin EOA (`tx.from`) for a set of transaction hashes — the REAL trader wallet, which
 * the v2 Swap event does NOT carry (Swap.sender = router, Swap.to = next-hop recipient; see schema.ts).
 * One `getTransaction` per unique hash (multi-hop swaps share a tx → deduped by the Set), cached across
 * chunks/pools. Failed lookups are simply left out of the cache (the caller leaves origin='' rather than
 * fabricating an address). Never throws.
 */
async function loadTxOrigins(
  provider: ethers.providers.JsonRpcProvider,
  txHashes: string[],
  cache: Map<string, string>,
): Promise<void> {
  const missing = Array.from(new Set(txHashes)).filter((h) => !cache.has(h))
  await Promise.all(
    missing.map(async (h) => {
      try {
        const tx = await provider.getTransaction(h)
        if (tx && typeof tx.from === 'string' && tx.from) {
          cache.set(h, tx.from.toLowerCase())
        }
      } catch {
        // RPC hiccup — leave uncached; the row's origin stays '' (never a fabricated address).
      }
    }),
  )
}

/**
 * Scan one pool's Swap+Sync logs from `startBlock`..`latest`, chunked + resumable. Returns the count
 * of rows newly inserted. Never throws (caller-safe); on a chunk error it logs and stops this pool's
 * pass at the last good cursor (resumes next pass).
 */
async function ingestPool(
  provider: ethers.providers.JsonRpcProvider,
  chainId: number,
  pool: string,
  startBlock: number,
  latest: number,
  tsCache: Map<number, number>,
  originCache: Map<string, string>,
): Promise<{ swaps: number; syncs: number }> {
  const db = getDb()
  let swaps = 0
  let syncs = 0
  let start = startBlock
  while (start <= latest) {
    const end = Math.min(start + INDEXER_LOG_CHUNK - 1, latest)
    let logs: ethers.providers.Log[]
    try {
      // topic0 = Swap OR Sync (single getLogs call), filtered to this pool address.
      logs = await provider.getLogs({
        address: pool,
        topics: [[SWAP_TOPIC, SYNC_TOPIC]],
        fromBlock: start,
        toBlock: end,
      })
    } catch (err) {
      // RPC rejected this range — stop here; cursor stays at the last persisted block so we resume.
      // eslint-disable-next-line no-console
      console.warn(`[indexer] chain ${chainId} pool ${pool} getLogs ${start}-${end} failed; resuming next pass`, err)
      break
    }

    // Batch-resolve timestamps for every block appearing in this chunk (cached across chunks/pools).
    await loadBlockTimestamps(provider, logs.map((l) => l.blockNumber), tsCache)
    // Batch-resolve tx.from (trader EOA) for the SWAP logs in this chunk (cached across chunks/pools).
    await loadTxOrigins(
      provider,
      logs.filter((l) => l.topics[0] === SWAP_TOPIC).map((l) => l.transactionHash),
      originCache,
    )

    const swapRows: SwapEventRow[] = []
    const syncRows: SyncEventRow[] = []
    for (const log of logs) {
      const ts = tsCache.get(log.blockNumber)
      if (ts === undefined) {
        // No honest timestamp for this block — skip (never store a fabricated time).
        continue
      }
      if (log.topics[0] === SWAP_TOPIC) {
        const p = parseSwapLog(log)
        if (p) {
          // tx.from (lowercased) is the real trader EOA; '' when the RPC lookup failed (never faked).
          const origin = originCache.get(log.transactionHash) ?? ''
          swapRows.push({ chainId, pool, blockNumber: log.blockNumber, timestamp: ts, origin, ...p })
        }
      } else if (log.topics[0] === SYNC_TOPIC) {
        const p = parseSyncLog(log)
        if (p) {
          syncRows.push({ chainId, pool, blockNumber: log.blockNumber, timestamp: ts, ...p })
        }
      }
    }

    swaps += insertSwapEvents(db, swapRows)
    syncs += insertSyncEvents(db, syncRows)

    // Persist progress AFTER the chunk is committed → resumable, idempotent.
    setCursor(db, chainId, pool, end)
    start = end + 1
  }
  return { swaps, syncs }
}

/**
 * One full ingest pass across all supported chains. Discovers pools (getV2Pairs), records pool_meta,
 * then backfills/tails each pool's Swap+Sync logs. Error-safe per chain and per pool — always resolves.
 */
export async function runIngestOnce(): Promise<IngestPoolResult[]> {
  const db = getDb()
  const results: IngestPoolResult[] = []
  const backfill = backfillBlocks()

  const chainIds = ingestChainIds()
  // eslint-disable-next-line no-console
  console.log(`[indexer] ingesting chains: ${chainIds.join(', ')}${process.env.INDEXER_CHAINS ? ` (INDEXER_CHAINS=${process.env.INDEXER_CHAINS})` : ' (all supported)'}`)

  for (const chainId of chainIds) {
    // Per-chain block-timestamp cache (block numbers are unique within a chain).
    const tsCache = new Map<number, number>()
    // Per-chain tx-origin cache (txHash → tx.from), so multi-hop swaps sharing a tx resolve once.
    const originCache = new Map<string, string>()
    try {
      const provider = getProvider(chainId)
      const latest = await provider.getBlockNumber()
      const pairs = await getV2Pairs(chainId)

      for (const pair of pairs) {
        const pool = pair.pairAddress.toLowerCase()
        try {
          // Record real on-chain token metadata for the pool (used by the metrics layer's decimals).
          upsertPoolMeta(db, {
            chainId,
            pool,
            token0: pair.token0.address,
            token1: pair.token1.address,
            decimals0: pair.token0.decimals,
            decimals1: pair.token1.decimals,
            symbol0: pair.token0.symbol,
            symbol1: pair.token1.symbol,
          })

          const cursor = getCursor(db, chainId, pool)
          let start: number
          if (cursor !== undefined) {
            start = cursor + 1
          } else {
            start = Math.max(0, latest - backfill)
            // eslint-disable-next-line no-console
            console.log(
              `[indexer] chain ${chainId} pool ${pool}: first scan bounded to blocks ${start}-${latest} (INDEXER_BACKFILL_BLOCKS=${backfill}); earlier history not indexed`,
            )
          }
          if (start > latest) {
            results.push({ chainId, pool, swaps: 0, syncs: 0 })
            continue
          }

          const { swaps, syncs } = await ingestPool(provider, chainId, pool, start, latest, tsCache, originCache)
          results.push({ chainId, pool, swaps, syncs })
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[indexer] chain ${chainId} pool ${pool} ingest failed (skipped)`, err)
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[indexer] chain ${chainId} pass failed (skipped)`, err)
    }
  }
  return results
}

let loopStarted = false

/**
 * Start the tail ingest loop: run runIngestOnce, then reschedule `intervalMs` after it finishes
 * (self-scheduling — never overlaps a slow pass). Catches all errors. Idempotent (starts once).
 */
export function startIngestLoop(intervalMs = 60_000): void {
  if (loopStarted) {
    return
  }
  loopStarted = true
  const tick = async (): Promise<void> => {
    try {
      const res = await runIngestOnce()
      const totalSwaps = res.reduce((n, r) => n + r.swaps, 0)
      const totalSyncs = res.reduce((n, r) => n + r.syncs, 0)
      // eslint-disable-next-line no-console
      console.log(`[indexer] pass complete: ${res.length} pools, +${totalSwaps} swaps, +${totalSyncs} syncs`)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[indexer] runIngestOnce threw (unexpected — loop continues)', err)
    } finally {
      setTimeout(() => {
        void tick()
      }, intervalMs)
    }
  }
  void tick()
}
