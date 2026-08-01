/**
 * Per-test snapshot/revert lifecycle for the anvil fixture (Node-side Playwright code).
 *
 * anvil snapshot semantics this encodes (verified against anvil 1.7.1):
 * - `evm_revert` CONSUMES the snapshot: it returns `true` once and `false` for a
 *   reused/unknown ID — so every test takes a FRESH snapshot, and the revert result
 *   must be checked, never assumed.
 * - `anvil_reset` drops ALL snapshots (a pre-reset ID makes `evm_revert` error with
 *   "Resource not found") — so reset is strictly the recovery path when a revert
 *   fails, never routine cleanup, and never interleaves with live snapshot IDs.
 * - Recovery resets to the SAME upstream + pinned block (see buildResetForkParams),
 *   not the live tip.
 */

type SnapshotId = `0x${string}`

/**
 * The three anvil operations the lifecycle needs, as a narrow seam over the fixture's
 * viem client + anvil manager (unit-testable without a node).
 */
interface SnapshotLifecycleRpc {
  /** `evm_snapshot` — returns the new snapshot ID. */
  snapshot(): Promise<SnapshotId>
  /** `evm_revert` — resolves anvil's boolean result (false = unknown/consumed ID), rejects on RPC errors. */
  revert(id: SnapshotId): Promise<boolean>
  /** Full re-fork at the pinned block via the manager — recovery only (drops all snapshots). */
  resetFork(): Promise<void>
}

/**
 * Takes the fresh pre-test snapshot. If snapshotting itself fails (e.g. anvil in a
 * wedged state a health check didn't catch), recover by re-forking to the pinned
 * launch state and retry once — the retry failing too is a defect worth failing on.
 */
async function takeTestSnapshot(rpc: SnapshotLifecycleRpc): Promise<SnapshotId> {
  try {
    return await rpc.snapshot()
  } catch (error) {
    console.error('Pre-test snapshot failed, resetting Anvil to the pinned fork and retrying...', error)
    await rpc.resetFork()
    return await rpc.snapshot()
  }
}

/**
 * Restores pre-test chain state after a test: reverts to the test's snapshot and
 * verifies anvil's boolean result. Any failure (revert returned false, or the call
 * errored) falls back to a full pinned re-fork so the NEXT test still starts clean.
 * Returns how state was restored, for logging/evidence.
 */
async function restoreTestSnapshot(rpc: SnapshotLifecycleRpc, id: SnapshotId): Promise<'reverted' | 'reset'> {
  let reverted = false
  try {
    reverted = await rpc.revert(id)
  } catch (error) {
    console.error(`evm_revert(${id}) errored — falling back to a pinned fork reset:`, error)
  }

  if (reverted) {
    return 'reverted'
  }

  console.error(`evm_revert(${id}) did not restore state — resetting Anvil to the pinned fork...`)
  await rpc.resetFork()
  return 'reset'
}

export { restoreTestSnapshot, takeTestSnapshot }
export type { SnapshotId, SnapshotLifecycleRpc }
