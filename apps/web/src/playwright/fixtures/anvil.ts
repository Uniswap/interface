// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { test as base } from '@playwright/test'
import { anvilClient, setErc20BalanceWithMultipleSlots } from 'playwright/anvil/utils'
import { DAI, USDT } from 'uniswap/src/constants/tokens'
import { Address, erc20Abi, publicActions, walletActions } from 'viem'

class WalletError extends Error {
  code?: number
}

export const TEST_WALLET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

const allowedErc20BalanceAddresses = [USDT.address, DAI.address]

const anvil = anvilClient
  .extend(publicActions)
  .extend(walletActions)
  .extend((client) => ({
    async getWalletAddress() {
      return TEST_WALLET_ADDRESS
    },
    async setErc20Balance(address: Address, balance: bigint) {
      if (!allowedErc20BalanceAddresses.includes(address)) {
        throw new Error(`Token ${address} is not allowed. Allowed tokens: ${allowedErc20BalanceAddresses.join(', ')}`)
      }
      await setErc20BalanceWithMultipleSlots(client, address, TEST_WALLET_ADDRESS, balance)
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

export const test = base.extend<{ anvil: typeof anvil }>({
  // eslint-disable-next-line no-empty-pattern
  async anvil({}, use) {
    await use(anvil)
    await anvil.reset()
  },
})
