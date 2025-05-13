import { Address, createTestClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { concat, keccak256, pad, toHex } from 'viem/utils'

const TEST_WALLET_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

export const ONE_MILLION_USDT = 1_000_000_000_000n

// This client must be in "anvil" mode:
export const anvilClient = createTestClient({
  account: privateKeyToAccount(TEST_WALLET_PRIVATE_KEY),
  chain: mainnet,
  mode: 'anvil',
  transport: http('http://127.0.0.1:8545'),
})

/**
 * For a mapping(address => uint256) at slot `mappingSlot`,
 * the key for `balances[user]` is keccak256(abi.encodePacked(user, mappingSlot)).
 */
function getBalanceSlotKey(user: Address, mappingSlot: number): `0x${string}` {
  // user must be left-padded to 32 bytes, and the slot number must be 32 bytes.
  const paddedUser = pad(user, { size: 32 }) // 32-byte address
  const paddedSlot = pad(`0x${mappingSlot.toString(16)}`, { size: 32 }) // 32-byte slot

  return keccak256(concat([paddedUser, paddedSlot])) as `0x${string}`
}

/**
 * Sets `newBalance` for `user` in the ERC20 at `erc20Address` using Anvil's `anvil_setStorageAt`.
 *
 * @param erc20Address The ERC20 contract address
 * @param user The address whose balance you want to set
 * @param newBalance Desired balance in wei (BigInt)
 * @param mappingSlot The storage slot number where `_balances` mapping is located.
 */
async function setErc20BalanceViaStorage(
  client: typeof anvilClient,
  erc20Address: Address,
  user: Address,
  newBalance: bigint,
  mappingSlot: number = 0,
) {
  // 1. Compute the correct storage key for user's balance
  const balanceSlotKey = getBalanceSlotKey(user, mappingSlot)

  // 2. Encode `newBalance` as a 32-byte hex
  //    EVM stores uint256 in big-endian 32-byte.
  const encodedBalance = toHex(newBalance, { size: 32 })

  // 3. Call `anvil_setStorageAt` so that `balances[user] = newBalance`.
  //    This is an Anvil *custom* JSON-RPC method (not part of standard Ethereum).
  await client.setStorageAt({
    address: erc20Address,
    index: balanceSlotKey,
    value: encodedBalance,
  })

  // 4. Optionally mine a block to "lock in" the state (some frameworks need it):
  await client.mine({ blocks: 1 })
}

/**
 * Try setting the ERC20 balance using multiple common storage slots
 */
export async function setErc20BalanceWithMultipleSlots(
  client: typeof anvilClient,
  erc20Address: Address,
  user: Address,
  newBalance: bigint,
) {
  // Try common slots used by different ERC20 implementations
  const commonSlots = [0, 1, 2, 3, 9]

  for (const slot of commonSlots) {
    await setErc20BalanceViaStorage(client, erc20Address, user, newBalance, slot)

    // You could add a verification step here to check if it worked
    // For example, call the balanceOf function and see if it returns the expected value
  }
}
