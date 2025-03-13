// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { test as base } from '@playwright/test'
import { Address, createTestClient, erc20Abi, http, publicActions, walletActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const TEST_WALLET_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
export const TEST_WALLET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

const WHALES: Address[] = [
  '0x72a53cdbbcc1b9efa39c834a540550e23463aacb',
  '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503',
  '0x412dd3f282b1fa20d3232d86ae060dec644249f6',
  '0x0545655dba5095d0b0b5329bac6dbd303d57cdc0',
]

const anvil = createTestClient({
  account: privateKeyToAccount(TEST_WALLET_PRIVATE_KEY),
  chain: mainnet,
  mode: 'anvil',
  transport: http('http://127.0.0.1:8545'),
})
  .extend(publicActions)
  .extend(walletActions)
  .extend((client) => ({
    async getWalletAddress() {
      return TEST_WALLET_ADDRESS
    },
    async setErc20Balance(address: Address, balance: bigint) {
      const whale = WHALES[Math.floor(Math.random() * WHALES.length)]

      await client.impersonateAccount({
        address: whale,
      })

      try {
        await client.writeContract({
          address,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [TEST_WALLET_ADDRESS, balance],
          account: whale,
        })

        await anvil.mine({
          blocks: 1,
        })
      } catch (e) {
        throw new Error(`Error setting ERC20 balance: ${e}`)
      } finally {
        await client.stopImpersonatingAccount({
          address: whale,
        })
      }
    },
    async getErc20Balance(address: Address) {
      return await client.readContract({
        address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [TEST_WALLET_ADDRESS],
      })
    },
  }))

let snapshotId: `0x${string}` | undefined

export const test = base.extend<{ anvil: typeof anvil; snapshot?: `0x${string}` }>({
  // eslint-disable-next-line no-empty-pattern
  async anvil({}, use) {
    await use(anvil)
  },
  snapshot: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      if (process.env.SMOKETEST_RUN) {
        await use(undefined)
        return
      }
      snapshotId = await anvil.snapshot()
      await use(snapshotId)
      if (snapshotId) {
        await anvil.revert({ id: snapshotId })
        snapshotId = undefined
      }
    },
    { auto: true },
  ],
})
