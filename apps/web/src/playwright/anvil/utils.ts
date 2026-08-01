import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { HexString, isValidHexString } from '@universe/encoding'
import { DAI, USDC, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { normalizeTokenAddressForCache } from 'uniswap/src/utils/currencyId'
import { concat, keccak256, pad, toHex } from 'viem/utils'
import type { Address } from '~/chains'
import { erc20Abi } from '~/chains'
import type { AnvilClient } from '~/playwright/anvil/anvil-manager'
export const ONE_MILLION_USDT = 1_000_000_000_000n

/**
 * WEETH (ether.fi weETH) mainnet address — funded by the dynamic-slippage CreatePosition
 * tests. No canonical constant exists in the repo (it's not in uniswap/src/constants/tokens),
 * so this is the single e2e-side definition.
 */
export const WEETH_ADDRESS: Address = '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee'

/**
 * Balance-mapping storage slots that are KNOWN for specific tokens (verified against
 * mainnet bytecode). Tokens not listed here go through the verified multi-slot probe.
 * Keys are lowercased addresses — look up via `knownBalanceSlotFor()`.
 */
const KNOWN_BALANCE_SLOTS: Record<string, number> = {
  // DAI — `mapping(address => uint256) balanceOf` at slot 2
  [normalizeTokenAddressForCache(DAI.address)]: 2,
  // USDT — `mapping(address => uint256) balances` at slot 2 (slot 0 is the OWNER — a
  // blind write there hands contract ownership to keccak-derived garbage)
  [normalizeTokenAddressForCache(USDT.address)]: 2,
  // USDC proxy — `mapping(address => uint256) balances` at slot 9
  [normalizeTokenAddressForCache(USDC.address)]: 9,
  // WETH — `mapping(address => uint256) balanceOf` at slot 3
  [normalizeTokenAddressForCache(WETH_ADDRESS(UniverseChainId.Mainnet))]: 3,
  // WEETH (ether.fi weETH) — balance mapping at slot 101
  [normalizeTokenAddressForCache(WEETH_ADDRESS)]: 101,
}

/** Known balance-mapping slot for a token, or undefined for tokens that need the verified probe. */
export function knownBalanceSlotFor(erc20Address: Address): number | undefined {
  return KNOWN_BALANCE_SLOTS[normalizeTokenAddressForCache(erc20Address)]
}

/**
 * For a mapping(address => uint256) at slot `mappingSlot`,
 * the key for `balances[user]` is keccak256(abi.encodePacked(user, mappingSlot)).
 */
function getBalanceSlotKey(user: Address, mappingSlot: number): HexString {
  // user must be left-padded to 32 bytes, and the slot number must be 32 bytes.
  const paddedUser = pad(user, { size: 32 }) // 32-byte address
  const paddedSlot = pad(`0x${mappingSlot.toString(16)}`, { size: 32 }) // 32-byte slot

  const hashResult = keccak256(concat([paddedUser, paddedSlot]))
  if (!isValidHexString(hashResult)) {
    throw new Error(`Invalid hex string: ${hashResult}`)
  }
  return hashResult
}

/**
 * The four anvil/ERC20 operations verified balance funding needs, as a narrow seam
 * over the fixture's viem client (unit-testable without a node).
 */
export interface Erc20BalanceRpc {
  /** `eth_getStorageAt` — current value at a storage key (undefined/0x0 both mean empty). */
  getStorageAt(ctx: { address: Address; slot: HexString }): Promise<HexString | undefined>
  /** `anvil_setStorageAt`. */
  setStorageAt(ctx: { address: Address; slot: HexString; value: HexString }): Promise<void>
  /** `balanceOf(user)` via `eth_call` — the source of truth a candidate write is verified against. */
  getErc20Balance(ctx: { erc20Address: Address; user: Address }): Promise<bigint>
  /** Mine one block to lock in the accepted write. */
  mine(): Promise<void>
}

/** Adapts the fixture's viem anvil client to the narrow funding seam. */
export function erc20BalanceRpcFromClient(client: AnvilClient): Erc20BalanceRpc {
  return {
    async getStorageAt({ address, slot }) {
      return await client.getStorageAt({ address, slot })
    },
    async setStorageAt({ address, slot, value }) {
      await client.setStorageAt({ address, index: slot, value })
    },
    async getErc20Balance({ erc20Address, user }) {
      return await client.readContract({
        address: erc20Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [user],
      })
    },
    async mine() {
      await client.mine({ blocks: 1 })
    },
  }
}

const ZERO_WORD = toHex(0n, { size: 32 })

/** Candidate balance-mapping slots for tokens without a known slot (common ERC20 layouts). */
const CANDIDATE_BALANCE_SLOTS = [0, 1, 2, 3, 9]

/**
 * Sets `balances[user] = newBalance` in the ERC20 at `erc20Address` via
 * `anvil_setStorageAt`, VERIFYING every write against `balanceOf`.
 *
 * Probe protocol (set → check → unset): each candidate slot is written, then
 * `balanceOf(user)` is consulted — only a write the token actually reports back is
 * kept; a wrong-slot write is restored to its original value before the next
 * candidate. This replaces the old blind sweep that permanently wrote slots
 * 0/1/2/3/9 for unknown tokens (USDT's slot 0 is its OWNER field).
 *
 * No-ops when `balanceOf` already reports `newBalance` (e.g. state preloaded via
 * `--load-state`) — also the reason a candidate write can be trusted: the pre-state
 * differs from the target, so `balanceOf === newBalance` proves the slot is real.
 *
 * @returns the verified mapping slot, for logging/evidence.
 * @throws when no candidate slot (or the known slot) verifies — silent fallthrough
 * would leave the test funding-less and fail later in a far less obvious way.
 */
export async function setVerifiedErc20Balance({
  rpc,
  erc20Address,
  user,
  newBalance,
  knownSlot,
}: {
  rpc: Erc20BalanceRpc
  erc20Address: Address
  user: Address
  newBalance: bigint
  knownSlot?: number
}): Promise<number | 'already-set'> {
  // Already at the target (preloaded fixture state or an earlier funding call):
  // nothing to write — and writing would make candidate verification ambiguous.
  if ((await rpc.getErc20Balance({ erc20Address, user })) === newBalance) {
    return 'already-set'
  }

  const candidateSlots = knownSlot === undefined ? CANDIDATE_BALANCE_SLOTS : [knownSlot]
  const encodedBalance = toHex(newBalance, { size: 32 })

  for (const mappingSlot of candidateSlots) {
    const slotKey = getBalanceSlotKey(user, mappingSlot)
    const originalValue = await rpc.getStorageAt({ address: erc20Address, slot: slotKey })

    await rpc.setStorageAt({ address: erc20Address, slot: slotKey, value: encodedBalance })

    if ((await rpc.getErc20Balance({ erc20Address, user })) === newBalance) {
      await rpc.mine()
      return mappingSlot
    }

    // Wrong slot — restore what was there so the probe leaves no stray writes.
    await rpc.setStorageAt({ address: erc20Address, slot: slotKey, value: originalValue ?? ZERO_WORD })
  }

  throw new Error(
    `setVerifiedErc20Balance: no balance slot verified for token ${erc20Address} ` +
      `(tried ${candidateSlots.join(', ')}). balanceOf never reflected the written value — ` +
      `add the token's real slot to KNOWN_BALANCE_SLOTS.`,
  )
}

/**
 * Convenience wrapper over `setVerifiedErc20Balance` for callers holding a viem anvil
 * client. Resolves the known slot for the token when the caller doesn't pass one.
 */
export async function setErc20BalanceWithMultipleSlots({
  client,
  erc20Address,
  user,
  newBalance,
  knownSlot,
}: {
  client: AnvilClient
  erc20Address: Address
  user: Address
  newBalance: bigint
  knownSlot?: number
}): Promise<void> {
  await setVerifiedErc20Balance({
    rpc: erc20BalanceRpcFromClient(client),
    erc20Address,
    user,
    newBalance,
    knownSlot: knownSlot ?? knownBalanceSlotFor(erc20Address),
  })
}
