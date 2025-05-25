// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { test as base } from '@playwright/test'
import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { ZERO_ADDRESS } from 'constants/misc'
import { anvilClient, setErc20BalanceWithMultipleSlots } from 'playwright/anvil/utils'
import { DAI, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Address, erc20Abi, publicActions, walletActions } from 'viem'

class WalletError extends Error {
  code?: number
}

export const TEST_WALLET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

const allowedErc20BalanceAddresses = [USDT.address, DAI.address, WETH_ADDRESS(UniverseChainId.Mainnet)]

const anvil = anvilClient
  .extend(publicActions)
  .extend(walletActions)
  .extend((client) => ({
    async getWalletAddress() {
      return TEST_WALLET_ADDRESS
    },
    async setErc20Balance(address: Address, balance: bigint, walletAddress: Address = TEST_WALLET_ADDRESS) {
      if (!allowedErc20BalanceAddresses.includes(address)) {
        throw new Error(`Token ${address} is not allowed. Allowed tokens: ${allowedErc20BalanceAddresses.join(', ')}`)
      }
      await setErc20BalanceWithMultipleSlots(client, address, walletAddress, balance)
    },
    async getErc20Balance(address: Address, owner?: Address) {
      return await client.readContract({
        address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [owner ?? TEST_WALLET_ADDRESS],
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
        const auth = await anvil.account.experimental_signAuthorization({
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
