// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { test as base } from '@playwright/test'
import { createTestClient, http, publicActions, walletActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const TEST_WALLET_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const anvil = createTestClient({
  account: privateKeyToAccount(TEST_WALLET_PRIVATE_KEY),
  chain: mainnet,
  mode: 'anvil',
  transport: http('http://127.0.0.1:8545'),
})
  .extend(publicActions)
  .extend(walletActions)

export const test = base.extend<{ anvil: typeof anvil }>({
  // eslint-disable-next-line no-empty-pattern
  async anvil({}, use) {
    await use(anvil)
  },
})
