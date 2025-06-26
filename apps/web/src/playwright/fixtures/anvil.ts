// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { test as base } from '@playwright/test'
import { MaxUint160, MaxUint256, permit2Address } from '@uniswap/permit2-sdk'
import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { anvilClient, setErc20BalanceWithMultipleSlots } from 'playwright/anvil/utils'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import PERMIT2_ABI from 'uniswap/src/abis/permit2'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { Address, erc20Abi, publicActions, walletActions } from 'viem'

class WalletError extends Error {
  code?: number
}

const allowedErc20BalanceAddresses = [USDT.address, DAI.address, WETH_ADDRESS(UniverseChainId.Mainnet)]

const anvil = anvilClient
  .extend(publicActions)
  .extend(walletActions)
  .extend((client) => ({
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
  }))

export const test = base.extend<{ anvil: typeof anvil; delegateToZeroAddress?: typeof anvil }>({
  // eslint-disable-next-line no-empty-pattern
  async anvil({}, use) {
    await use(anvil)
    await anvil.reset().catch(() => {
      // eslint-disable-next-line no-console
      console.error('👉 Anvil is not running. Start it by running `yarn web anvil:mainnet`')
    })
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
        await use(anvil)
      } catch (e) {
        await use(undefined)
      }
    },
    { auto: true },
  ],
})
