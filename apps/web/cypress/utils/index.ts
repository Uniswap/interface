import { Currency } from '@uniswap/sdk-core'
import { HardhatProvider } from 'cypress-hardhat/lib/browser/provider'
import { Utils } from 'cypress-hardhat/lib/browser/utils'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Mocha {
    interface Context {
      snapshots?: string[]
    }
  }
}

// Extended timeout for hardhat to mine a single block.
// Use as part of cy.hardhat().then({ timeout: HARDHAT_TIMEOUT }, (hardhat) => ...),
// but limit the hardhat usage *per thennable* to a single mined block.
export const HARDHAT_TIMEOUT = 48_000

export const getTestSelector = (selectorId: string) => `[data-testid=${selectorId}]`

export const getTestSelectorStartsWith = (selectorId: string) => `[data-testid^=${selectorId}]`

/** Gets the balance of a token as a Chainable. */
export function getBalance(token: Currency) {
  return cy
    .hardhat()
    .then((hardhat) => hardhat.getBalance(hardhat.wallet, token))
    .then((balance) => Number(balance.toFixed(1)))
}

/**
 * Sets up hardhat, and reverts it after tests to ensure isolation.
 * This reverts the fork, but not options like automine.
 */
export function setupHardhat(fn?: (hardhat: Utils) => Promise<void>) {
  let snapshot: string
  before(function () {
    // This stack - on the Mocha Context - tracks all snapshots derived from setupHardhat.
    this.snapshots ||= []

    return cy.hardhat().then({ timeout: HARDHAT_TIMEOUT }, async (hardhat) => {
      await fn?.(hardhat)
      snapshot = await hardhat.send('evm_snapshot', [])
      this.snapshots?.push(snapshot)
    })
  })
  after(function () {
    this.snapshots?.pop()
  })
}

//
// Reverts hardhat to the top snapshot on the stack.
// Must only be called once per test. Should only be called in setupTests.ts.
export function revertHardhat(this: Mocha.Context) {
  return cy.hardhat().then({ timeout: HARDHAT_TIMEOUT }, async (hardhat) => {
    const snapshot = this.snapshots?.pop()
    // Only revert the latest snapshot, as reverting past that will invalidate other snapshots.
    if (snapshot) {
      await hardhat.send('evm_revert', [snapshot])
      // Providers will not "rewind" to an older block number nor notice chain changes, so they must be reset.
      hardhat.providers.forEach((provider) => (provider as HardhatProvider).reset())
      this.snapshots?.push(await hardhat.send('evm_snapshot', []))
    }
  })
}

/** Revert back to MAINNET. Used after each test which changes chains. */
export function resetHardhatChain() {
  cy.hardhat().then((hardhat) => {
    // Intentionally not awaited for, to avoid stalling in case the method is stubbed.
    hardhat.send('wallet_switchEthereumChain', [{ chainId: '0x1' }])
  })
}
