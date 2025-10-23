// biome-ignore lint/style/noRestrictedImports: Anvil test fixtures need direct ethers imports
import { test as base } from '@playwright/test'
import { MaxUint160, MaxUint256, permit2Address } from '@uniswap/permit2-sdk'
import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { getAnvilManager } from 'playwright/anvil/anvil-manager'
import { setErc20BalanceWithMultipleSlots } from 'playwright/anvil/utils'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import PERMIT2_ABI from 'uniswap/src/abis/permit2'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { Address, erc20Abi } from 'viem'

class WalletError extends Error {
  code?: number
}

const allowedErc20BalanceAddresses = [USDT.address, DAI.address, WETH_ADDRESS(UniverseChainId.Mainnet)]

// Helper to check if error is a timeout
const isTimeoutError = (error: any): boolean => {
  return (
    error?.message?.includes('timeout') ||
    error?.message?.includes('took too long') ||
    error?.details?.includes('timed out')
  )
}

// Create anvil client with restart capability
const createAnvilClient = () => {
  const client = getAnvilManager().getClient()
  return client.extend((client) => ({
    async getWalletAddress() {
      return TEST_WALLET_ADDRESS
    },
    async setErc20Balance({
      address,
      balance,
      walletAddress = TEST_WALLET_ADDRESS,
    }: {
      address: Address
      balance: bigint
      walletAddress?: Address
    }) {
      if (!allowedErc20BalanceAddresses.includes(address)) {
        throw new Error(`Token ${address} is not allowed. Allowed tokens: ${allowedErc20BalanceAddresses.join(', ')}`)
      }
      await setErc20BalanceWithMultipleSlots({
        client,
        erc20Address: address,
        user: walletAddress,
        newBalance: balance,
      })
    },
    async getErc20Balance(address: Address, owner?: Address) {
      return await client.readContract({
        address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [owner ?? TEST_WALLET_ADDRESS],
      })
    },
    async getErc20Allowance({ address, spender, owner }: { address: Address; spender: Address; owner?: Address }) {
      return await client.readContract({
        address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner ?? TEST_WALLET_ADDRESS, spender],
      })
    },
    async setErc20Allowance({
      address,
      spender,
      owner,
      amount = MaxUint256.toBigInt(),
    }: {
      address: Address
      spender: Address
      owner?: Address
      amount?: bigint
    }) {
      await client.writeContract({
        address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
        account: owner ?? TEST_WALLET_ADDRESS,
      })
    },
    async getPermit2Allowance({ owner, token, spender }: { owner?: Address; token: Address; spender: Address }) {
      const data = await client.readContract({
        address: assume0xAddress(permit2Address(UniverseChainId.Mainnet)),
        abi: PERMIT2_ABI,
        functionName: 'allowance',
        args: [owner ?? TEST_WALLET_ADDRESS, token, spender],
      })

      const [amount, expiration, nonce] = data
      return { amount, expiration, nonce }
    },
    async setPermit2Allowance({
      owner,
      token,
      spender,
      amount = MaxUint160.toBigInt(), // MaxUint160
      expiration = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
    }: {
      owner?: Address
      token: Address
      spender: Address
      amount?: bigint
      expiration?: number
    }) {
      await client.writeContract({
        address: assume0xAddress(permit2Address(UniverseChainId.Mainnet)),
        abi: PERMIT2_ABI,
        functionName: 'approve',
        args: [token, spender, amount, expiration],
        account: owner ?? TEST_WALLET_ADDRESS,
      })
    },
    async setV2PoolReserves({
      pairAddress,
      reserve0,
      reserve1,
    }: {
      pairAddress: Address
      reserve0: bigint
      reserve1: bigint
    }) {
      const blockTimestampLast = Math.floor(Date.now() / 1000)
      // V2 pairs store reserves in slot 8: reserve0 (112 bits) | reserve1 (112 bits) | blockTimestampLast (32 bits)
      const maxUint112 = (1n << 112n) - 1n

      // V2 pairs store blockTimestampLast in slot 8: blockTimestampLast (32 bits)
      const maxUint32 = (1n << 32n) - 1n

      if (blockTimestampLast > maxUint32) {
        throw new Error('Block timestamp must fit in uint32')
      }

      if (reserve0 > maxUint112 || reserve1 > maxUint112) {
        throw new Error('Reserve amounts must fit in uint112')
      }

      // V2 pairs pack three values into a single storage slot:
      // - reserve0: uint112 (bits 0-111)
      // - reserve1: uint112 (bits 112-223)
      // - blockTimestampLast: uint32 (bits 224-255)
      const packedValue =
        (BigInt(blockTimestampLast) << 224n) | // 32 bits for timestamp at the top
        (reserve1 << 112n) | // 112 bits for reserve1 in the middle
        reserve0 // 112 bits for reserve0 at the bottom

      // Set the packed reserves at storage slot 8
      await client.setStorageAt({
        address: pairAddress,
        index: '0x8', // Storage slot 8 where reserves are stored
        value: `0x${packedValue.toString(16).padStart(64, '0')}`,
      })

      await client.mine({ blocks: 1 })
    },
    async setTransactionRejection() {
      // Override the wallet actions to reject transactions
      const originalRequest = client.request
      client.request = async function (this: typeof client, ...args) {
        const [{ method }] = args
        if (method === 'eth_sendTransaction' || method === 'eth_sendRawTransaction') {
          const error = new WalletError('User rejected the transaction')
          error.code = 4001
          throw error
        }
        return (originalRequest as any).apply(this, args) as ReturnType<typeof originalRequest>
      } as typeof originalRequest
    },
    /**
     * Take a snapshot of the current blockchain state and return the snapshot ID
     * This is useful for test isolation - take snapshot at beginning of test, revert at end
     */
    async takeSnapshot() {
      return await client.snapshot()
    },
    /**
     * Revert to a previously taken snapshot
     * @param snapshotId - The ID returned from takeSnapshot()
     */
    async revertToSnapshot(snapshotId: `0x${string}`) {
      await client.revert({ id: snapshotId })
    },
    /**
     * Advanced state management: take snapshot, run function, then revert
     * This ensures the function runs in isolation without affecting the blockchain state
     * @param fn - Function to run in isolation
     */
    async withSnapshot<T>(fn: () => Promise<T>): Promise<T> {
      const snapshotId = await client.snapshot()
      try {
        return await fn()
      } finally {
        await client.revert({ id: snapshotId })
      }
    },
  }))
}

export const test = base.extend<{ anvil: AnvilClient; delegateToZeroAddress?: void }>({
  // biome-ignore lint/correctness/noEmptyPattern: it's ok here
  async anvil({}, use) {
    // Ensure Anvil is running and healthy
    if (!(await getAnvilManager().ensureHealthy())) {
      throw new Error('Failed to ensure Anvil is healthy for test')
    }

    // Get fresh client for this test
    const testAnvil = createAnvilClient()

    // Take snapshot for test isolation
    let snapshotId: `0x${string}` | undefined
    try {
      snapshotId = await testAnvil.snapshot()
    } catch (error) {
      if (isTimeoutError(error)) {
        // Anvil timed out during snapshot, restart and retry
        console.error('Snapshot timeout, restarting Anvil...')
        if (await getAnvilManager().restart()) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          snapshotId = await testAnvil.snapshot()
        } else {
          throw new Error('Failed to restart Anvil after snapshot timeout')
        }
      } else {
        throw error
      }
    }

    // Run the test
    await use(testAnvil)

    // Cleanup with auto-recovery
    try {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (snapshotId) {
        await testAnvil.revert({ id: snapshotId })
      } else {
        await testAnvil.reset()
      }
    } catch (error) {
      if (isTimeoutError(error)) {
        console.error('Cleanup timeout, marking Anvil for restart...')
        // Don't restart here - let the next test handle it
        // This avoids race conditions between parallel tests
      } else {
        console.error('Cleanup failed:', error)
        try {
          await testAnvil.reset()
        } catch (resetError) {
          console.error('Reset also failed:', resetError)
        }
      }
    }
  },
  // Delegate the test wallet to the zero address to avoid any smart wallet conflicts
  delegateToZeroAddress: [
    async ({ anvil }, use) => {
      try {
        const originalBalance = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
        const nonce = await anvil.getTransactionCount({
          address: TEST_WALLET_ADDRESS,
        })
        const auth = await anvil.account.signAuthorization({
          contractAddress: ZERO_ADDRESS,
          chainId: anvil.chain.id,
          nonce: nonce + 1,
        })
        await anvil.sendTransaction({
          authorizationList: [auth],
          to: TEST_WALLET_ADDRESS,
        })
        // Reset the wallet to the original balance because tests might rely on that
        await anvil.setBalance({ address: TEST_WALLET_ADDRESS, value: originalBalance })
        await use(undefined)
      } catch (_e) {
        await use(undefined)
      }
    },
    { auto: true },
  ],
})

export type AnvilClient = ReturnType<typeof createAnvilClient>
