import { describe, expect, it } from 'vitest'
import type { ClockSyncClient, ClockSyncRpc } from '~/playwright/anvil/clock-sync'
import { clockSyncRpcFromClient, computeClockSyncTimestamp, syncClockToWallClock } from '~/playwright/anvil/clock-sync'

describe('computeClockSyncTimestamp', () => {
  it('targets wall clock (whole seconds) when the node lags', () => {
    expect(computeClockSyncTimestamp({ blockTimestamp: 1_700_000_000n, wallClockMs: 1_800_000_000_500 })).toBe(
      1_800_000_000n,
    )
  })

  it('never moves time backward: node ahead of wall clock is left alone', () => {
    expect(
      computeClockSyncTimestamp({ blockTimestamp: 1_900_000_000n, wallClockMs: 1_800_000_000_000 }),
    ).toBeUndefined()
  })

  it('skips the sync when the node is exactly at wall clock', () => {
    expect(
      computeClockSyncTimestamp({ blockTimestamp: 1_800_000_000n, wallClockMs: 1_800_000_000_999 }),
    ).toBeUndefined()
  })
})

describe('syncClockToWallClock', () => {
  function fakeRpc(blockTimestamp: bigint): ClockSyncRpc & { minedAt: bigint[] } {
    const minedAt: bigint[] = []
    return {
      minedAt,
      getLatestBlockTimestamp: async () => blockTimestamp,
      mineBlockAt: async (timestamp) => {
        minedAt.push(timestamp)
      },
    }
  }

  it('mines one block anchored at wall clock when the node lags', async () => {
    const rpc = fakeRpc(1_700_000_000n)

    const result = await syncClockToWallClock(rpc, () => 1_800_000_123_456)

    expect(result).toBe('synced')
    expect(rpc.minedAt).toEqual([1_800_000_123n])
  })

  it('does not mine when the node is already current', async () => {
    const rpc = fakeRpc(1_800_000_200n)

    const result = await syncClockToWallClock(rpc, () => 1_800_000_123_456)

    expect(result).toBe('current')
    expect(rpc.minedAt).toEqual([])
  })
})

describe('clockSyncRpcFromClient', () => {
  it('reads the latest block timestamp and mines via evm_setNextBlockTimestamp + mine, in that order', async () => {
    const calls: string[] = []
    const client: ClockSyncClient = {
      getBlock: async () => {
        calls.push('getBlock')
        return { timestamp: 1_234n }
      },
      setNextBlockTimestamp: async ({ timestamp }) => {
        calls.push(`setNextBlockTimestamp:${timestamp}`)
      },
      mine: async ({ blocks }) => {
        calls.push(`mine:${blocks}`)
      },
    }

    const rpc = clockSyncRpcFromClient(client)
    expect(await rpc.getLatestBlockTimestamp()).toBe(1_234n)
    await rpc.mineBlockAt(5_678n)

    expect(calls).toEqual(['getBlock', 'setNextBlockTimestamp:5678', 'mine:1'])
  })
})
