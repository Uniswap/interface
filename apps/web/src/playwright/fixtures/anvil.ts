/* oxlint-disable react-hooks/rules-of-hooks -- Playwright fixtures use `use()` which is not a React hook */
// oxlint-disable-next-line no-restricted-imports -- Anvil test fixtures need direct ethers imports
import { test as base } from '@playwright/test'
import { MaxUint160, MaxUint256, permit2Address } from '@uniswap/permit2-sdk'
import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import PERMIT2_ABI from 'uniswap/src/abis/permit2'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, USDC, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { normalizeTokenAddressForCache } from 'uniswap/src/utils/currencyId'
import { mainnet } from 'viem/chains'
import { type Address, erc20Abi } from '~/chains'
import type { AnvilClient as BaseAnvilClient } from '~/playwright/anvil/anvil-manager'
import { getAnvilManager } from '~/playwright/anvil/anvil-manager'
import { clockSyncRpcFromClient, syncClockToWallClock } from '~/playwright/anvil/clock-sync'
import type { SnapshotId, SnapshotLifecycleRpc } from '~/playwright/anvil/snapshot-lifecycle'
import { restoreTestSnapshot, takeTestSnapshot } from '~/playwright/anvil/snapshot-lifecycle'
import { setErc20BalanceWithMultipleSlots, WEETH_ADDRESS } from '~/playwright/anvil/utils'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { assume0xAddress } from '~/utils/wagmi'

class WalletError extends Error {
  code?: number
}

/**
 * `evm_revert` with the boolean result anvil actually returns (viem's typed `revert`
 * action discards it): `true` = state restored, `false` = unknown/already-consumed
 * snapshot ID. Callers MUST check it — assuming success is how state leaked across
 * tests when snapshots were last enabled.
 *
 * Two snapshot paths share this primitive; the AUTHORITATIVE per-test isolation path
 * is the fixture's snapshot lifecycle (takeTestSnapshot/restoreTestSnapshot, which
 * falls back to a pinned resetFork). The takeSnapshot/revertToSnapshot/withSnapshot
 * helpers below are for extra IN-test scoped state only — they throw on failure and
 * have no reset fallback, so never wire test isolation through them.
 */
async function revertToSnapshotChecked(client: BaseAnvilClient, id: SnapshotId): Promise<boolean> {
  const result: unknown = await client.request({ method: 'evm_revert', params: [id] })
  return result === true
}

const allowedErc20BalanceAddresses = [
  USDT.address,
  USDC.address,
  DAI.address,
  WETH_ADDRESS(UniverseChainId.Mainnet),
  WEETH_ADDRESS,
].map((address) => normalizeTokenAddressForCache(address))

// Create anvil client with restart capability
const createAnvilClient = () => {
  const client: BaseAnvilClient = getAnvilManager().getClient()
  const helpers = {
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
      if (!allowedErc20BalanceAddresses.includes(normalizeTokenAddressForCache(address))) {
        throw new Error(`Token ${address} is not allowed. Allowed tokens: ${allowedErc20BalanceAddresses.join(', ')}`)
      }
      // Known slots (DAI/USDT/WETH/WEETH) are resolved inside; unknown tokens go
      // through the verified multi-slot probe (see playwright/anvil/utils.ts).
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
        chain: mainnet,
        maxFeePerGas: 100000000000n,
        maxPriorityFeePerGas: 1000000000n,
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
        chain: mainnet,
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
    /**
     * @deprecated
     * Wagmi submits transactions to Anvil via the RPC interface so this function no longer intercepts
     * the requests. Use createRejectableMockConnector instead.
     */
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
     * Take a snapshot of the current blockchain state and return the snapshot ID.
     * NOTE: `evm_revert` consumes the snapshot — an ID reverts successfully once.
     *
     * The AUTHORITATIVE per-test isolation path is the fixture's own lifecycle below
     * (takeTestSnapshot/restoreTestSnapshot, ~/playwright/anvil/snapshot-lifecycle.ts);
     * these helpers exist for extra IN-test scoped state and always nest within it.
     */
    async takeSnapshot() {
      return await client.snapshot()
    },
    /**
     * Revert to a previously taken snapshot, verifying anvil actually restored state.
     * @param snapshotId - The ID returned from takeSnapshot()
     * @throws when the snapshot ID is unknown or already consumed (state NOT restored)
     */
    async revertToSnapshot(snapshotId: SnapshotId) {
      if (!(await revertToSnapshotChecked(client, snapshotId))) {
        throw new Error(`evm_revert(${snapshotId}) did not restore state (unknown or already-consumed snapshot)`)
      }
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
        await helpers.revertToSnapshot(snapshotId)
      }
    },
  }
  return Object.assign(client, helpers)
}

export const test = base.extend<{ anvil: AnvilClient; delegateToZeroAddress?: void }>({
  // oxlint-disable-next-line no-empty-pattern -- it's ok here
  async anvil({}, use) {
    // Ensure Anvil is running and healthy. Recovery (relaunch, session refresh,
    // adopting a survivor node) happens ONLY here at the test boundary — anvil is
    // never restarted mid-test, so snapshot IDs stay valid for the whole test.
    if (!(await getAnvilManager().ensureHealthy())) {
      throw new Error('Failed to ensure Anvil is healthy for test')
    }

    // Get fresh client for this test
    const testAnvil = createAnvilClient()

    const lifecycleRpc: SnapshotLifecycleRpc = {
      snapshot: () => testAnvil.snapshot(),
      revert: (id) => revertToSnapshotChecked(testAnvil, id),
      // Recovery re-fork: SAME upstream + pinned block (a bare anvil_reset would
      // silently re-fork at the live tip). Drops all snapshots, hence recovery-only.
      resetFork: () => getAnvilManager().resetFork(),
    }

    // Clock sync EVERY boundary, before the snapshot: evm_revert rewinds anvil's
    // internal clock offset to the snapshot point, so node time falls behind wall
    // clock by the previous test's duration and the lag would accumulate across the
    // run (breaking wall-clock-stamped quotes like the Across bridge deposit).
    // Re-anchoring here bounds the lag within any test to that test's own runtime.
    await syncClockToWallClock(clockSyncRpcFromClient(testAnvil))

    // State isolation: a FRESH snapshot every test — evm_revert consumes snapshot
    // IDs, so an ID from an earlier test can never be reused.
    const snapshotId = await takeTestSnapshot(lifecycleRpc)

    // Run the test
    await use(testAnvil)

    // Check anvil health status
    const isHealthy = await getAnvilManager().isHealthy()
    if (!isHealthy) {
      console.error('Anvil is not healthy after test, stopping...')
      // Don't restart here - let the next test's ensureHealthy() relaunch it at the
      // pinned fork state. This avoids race conditions between parallel tests.
      await getAnvilManager().stop()
      return
    }

    // Restore pre-test state, verifying the revert actually happened; a failed
    // revert falls back to a full pinned re-fork so the next test starts clean.
    await restoreTestSnapshot(lifecycleRpc, snapshotId)
  },
  // Delegate the test wallet to the zero address to avoid any smart wallet conflicts.
  // Fails the test loudly when the delegation cannot land — silently proceeding used
  // to leave the wallet in an unknown delegation state and tests failing later in
  // far less obvious ways.
  delegateToZeroAddress: [
    async ({ anvil }, use) => {
      try {
        const originalBalance = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
        const nonce = await anvil.getTransactionCount({
          address: TEST_WALLET_ADDRESS,
        })
        // The client's hoisted account is the LOCAL test-wallet account, which can
        // sign authorizations. Passing TEST_WALLET_ADDRESS here (as this fixture
        // used to) parses as a json-rpc account and ALWAYS threw
        // AccountTypeNotSupportedError — invisible while this fixture swallowed
        // errors, so no test ever actually ran with the delegation cleared.
        if (!anvil.account) {
          throw new Error('anvil client has no hoisted local account to sign the 7702 authorization')
        }
        const auth = await anvil.signAuthorization({
          account: anvil.account,
          contractAddress: ZERO_ADDRESS,
          chainId: anvil.chain?.id,
          nonce: nonce + 1,
        })
        await anvil.sendTransaction({
          authorizationList: [auth],
          to: TEST_WALLET_ADDRESS,
          account: TEST_WALLET_ADDRESS,
          chain: mainnet,
        })
        // Reset the wallet to the original balance because tests might rely on that
        await anvil.setBalance({ address: TEST_WALLET_ADDRESS, value: originalBalance })
      } catch (error) {
        throw new Error('delegateToZeroAddress fixture failed to delegate the test wallet', { cause: error })
      }
      await use(undefined)
    },
    { auto: true },
  ],
})

export type AnvilClient = BaseAnvilClient & ReturnType<typeof createAnvilClient>
