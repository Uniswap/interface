import { concat, keccak256, pad, toHex } from 'viem/utils'
import { describe, expect, it } from 'vitest'
import type { Address } from '~/chains'
import type { Erc20BalanceRpc } from '~/playwright/anvil/utils'
import { knownBalanceSlotFor, setVerifiedErc20Balance } from '~/playwright/anvil/utils'

const TOKEN = '0x1000000000000000000000000000000000000001' as Address
const USER = '0x2000000000000000000000000000000000000002' as Address

/** Independent slot-key derivation (the solidity mapping layout spec). */
function slotKeyFor(user: Address, mappingSlot: number): string {
  return keccak256(concat([pad(user, { size: 32 }), pad(`0x${mappingSlot.toString(16)}`, { size: 32 })]))
}

/**
 * In-memory ERC20 whose balances mapping REALLY lives at `realSlot` — balanceOf only
 * reflects writes landing on that slot's keys, exactly like a live token.
 */
function fakeToken(realSlot: number) {
  const storage = new Map<string, `0x${string}`>()
  const writes: string[] = []
  let mineCount = 0

  const rpc: Erc20BalanceRpc = {
    getStorageAt: async ({ slot }) => storage.get(slot),
    setStorageAt: async ({ slot, value }) => {
      writes.push(slot)
      storage.set(slot, value)
    },
    getErc20Balance: async ({ user }) => BigInt(storage.get(slotKeyFor(user, realSlot)) ?? 0n),
    mine: async () => {
      mineCount++
    },
  }

  return {
    rpc,
    storage,
    writes,
    get mineCount() {
      return mineCount
    },
  }
}

describe('setVerifiedErc20Balance', () => {
  it('probes candidate slots and keeps only the write balanceOf actually reports', async () => {
    const token = fakeToken(2)

    const result = await setVerifiedErc20Balance({ rpc: token.rpc, erc20Address: TOKEN, user: USER, newBalance: 500n })

    expect(result).toBe(2)
    expect(await token.rpc.getErc20Balance({ erc20Address: TOKEN, user: USER })).toBe(500n)
    expect(token.mineCount).toBe(1)
  })

  it('restores wrong-slot probe writes instead of leaving them behind (the old blind sweep)', async () => {
    const token = fakeToken(2)
    // Pre-existing unrelated value where the slot-0 probe will land (e.g. USDT's owner field).
    const slot0Key = slotKeyFor(USER, 0)
    token.storage.set(slot0Key, toHex(123n, { size: 32 }))

    await setVerifiedErc20Balance({ rpc: token.rpc, erc20Address: TOKEN, user: USER, newBalance: 500n })

    expect(token.storage.get(slot0Key)).toBe(toHex(123n, { size: 32 }))
    // Slots 1 and 3 were never touched before the probe — they must be back to zero.
    expect(BigInt(token.storage.get(slotKeyFor(USER, 1)) ?? 0n)).toBe(0n)
  })

  it('no-ops when balanceOf already reports the target (preloaded --load-state fixture)', async () => {
    const token = fakeToken(2)
    token.storage.set(slotKeyFor(USER, 2), toHex(500n, { size: 32 }))

    const result = await setVerifiedErc20Balance({ rpc: token.rpc, erc20Address: TOKEN, user: USER, newBalance: 500n })

    expect(result).toBe('already-set')
    expect(token.writes).toEqual([])
    expect(token.mineCount).toBe(0)
  })

  it('verifies a known slot instead of trusting it', async () => {
    const token = fakeToken(101)

    const result = await setVerifiedErc20Balance({
      rpc: token.rpc,
      erc20Address: TOKEN,
      user: USER,
      newBalance: 7n,
      knownSlot: 101,
    })

    expect(result).toBe(101)
    expect(await token.rpc.getErc20Balance({ erc20Address: TOKEN, user: USER })).toBe(7n)
  })

  it('throws when a known slot does not verify, restoring the write', async () => {
    const token = fakeToken(2)

    await expect(
      setVerifiedErc20Balance({ rpc: token.rpc, erc20Address: TOKEN, user: USER, newBalance: 7n, knownSlot: 5 }),
    ).rejects.toThrow('no balance slot verified')

    expect(BigInt(token.storage.get(slotKeyFor(USER, 5)) ?? 0n)).toBe(0n)
  })

  it('throws when no candidate slot verifies (token outside the common layouts)', async () => {
    const token = fakeToken(77) // not in the candidate sweep

    await expect(
      setVerifiedErc20Balance({ rpc: token.rpc, erc20Address: TOKEN, user: USER, newBalance: 7n }),
    ).rejects.toThrow("add the token's real slot")

    // Every probe write must have been rolled back.
    for (const slot of [0, 1, 2, 3, 9]) {
      expect(BigInt(token.storage.get(slotKeyFor(USER, slot)) ?? 0n)).toBe(0n)
    }
  })
})

describe('knownBalanceSlotFor', () => {
  it.each([
    ['DAI', '0x6B175474E89094C44Da98b954EedeAC495271d0F', 2],
    ['USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 2],
    ['USDC', '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 9],
    ['WETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 3],
    ['WEETH', '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee', 101],
  ])('resolves %s regardless of address casing', (_symbol, address, slot) => {
    expect(knownBalanceSlotFor(address as Address)).toBe(slot)
    expect(knownBalanceSlotFor(address.toLowerCase() as Address)).toBe(slot)
  })

  it('returns undefined for unknown tokens', () => {
    expect(knownBalanceSlotFor(TOKEN)).toBeUndefined()
  })
})
