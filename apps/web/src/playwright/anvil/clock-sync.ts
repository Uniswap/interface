/**
 * Node-clock → wall-clock sync for the anvil fork (Node-side Playwright code).
 *
 * Why: the fork is pinned to a historical block, so `block.timestamp` starts hours
 * behind wall clock — but the app stamps quotes with wall-clock time (e.g. the Across
 * bridge quoteTimestamp), and contracts like the Across SpokePool revert
 * (`InvalidQuoteTimestamp`, 0xf722177f) when a quote is stamped LATER than
 * `block.timestamp`. Syncing node time to wall clock keeps on-chain time ≥ app time.
 *
 * Anvil 1.7.1 time semantics this encodes (measured, not assumed):
 * - `evm_setNextBlockTimestamp` + mine re-anchors anvil's internal clock offset, so
 *   subsequent blocks track wall clock — one sync per boot/re-fork is enough while
 *   the chain moves forward.
 * - `evm_revert` REWINDS the clock offset to the snapshot point: after a revert the
 *   node lags wall clock by however long the snapshot was held. With per-test
 *   snapshot/revert isolation that lag accumulates across a run (minutes by the last
 *   spec), so the per-test boundary must ALSO re-sync — see fixtures/anvil.ts.
 * - Time never moves backward: a sync target at or before the current block
 *   timestamp is skipped (anvil rejects non-monotonic next-block timestamps).
 */

/**
 * The two anvil operations a clock sync needs, as a narrow seam over the fixture's
 * viem client (unit-testable without a node).
 */
interface ClockSyncRpc {
  /** `eth_getBlockByNumber(latest)` → its timestamp (seconds). */
  getLatestBlockTimestamp(): Promise<bigint>
  /** `evm_setNextBlockTimestamp` + mine one block, anchoring the node clock at `timestamp`. */
  mineBlockAt(timestamp: bigint): Promise<void>
}

/**
 * Pure decision: the timestamp (seconds) to anchor the next block at, or undefined
 * when the node is already at/ahead of wall clock (time must never move backward —
 * anvil rejects non-monotonic next-block timestamps).
 */
function computeClockSyncTimestamp(ctx: { blockTimestamp: bigint; wallClockMs: number }): bigint | undefined {
  const wallClockSeconds = BigInt(Math.floor(ctx.wallClockMs / 1000))
  return wallClockSeconds > ctx.blockTimestamp ? wallClockSeconds : undefined
}

/**
 * Syncs the node clock to wall clock: reads the latest block timestamp and, when it
 * lags, mines one block anchored at wall-clock time (which also re-anchors anvil's
 * internal clock offset). Returns how the sync resolved, for logging/evidence.
 * Rejects when the underlying RPC calls fail — callers treat that as an unhealthy node.
 */
async function syncClockToWallClock(rpc: ClockSyncRpc, now: () => number = Date.now): Promise<'synced' | 'current'> {
  const blockTimestamp = await rpc.getLatestBlockTimestamp()
  const target = computeClockSyncTimestamp({ blockTimestamp, wallClockMs: now() })
  if (target === undefined) {
    return 'current'
  }
  await rpc.mineBlockAt(target)
  return 'synced'
}

/** The slice of the viem anvil test client the clock sync adapter needs (structural, avoids an import cycle with anvil-manager). */
interface ClockSyncClient {
  getBlock(): Promise<{ timestamp: bigint }>
  setNextBlockTimestamp(args: { timestamp: bigint }): Promise<void>
  mine(args: { blocks: number }): Promise<void>
}

/** Adapts a viem anvil test client to the narrow clock-sync seam. */
function clockSyncRpcFromClient(client: ClockSyncClient): ClockSyncRpc {
  return {
    async getLatestBlockTimestamp() {
      return (await client.getBlock()).timestamp
    },
    async mineBlockAt(timestamp) {
      await client.setNextBlockTimestamp({ timestamp })
      await client.mine({ blocks: 1 })
    },
  }
}

export { clockSyncRpcFromClient, computeClockSyncTimestamp, syncClockToWallClock }
export type { ClockSyncClient, ClockSyncRpc }
