import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SnapshotId, SnapshotLifecycleRpc } from '~/playwright/anvil/snapshot-lifecycle'
import { restoreTestSnapshot, takeTestSnapshot } from '~/playwright/anvil/snapshot-lifecycle'

// The recovery paths under test log their diagnosis via console.error by design
// (Node-side Playwright runner code); keep jest-fail-on-console out of the way.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
})

/** In-memory fake with anvil 1.7.1 semantics: revert consumes IDs, reset drops all of them. */
function createFakeAnvil(): SnapshotLifecycleRpc & { calls: string[]; failNextSnapshot: () => void } {
  let nextId = 0
  let live = new Set<SnapshotId>()
  let snapshotShouldFail = false
  const calls: string[] = []

  return {
    calls,
    failNextSnapshot() {
      snapshotShouldFail = true
    },
    async snapshot() {
      calls.push('snapshot')
      if (snapshotShouldFail) {
        snapshotShouldFail = false
        throw new Error('anvil wedged')
      }
      const id = `0x${(nextId++).toString(16)}` as SnapshotId
      live.add(id)
      return id
    },
    async revert(id) {
      calls.push(`revert:${id}`)
      if (!live.has(id)) {
        return false
      }
      live.delete(id)
      return true
    },
    async resetFork() {
      calls.push('resetFork')
      live = new Set()
    },
  }
}

describe('takeTestSnapshot', () => {
  it('returns a fresh snapshot id per test', async () => {
    const anvil = createFakeAnvil()
    const first = await takeTestSnapshot(anvil)
    const second = await takeTestSnapshot(anvil)
    expect(first).not.toBe(second)
  })

  it('recovers a failed snapshot with a pinned fork reset, then retries once', async () => {
    const anvil = createFakeAnvil()
    anvil.failNextSnapshot()
    const id = await takeTestSnapshot(anvil)
    expect(id).toBe('0x0')
    expect(anvil.calls).toEqual(['snapshot', 'resetFork', 'snapshot'])
  })

  it('surfaces the failure when the post-reset retry also fails', async () => {
    const anvil = createFakeAnvil()
    const failing: SnapshotLifecycleRpc = {
      ...anvil,
      snapshot: async () => {
        throw new Error('still wedged')
      },
    }
    await expect(takeTestSnapshot(failing)).rejects.toThrow('still wedged')
  })
})

describe('restoreTestSnapshot', () => {
  it('reverts to the snapshot and reports it, without resetting', async () => {
    const anvil = createFakeAnvil()
    const id = await takeTestSnapshot(anvil)
    await expect(restoreTestSnapshot(anvil, id)).resolves.toBe('reverted')
    expect(anvil.calls).not.toContain('resetFork')
  })

  it('falls back to a pinned fork reset when revert returns false (consumed id)', async () => {
    const anvil = createFakeAnvil()
    const id = await takeTestSnapshot(anvil)
    await restoreTestSnapshot(anvil, id) // consumes the snapshot
    await expect(restoreTestSnapshot(anvil, id)).resolves.toBe('reset')
    expect(anvil.calls.filter((call) => call === 'resetFork')).toHaveLength(1)
  })

  it('falls back to a pinned fork reset when revert errors (id dropped by anvil_reset)', async () => {
    const anvil = createFakeAnvil()
    const erroring: SnapshotLifecycleRpc = {
      ...anvil,
      revert: async () => {
        // anvil answers evm_revert for a pre-reset id with a "Resource not found" RPC error
        throw new Error('Resource not found')
      },
    }
    await expect(restoreTestSnapshot(erroring, '0x0')).resolves.toBe('reset')
    expect(anvil.calls).toContain('resetFork')
  })

  it('keeps each test isolated across a snapshot/mutate/revert sequence', async () => {
    const anvil = createFakeAnvil()
    for (let i = 0; i < 5; i++) {
      const id = await takeTestSnapshot(anvil)
      await expect(restoreTestSnapshot(anvil, id)).resolves.toBe('reverted')
    }
    expect(anvil.calls).not.toContain('resetFork')
  })
})
